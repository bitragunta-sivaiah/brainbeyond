import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { protect } from '../middleware/authMiddleware.js';
import { AdminQuestion, InterviewPreparation } from '../models/InterviewPreparation.js';

// --- IMPORTS FOR FILE PARSING ---
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';

dotenv.config();
const router = express.Router();

// --- CONFIGURATION ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// --- CORRECTION: Using the correct and latest model name for stability and access. ---
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * @description Retries an async function with exponential backoff for handling 503 errors.
 * @param {Function} asyncFn The async function to retry (e.g., an API call).
 * @param {number} retries Maximum number of retries.
 * @param {number} delay Initial delay in milliseconds.
 * @returns {Promise<any>} The result of the successful async function call.
 */
const retryWithBackoff = async (asyncFn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await asyncFn(); // Attempt the function
        } catch (error) {
            // Check if it's the specific 503 "overloaded" error
            if (error.response && error.response.status === 503) {
                if (i < retries - 1) {
                    console.log(`Model overloaded. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries - 1})`);
                    await sleep(delay);
                    delay *= 2; // Double the delay for the next attempt
                } else {
                    console.error("All retry attempts failed. The model remains overloaded.");
                    throw error; // If all retries fail, throw the original error
                }
            } else {
                // For any other error, throw it immediately without retrying
                throw error;
            }
        }
    }
};


const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const extractTextFromResume = async (file) => {
    const { buffer, mimetype } = file;
    try {
        if (mimetype === 'application/pdf') {
            const data = new Uint8Array(buffer);
            const pdf = await pdfjsLib.getDocument({ data }).promise;
            let textContent = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map(s => s.str).join(' ');
            }
            return textContent;
        }
        if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer });
            return value;
        }
        if (mimetype.startsWith('image/')) {
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
            return text;
        }
        console.warn(`Unsupported file type for text extraction: ${mimetype}`);
        return '';
    } catch (error) {
        console.error(`Error extracting text from ${mimetype}:`, error);
        throw new Error('Failed to read resume file content.');
    }
};

const generateFirstQuestion = async ({ type, targetRole, targetCompany, resumeText = '' }) => {
    let firstQuestion = "Let's begin. Can you start by telling me a little about yourself and why you're interested in this role?";
    let sourceQuestionId = null;

    if (type === 'resume-based' && resumeText) {
        const prompt = `
            You are an expert technical recruiter starting an interview for a "${targetRole}" role at "${targetCompany}".
            Based on the candidate's resume text below, craft a single, specific, and insightful opening question.
            Do NOT ask a generic "tell me about yourself." Pick a specific project or technology and ask them to elaborate.

            Resume Text:
            ---
            ${resumeText.substring(0, 4000)}
            ---

            Your output must be a valid JSON object with one key: "question".
        `;
        const result = await generateAiResponse(prompt);
        firstQuestion = result.question;
    } else if (type === 'role-based') {
        const adminQuestion = await AdminQuestion.findOne({
            targetCompany: new RegExp(targetCompany, 'i'),
            targetRole: new RegExp(targetRole, 'i'),
        });

        if (adminQuestion) {
            firstQuestion = adminQuestion.question;
            sourceQuestionId = adminQuestion._id;
        } else {
            const prompt = `
                You are an expert interviewer for a "${targetRole}" position at "${targetCompany}".
                Generate a relevant opening technical or behavioral question.
                Your output must be a valid JSON object with one key: "question".
            `;
            const result = await generateAiResponse(prompt);
            firstQuestion = result.question;
        }
    }
    return { question: firstQuestion, sourceQuestionId };
};

const checkOwnership = (doc, userId) => {
    return doc.user.toString() === userId.toString();
};

const handleGenerativeAIError = (error, res) => {
    console.error('Google Generative AI Error:', error.response ? error.response.data : error.message);
    if (error.response) {
        const { code, message } = error.response.data.error || {};
        return res.status(code || 500).json({ message: message || 'An error occurred with the AI generation service.' });
    }
    res.status(500).json({ message: 'An unknown error occurred with the AI service.' });
};

// --- CORRECTED: This function now includes the retry logic ---
const generateAiResponse = async (prompt) => {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
    };
    
    // Define the API call as a function that can be passed to the retry helper
    const apiCall = () => axios.post(GEMINI_API_URL, payload);

    try {
        // Wrap the API call with our new retry logic
        const response = await retryWithBackoff(apiCall);

        const responseText = response.data.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("AI returned non-JSON response after cleaning:", cleanedText);
            if (cleanedText !== responseText) console.error("Original AI response was:", responseText);
            throw new Error("The AI service returned an invalid response format.");
        }
    } catch (error) {
        // This will now only be called after all retries have failed, or for non-503 errors
        throw error;
    }
};

// =================================================================
// --- ADMIN QUESTION BANK CRUD ---
// (This section is unchanged and correct)
// =================================================================

router.post('/admin/questions', protect, async (req, res) => {
    try {
        const { question, targetCompany, targetRole, difficulty, topicsCovered } = req.body;
        if (!question || !targetRole) {
            return res.status(400).json({ message: 'Question text and target role are required.' });
        }
        const newQuestion = new AdminQuestion({ question, targetCompany, targetRole, difficulty, topicsCovered });
        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/admin/questions', protect, async (req, res) => {
    try {
        const { company, role } = req.query;
        const filter = {};
        if (company) filter.targetCompany = new RegExp(company, 'i');
        if (role) filter.targetRole = new RegExp(role, 'i');
        const questions = await AdminQuestion.find(filter).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/admin/questions/:questionId', protect, async (req, res) => {
    try {
        const updatedQuestion = await AdminQuestion.findByIdAndUpdate(req.params.questionId, req.body, { new: true, runValidators: true });
        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        res.json(updatedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/admin/questions/bulk-delete', protect, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of question IDs to delete.' });
        }
        const result = await AdminQuestion.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${result.deletedCount} questions deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// =================================================================
// --- USER PREPARATION PLAN CRUD ---
// (This section is unchanged and correct)
// =================================================================

router.get('/', protect, async (req, res) => {
    try {
        const preparations = await InterviewPreparation.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(preparations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { title, targetRole, experienceLevel } = req.body;
        if (!title || !targetRole || !experienceLevel) {
            return res.status(400).json({ message: 'Title, target role, and experience level are required.' });
        }
        const newPlan = new InterviewPreparation({ ...req.body, user: req.user.id });
        const savedPlan = await newPlan.save();
        res.status(201).json(savedPlan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Preparation plan not found.' });
        if (!checkOwnership(plan, req.user.id)) return res.status(403).json({ message: 'User not authorized.' });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        let plan = await InterviewPreparation.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Preparation plan not found.' });
        if (!checkOwnership(plan, req.user.id)) return res.status(403).json({ message: 'User not authorized.' });

        plan = await InterviewPreparation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Preparation plan not found.' });
        if (!checkOwnership(plan, req.user.id)) return res.status(403).json({ message: 'User not authorized.' });

        await plan.deleteOne();
        res.json({ message: 'Preparation plan removed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/bulk-delete', protect, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of plan IDs to delete.' });
        }
        const result = await InterviewPreparation.deleteMany({ _id: { $in: ids }, user: req.user.id });
        res.json({ message: `${result.deletedCount} plans deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// =================================================================
// --- SUB-DOCUMENT MANAGEMENT (Questions & Resources) ---
// (This section is unchanged and correct)
// =================================================================

router.post('/:id/questions/bulk-delete', protect, async (req, res) => {
    try {
        const { questionIds } = req.body;
        if (!questionIds || !Array.isArray(questionIds)) return res.status(400).json({ message: 'Please provide an array of question IDs.' });

        const plan = await InterviewPreparation.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $pull: { questions: { _id: { $in: questionIds } } } },
            { new: true }
        );
        if (!plan) return res.status(404).json({ message: 'Plan not found or not authorized.' });
        res.json({ message: 'Questions removed.', plan });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.patch('/:id/questions/:questionId/toggle-pin', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findOne({ _id: req.params.id, user: req.user.id });
        if (!plan) return res.status(404).json({ message: 'Plan not found or not authorized.' });

        const question = plan.questions.id(req.params.questionId);
        if (!question) return res.status(404).json({ message: 'Question not found in this plan.' });

        question.isPinned = !question.isPinned;
        await plan.save();
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/:id/resources/bulk-delete', protect, async (req, res) => {
    try {
        const { resourceIds } = req.body;
        if (!resourceIds || !Array.isArray(resourceIds)) return res.status(400).json({ message: 'Please provide an array of resource IDs.' });

        const plan = await InterviewPreparation.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $pull: { studyResources: { _id: { $in: resourceIds } } } },
            { new: true }
        );

        if (!plan) return res.status(404).json({ message: 'Plan not found or not authorized.' });
        res.json({ message: 'Resources removed.', plan });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/:id/resources/:resourceId', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findOne({ _id: req.params.id, user: req.user.id });
        if (!plan) return res.status(404).json({ message: 'Plan not found or not authorized.' });

        const resource = plan.studyResources.id(req.params.resourceId);
        if (!resource) return res.status(404).json({ message: 'Resource not found in this plan.' });

        Object.assign(resource, req.body);
        await plan.save();
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// =================================================================
// --- AI MOCK INTERVIEW & CONTENT GENERATION ---
// (This section is unchanged and correct)
// =================================================================

router.post('/:id/start-interview', protect, upload.single('resume'), async (req, res) => {
    try {
        const { type, targetCompany, targetRole } = req.body;
        if (!type) return res.status(400).json({ message: "Interview type is required." });

        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or not authorized.' });
        }

        let resumeText = '';
        let resumeUrl = '';

        if (type === 'resume-based') {
            if (!req.file) return res.status(400).json({ message: "A resume file is required for a 'resume-based' interview." });

            const uploadResult = await uploadToCloudinary(req.file.buffer);
            resumeUrl = uploadResult.secure_url;

            resumeText = await extractTextFromResume(req.file);
            if (!resumeText) return res.status(400).json({ message: 'Could not read text from resume file.' });
        }

        const { question, sourceQuestionId } = await generateFirstQuestion({
            type,
            targetRole: targetRole || plan.targetRole,
            targetCompany: targetCompany || plan.targetCompany,
            resumeText,
        });

        const interviewData = {
            type,
            targetCompany: targetCompany || plan.targetCompany,
            targetRole: targetRole || plan.targetRole,
            resumeFileUrl: resumeUrl,
            questions: [{ question, sourceQuestion: sourceQuestionId }],
        };

        plan.aiMockInterviews.push(interviewData);
        await plan.save();

        const newInterview = plan.aiMockInterviews.slice(-1)[0];
        res.status(201).json({
            message: "Interview started successfully.",
            interviewId: newInterview._id,
            question: newInterview.questions[0].question,
        });

    } catch (error) {
        if (error.response) return handleGenerativeAIError(error, res);
        console.error('Start Interview Error:', error);
        res.status(500).json({ message: error.message || 'Server Error during interview setup.' });
    }
});

router.post('/:id/interviews/:interviewId/respond', protect, async (req, res) => {
    try {
        const { answer } = req.body;
        if (!answer) return res.status(400).json({ message: 'Answer text is required.' });

        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or not authorized.' });
        }

       const interview = plan.aiMockInterviews.id(req.params.interviewId);
        if (!interview) return res.status(404).json({ message: 'Interview session not found.' });
        if (interview.overallScore != null) return res.status(400).json({ message: 'This interview has already ended.' });

        // --- NEW: Constants for interview length logic ---
        const INITIAL_QUESTION_LIMIT = 10;
        const EXTENDED_QUESTION_LIMIT = 15;

        // Update the current question with the user's answer
        const currentQuestionIndex = interview.questions.length - 1;
        interview.questions[currentQuestionIndex].studentRespondedAnswer = answer;

        const transcript = interview.questions.map(q => `Question: ${q.question}\nAnswer: ${q.studentRespondedAnswer || ''}`).join('\n\n---\n\n');

        // --- NEW: More efficient prompt to get feedback, rating, and next question at once ---
        const prompt = `
            You are an expert AI interviewer for a "${interview.targetRole}" position.
            The candidate just answered: "${answer}" to the question: "${interview.questions[currentQuestionIndex].question}".
            The full interview transcript is below:
            ---
            ${transcript}
            ---
            Based on the candidate's most recent answer, perform three tasks:
            1. Provide specific, constructive, and concise feedback on the answer itself.
            2. Provide a single-word rating for the answer from these options: "excellent", "good", "fair", "needs-improvement".
            3. Generate the next logical, relevant interview question to continue the conversation.

            Your output must be a valid JSON object with three keys: "feedback" (string), "rating" (string), and "nextQuestion" (string).
        `;

        const aiResponse = await generateAiResponse(prompt);
        const { feedback, rating, nextQuestion } = aiResponse;

        // Update the current question with the AI's analysis
        interview.questions[currentQuestionIndex].feedback = feedback;
        interview.questions[currentQuestionIndex].rating = rating;

        // --- NEW: Logic to check for interview extension ---
        // If this is the 10th question and the answer is good, extend the interview
        if (interview.questions.length === INITIAL_QUESTION_LIMIT && !interview.isExtended) {
            if (rating === 'excellent' || rating === 'good') {
                interview.isExtended = true;
            }
        }

        // --- NEW: Check if the interview should end ---
        const currentLimit = interview.isExtended ? EXTENDED_QUESTION_LIMIT : INITIAL_QUESTION_LIMIT;
        let isInterviewOver = interview.questions.length >= currentLimit;

        // --- NEW: Personalize feedback ---
        const studentName = plan.user?.name || interview.resumeFileName;
        let personalizedFeedback;
        if (rating === 'excellent' || rating === 'good') {
            const prefix = studentName ? `Good answer, ${studentName}. ` : "Good answer. ";
            personalizedFeedback = prefix + feedback;
        } else {
            personalizedFeedback = `Here's some feedback on that: ${feedback}`;
        }

        if (isInterviewOver) {
            await plan.save();
            return res.json({
                feedback: personalizedFeedback,
                nextQuestion: null, // Signal to the frontend that the interview is complete
                message: "You've reached the end of the interview. You can now request the final report."
            });
        }

        // If not over, add the next question and respond
        interview.questions.push({ question: nextQuestion });
        await plan.save();

        res.json({
            feedback: personalizedFeedback,
            nextQuestion: nextQuestion,
        });

    } catch (error) {
        handleGenerativeAIError(error, res);
    }

});

router.post('/:id/interviews/:interviewId/handle-issue', protect, async (req, res) => {
    try {
        const { issueType, currentQuestion } = req.body;
        if (!issueType || !currentQuestion) return res.status(400).json({ message: "Issue type and current question are required." });

        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or not authorized.' });
        }

        const interview = plan.aiMockInterviews.id(req.params.interviewId);
        if (!interview) return res.status(404).json({ message: 'Interview session not found.' });

        const prompt = `
            You are an empathetic AI interviewer for a "${interview.targetRole}" position.
            The candidate is struggling with: "${currentQuestion}". Their issue is: "${issueType}".

            Your task is to respond helpfully.
            - If 'need_hint', provide a guiding hint without the full answer.
            - If 'irrelevant_question', acknowledge gracefully and offer an alternative question.
            - If 'too_hard', rephrase the question in a simpler way.

            Your output must be a valid JSON object with two keys:
            1. "empatheticMessage": A supportive message (e.g., "No problem, let's break it down.").
            2. "response": The actual hint, rephrased question, or alternative question.
        `;
        const parsedData = await generateAiResponse(prompt);
        res.json(parsedData);
    } catch (error) {
        handleGenerativeAIError(error, res);
    }
});

router.post('/:id/interviews/:interviewId/end-interview', protect, async (req, res) => {
    try {
        // 1. Find the parent preparation plan and validate ownership
        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or you are not authorized.' });
        }

        // 2. Find the specific interview session within the plan
        const interview = plan.aiMockInterviews.id(req.params.interviewId);
        if (!interview) {
            return res.status(404).json({ message: 'Interview session not found.' });
        }
        
        // 3. Generate feedback for each question concurrently
        const feedbackPromises = interview.questions.map(async (q) => {
            const prompt = `
                You are an expert AI career coach for a "${interview.targetRole}" role.
                Analyze the following question and the user's answer. Provide concise, constructive feedback and a rating.

                Question: "${q.question}"
                User's Answer: "${q.studentRespondedAnswer || '(No answer provided)'}"

                Your output MUST be a valid JSON object with two keys:
                1. "feedback": A concise HTML string (e.g., using <p> and <strong> tags for emphasis) providing specific feedback on the answer's strengths and weaknesses.
                2. "rating": A single string value from the following options: "excellent", "good", "fair", "needs-improvement".

                Ensure the JSON is well-formed.
            `;
            
            try {
                const parsedData = await generateAiResponse(prompt);
                // Update the question object directly with the feedback and rating
                q.feedback = parsedData.feedback;
                q.rating = parsedData.rating;
            } catch (error) {
                console.error(`Failed to generate feedback for question: ${q.question}`, error);
                // Assign default error values if a single AI call fails
                q.feedback = '<p>Could not generate feedback for this question due to an error.</p>';
                q.rating = 'needs-improvement';
            }
        });

        // Wait for all individual feedback requests to complete
        await Promise.all(feedbackPromises);


        // 4. Now that individual feedback is generated, create a comprehensive transcript for the final review.
        const transcriptWithFeedback = interview.questions.map(q => 
            `Question: ${q.question}\nAnswer: ${q.studentRespondedAnswer || '(No answer provided)'}\nFeedback: ${q.feedback}\nRating: ${q.rating}`
        ).join('\n\n---\n\n');

        // 5. Generate overall summary feedback based on the full transcript
        const overallPrompt = `
            You are an expert AI career coach providing a final performance review for a "${interview.targetRole}" position.
            Analyze the following complete interview transcript, which includes individual feedback for each answer, and provide a comprehensive final analysis.

            Full Transcript:
            ${transcriptWithFeedback}

            Your output must be a valid JSON object with two keys. Use HTML formatting for lists and emphasis in the 'overallFeedback' section to ensure readability.
            1. "overallFeedback": A detailed string containing three sections: 
               - "<h3>Summary</h3><p>...</p>"
               - "<h3>Strengths</h3><ul><li>...</li></ul>"
               - "<h3>Areas for Improvement</h3><ul><li>...</li></ul>"
            2. "overallScore": A single integer between 0 and 100 representing their final performance.

            Ensure the JSON is well-formed, with no trailing commas or syntax errors.
        `;

        const overallParsedData = await generateAiResponse(overallPrompt);

        // 6. Update the interview object with the final summary
        interview.overallFeedback = overallParsedData.overallFeedback;
        interview.overallScore = overallParsedData.overallScore;
        
        // 7. Save all changes to the database
        await plan.save();

        // 8. Return the fully updated interview session
        res.json(interview);

    } catch (error) {
        // Handle potential errors from the overall AI call or database save
        handleGenerativeAIError(error, res);
    }
});

router.post('/:id/generate-questions', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or not authorized.' });
        }
        const prompt = `
            You are a hiring manager for a "${plan.targetRole}" role.
            Generate 5 relevant interview questions for a candidate with "${plan.experienceLevel}" of experience. Include a mix of behavioral and technical questions.
            For EACH question, provide a detailed, expert-level sample answer formatted as a single HTML string, including headings (<h3>), paragraphs (<p>), code blocks (<pre><code>), and lists (<ul><li>). CRITICAL: All HTML characters inside the <code> block MUST be properly escaped (e.g., &lt;).

            Your final output must be a valid JSON object with a single key "questions".
            This key's value must be an array of 5 objects, each with THREE keys: "question" (string), "difficulty" (string enum of 'easy', 'medium', or 'hard'), and "answer" (the complete HTML string).
        `;
        const parsedData = await generateAiResponse(prompt);
        if (parsedData.questions && Array.isArray(parsedData.questions)) {
            const newQuestions = parsedData.questions.map(q => ({
                question: q.question,
                difficulty: q.difficulty,
                aiGeneratedAnswers: [q.answer]
            }));
            plan.questions.push(...newQuestions);
            await plan.save();
            res.status(201).json(plan);
        } else {
            res.status(400).json({ message: 'AI failed to generate valid questions.' });
        }
    } catch (error) {
        handleGenerativeAIError(error, res);
    }
});

/**
 * @route   POST /api/interview-prep/:id/generate-resources
 * @desc    Generate a list of study resources using AI
 * @access  Private
 */
router.post('/:id/generate-resources', protect, async (req, res) => {
    try {
        const plan = await InterviewPreparation.findById(req.params.id);
        if (!plan || !checkOwnership(plan, req.user.id)) {
            return res.status(404).json({ message: 'Plan not found or not authorized.' });
        }

        const prompt = `
            You are an expert career coach for a "${plan.targetRole}".
            Generate 5 high-quality, up-to-date study resources for someone with "${plan.experienceLevel}" of experience.

            Your output must be a valid JSON object with a single key "resources".
            This key should contain an array of 5 objects, where each object has SIX keys:
            1.  "name" (string): The clear and descriptive title of the resource.
            2.  "url" (string): A valid, full, and direct URL.
            3.  "type" (enum of 'documentation', 'article', 'video', 'course', 'book', 'tool'): The type of resource.
            4.  "justification" (string): A single sentence explaining WHY this specific resource is valuable for the candidate.
            
            // --- CORRECTION: The enum values now match the Mongoose Schema exactly. ---
            5.  "recommendation" (enum of 'best', 'good', 'average'): Your rating of the resource quality. 'best' for essential resources and 'good' for highly recommended ones.
            
            6.  "recommendedOrder" (number): A sequential number (1 to 5) indicating the suggested order to study them.
        `;

        const parsedData = await generateAiResponse(prompt);

        if (parsedData.resources && Array.isArray(parsedData.resources)) {
            const existingUrls = new Set(plan.studyResources.map(r => r.url));
            const newResources = parsedData.resources.filter(r => r.url && !existingUrls.has(r.url));

            if (newResources.length === 0) {
                return res.status(200).json({ message: 'No new unique resources were generated. Your list is up to date!', plan });
            }

            plan.studyResources.push(...newResources);
            await plan.save(); // This will now succeed without a validation error
            res.status(201).json(plan);
        } else {
            res.status(400).json({ message: 'AI failed to generate valid resources.' });
        }
    } catch (error) {
        // Mongoose validation errors will be caught here if any other mismatch occurs
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Data validation failed: ${error.message}` });
        }
        handleGenerativeAIError(error, res);
    }
});

export default router;