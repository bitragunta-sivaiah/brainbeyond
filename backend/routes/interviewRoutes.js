import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import { protect } from '../middleware/authMiddleware.js';
import InterviewPreparation from '../models/InterviewPreparation.js';

// --- CONFIGURATIONS ---

// 1. Cloudinary Setup
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Multer's memory storage to handle file buffer directly
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// 2. Gemini API Setup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Corrected to a valid, publicly available model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;


// Added required worker configuration for pdfjs-dist on the server
pdfjsLib.GlobalWorkerOptions.workerSrc = `../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`;


// --- HELPER FUNCTIONS ---

/**
 * A robust wrapper for the fetch API that includes automatic retries with exponential backoff.
 * This makes API calls resilient to temporary server errors (5xx) and rate limiting (429).
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch call (method, headers, body).
 * @param {number} retries - The maximum number of retries.
 * @returns {Promise<Response>} The fetch response object.
 */
const fetchWithRetry = async (url, options, retries = 5) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // Success (2xx) or a client-side error (4xx) that shouldn't be retried
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }
            // Specific check for retryable statuses (server errors or rate limiting)
            if (response.status === 429 || response.status >= 500) {
                 console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying in ${Math.pow(2, i)}s...`);
                 lastError = new Error(`API call failed with status: ${response.status}`);
                 // Exponential backoff with jitter: 2^i * 1000ms + random ms
                 const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                 await new Promise(resolve => setTimeout(resolve, delay));
                 continue; // Move to the next iteration to retry
            }
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed with network error: ${error.message}. Retrying...`);
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // If all retries fail, throw the last captured error
    throw new Error(`API call failed after ${retries} attempts. Last error: ${lastError.message}`);
};

/**
 * REFACTORED: Calls the Gemini API using the robust fetchWithRetry helper.
 * @param {string} prompt The prompt to send to the AI.
 * @returns {Promise<object>} The parsed JSON response from the AI.
 */
const callGemini = async (prompt) => {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };
    try {
        // This now automatically handles retries for you
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error after retries:", errorBody);
            throw new Error(`Gemini API request failed permanently with status ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error('Invalid response structure from AI service.');
        }

        const rawJsonString = data.candidates[0].content.parts[0].text;
        const cleanedJsonString = rawJsonString.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanedJsonString);

    } catch (error) {
        console.error('Error in callGemini function:', error);
        throw new Error('Failed to communicate with the AI service after multiple attempts.');
    }
};

const extractTextFromBuffer = async (buffer, mimetype) => {
    // This function is well-written, no changes needed.
    if (mimetype === 'application/pdf') {
        const data = new Uint8Array(buffer);
        const doc = await pdfjsLib.getDocument(data).promise;
        let text = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
        }
        return text;
    }
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    }
    throw new Error('Unsupported file type for text extraction.');
};

const uploadBufferToCloudinary = (buffer) => {
    // This function is well-written, no changes needed.
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'interview_resumes' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
}; 

const router = express.Router();
router.use(protect); // Protect all subsequent routes in this file

const getPreparation = async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    try {
        req.preparation = await InterviewPreparation.findOne({ _id: req.params.id, user: req.user._id });
        if (!req.preparation) {
            return res.status(404).json({ success: false, message: 'Preparation plan not found or you are not authorized.' });
        }
        next();
    } catch (error) {
        console.error("Middleware getPreparation error:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching document.' });
    }
};
// CREATE a new Interview Preparation (with AI-generated learning plan)
router.post('/', async (req, res) => {
    const { title, target, targetDate, description } = req.body;
    if (!title || !target || !target.role || !target.company) {
        return res.status(400).json({ success: false, message: 'Title and target (role, company) are required.' });
    }
    try {
        const creationPrompt = `
        You are an expert career coach. Generate a comprehensive interview preparation plan in a single JSON object for:
        - Role: "${target.role}", Company: "${target.company}", Level: "${target.level || 'any'}"

        The root JSON object must have "learning" and "practice" keys. Adhere STRICTLY to the following rules:

        1. "learning" Object:
           - "studyTopics": Array of 8-10 topics. Each object MUST have 'topic', 'category', 'priority', and 'resources'. 'category' MUST BE one of: 'data-structures', 'algorithms', 'system-design', 'behavioral', 'domain-knowledge', 'company-values'. 'priority' MUST BE a Number from 1 to 5.
           - "resources": Array of 1-2 objects per topic. Each object MUST have 'title', 'url', and 'type'. 'type' MUST BE one of: 'article', 'video', 'course', 'documentation', 'book'.
           - "preparedQuestions": Array of 8-10 questions. Each object MUST have 'question', 'category', 'keywords', 'answer', and 'notes' (using simple HTML). 'category' MUST BE one of: 'behavioral', 'technical', 'situational', 'company-specific', 'general'.

        2. "practice" Object:
           - "practiceProblems": Array of 2-3 coding problems. Each object MUST have 'title', 'url', 'source', and 'difficulty'. 'source' MUST BE one of: 'leetcode', 'hackerrank', 'codewars', 'custom', 'other'. 'difficulty' MUST BE one of: 'easy', 'medium', 'hard'.
           - "storyBank": Array of 5-6 behavioral prompts. Each object MUST have: 'prompt', 'situation', 'task', 'action', 'result', and 'keywords'. For ONE prompt, provide a detailed example.

        Do not repeat topics or questions. Output ONLY the raw JSON object. Do not use any markdown formatting.`;

        const aiGeneratedPlan = await callGemini(creationPrompt);

        if (!aiGeneratedPlan.learning || !aiGeneratedPlan.practice) {
            throw new Error('AI failed to generate a valid learning and practice plan.');
        }

        const newPreparation = await InterviewPreparation.create({
            user: req.user._id, title, target, targetDate, description,
            learning: aiGeneratedPlan.learning,
            practice: aiGeneratedPlan.practice,
            assessment: { aiMockInterviews: [] } // Initialize assessment
        });
        res.status(201).json({ success: true, data: newPreparation });
    } catch (error) {
        console.error("Error creating preparation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET ALL Interview Preparations for the user
router.get('/', async (req, res) => {
    try {
        const preparations = await InterviewPreparation.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: preparations.length, data: preparations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error retrieving preparation plans.' });
    }
});

// GET a single Interview Preparation
router.get('/:id', getPreparation, (req, res) => {
    res.status(200).json({ success: true, data: req.preparation });
});

// UPDATE a single Interview Preparation
router.put('/:id', getPreparation, async (req, res) => {
    try {
        const updatedPreparation = await InterviewPreparation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: updatedPreparation });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE a single Interview Preparation
router.delete('/:id', getPreparation, async (req, res) => {
    try {
        await req.preparation.deleteOne();
        res.status(200).json({ success: true, message: 'Preparation plan deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while deleting.' });
    }
});


// --- LEARNING SECTION: GENERATE MORE & BATCH DELETE ROUTES ---

// GENERATE MORE learning items for an existing plan
router.post('/:id/learning/generate', getPreparation, async (req, res) => {
    try {
        const existingTopics = req.preparation.learning.studyTopics.map(t => t.topic).join('; ');
        const existingQuestions = req.preparation.learning.preparedQuestions.map(q => q.question).join('; ');

        const generateMorePrompt = `
        You are an expert career coach helping a user expand their interview plan for a "${req.preparation.target.role}" role.
        The user already has these study topics: [${existingTopics}] and prepared questions: [${existingQuestions}].

        Your task is to generate NEW, ADDITIONAL learning items that are NOT in the lists above.
        Generate a single JSON object with a "learning" key. Adhere STRICTLY to the following rules:

        "learning" Object NOte:Dont repeat the same topic or question in both sections:
            - "studyTopics": Array of 3-4 NEW topics. Each object MUST have 'topic', 'category', 'priority', and 'resources'.
              - 'category' MUST BE one of: 'data-structures', 'algorithms', 'system-design', 'behavioral', 'domain-knowledge', 'company-values'.
              - 'priority' MUST BE a Number from 1 to 5.
            - "resources": Array of 3 objects per topic. Each MUST have 'title', 'url', and 'type'.
              - 'type' MUST BE one of: 'article', 'video', 'course', 'documentation', 'book'.
            - "preparedQuestions": Array of 4-5 NEW questions. Each MUST have 'question','name','notes 'category', and 'keywords'.
              - 'category' MUST BE one of: 'behavioral', 'technical', 'situational', 'company-specific', 'general'.

        Output ONLY the raw JSON object.`;

        const aiResponse = await callGemini(generateMorePrompt);

        if (!aiResponse.learning || (!aiResponse.learning.studyTopics && !aiResponse.learning.preparedQuestions)) {
            return res.status(500).json({ success: false, message: 'AI failed to generate valid additional learning items.' });
        }

        const newTopics = aiResponse.learning.studyTopics || [];
        const newQuestions = aiResponse.learning.preparedQuestions || [];

        req.preparation.learning.studyTopics.push(...newTopics);
        req.preparation.learning.preparedQuestions.push(...newQuestions);

        await req.preparation.save();

        res.status(201).json({
            success: true,
            message: 'Successfully added new learning items.',
            data: req.preparation.learning
        });

    } catch (error) {
        console.error("Error generating more learning items:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id/learning/study-topics', getPreparation, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'An array of item IDs is required.' });
    }
    req.preparation.learning.studyTopics.pull(...ids);
    await req.preparation.save();
    res.status(200).json({ success: true, message: 'Selected study topics deleted.' });
});

router.delete('/:id/learning/prepared-questions', getPreparation, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'An array of item IDs is required.' });
    }
    req.preparation.learning.preparedQuestions.pull(...ids);
    await req.preparation.save();
    res.status(200).json({ success: true, message: 'Selected questions deleted.' });
});


// --- PRACTICE SECTION: AI GENERATION & CRUD ROUTES ---
router.post('/:id/practice/generate', getPreparation, async (req, res) => {
    try {
        const existingProblems = req.preparation.practice.practiceProblems.map(p => p.title).join('; ');
        const existingStories = req.preparation.practice.storyBank.map(s => s.prompt).join('; ');

        const prompt = ` 
        Based on the interview target (Role: ${req.preparation.target.role}), generate a JSON object with "practiceProblems" and "storyBank" keys. Adhere STRICTLY to the following rules:
        - "practiceProblems": Array of 3 NEW and RELEVANT coding problems. Exclude these: [${existingProblems}]. Each object MUST have 'title', 'url', 'source', and 'difficulty'.
          - 'source' MUST BE one of: 'leetcode', 'hackerrank', 'codewars', 'custom', 'other'.
          - 'difficulty' MUST BE one of: 'easy', 'medium', 'hard'.
        - "storyBank": Array of 3 NEW behavioral story prompts. Exclude these: [${existingStories}]. Each MUST include 'prompt', 'situation', 'task', 'action', 'result', and 'keywords' .
        Output ONLY the raw JSON object.`;
        
        const aiPractice = await callGemini(prompt);

        if (!aiPractice.practiceProblems && !aiPractice.storyBank) {
            throw new Error("AI failed to generate valid practice items.");
        }

        if (aiPractice.practiceProblems) req.preparation.practice.practiceProblems.push(...aiPractice.practiceProblems);
        if (aiPractice.storyBank) req.preparation.practice.storyBank.push(...aiPractice.storyBank);
        await req.preparation.save();
        res.status(201).json({ success: true, data: req.preparation.practice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate practice items.' });
    }
});

router.post('/:id/practice/problems', getPreparation, async (req, res) => {
    try {
        req.preparation.practice.practiceProblems.push(req.body);
        await req.preparation.save();
        res.status(201).json({ success: true, data: req.preparation.practice.practiceProblems.slice(-1)[0] });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});


// --- ASSESSMENT SECTION: RESUME & MOCK INTERVIEW ROUTES ---
router.post('/:id/assessment/upload-resume', getPreparation, upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    try {
        const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer);
        const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        res.status(200).json({ success: true, url: cloudinaryResult.secure_url, extractedText });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to process resume: ${error.message}` });
    }
});

router.post('/:id/assessment/start', getPreparation, async (req, res) => {
    const { type, difficulty, resumeUrl, resumeContent } = req.body;
    try {
        const userName = req.user.name || 'there'; // Use a fallback if the name isn't available

        let initialPrompt;
        if (type === 'resume-based' && resumeContent) {
            initialPrompt = `Act as an AI interviewer for a "${req.preparation.target.role}" role. Start a '${type}' mock interview. Say "Hello, ${userName}. Let's get started." Then, ask one insightful opening question based on this resume excerpt: "${resumeContent.substring(0, 2000)}...". Return a JSON object with a single key "question".`;
        } else {
            initialPrompt = `Act as an AI interviewer for a "${req.preparation.target.role}" role. Start a '${type}' mock interview at '${difficulty}' difficulty. Say "Hello, ${userName}. Let's get started." Then, ask an appropriate opening question. Return a JSON object with a single key "question".`;
        }
        
        const response = await callGemini(initialPrompt);
        
        const newInterview = {
            _id: new mongoose.Types.ObjectId(),
            type,
            difficulty,
            resumeUrl,
            transcript: [{ speaker: 'ai', content: response.question, timestamp: new Date() }],
        };
        
        req.preparation.assessment.aiMockInterviews.push(newInterview);
        await req.preparation.save();
        
        res.status(201).json({ success: true, mockInterviewId: newInterview._id, firstQuestion: response.question });
    } catch (error) {
        console.error("Error starting interview:", error);
        res.status(500).json({ success: false, message: 'Failed to start mock interview.' });
    }
});

// NEW ROUTE FOR CONTINUOUS CONVERSATION
router.post('/:id/assessment/:mockId/next', getPreparation, async (req, res) => {
    const { transcript } = req.body;
    const { mockId } = req.params;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        return res.status(400).json({ success: false, message: 'Transcript is required.' });
    }
    
    try {
        const mockInterview = req.preparation.assessment.aiMockInterviews.id(mockId);
        if (!mockInterview) {
            return res.status(404).json({ success: false, message: 'Mock interview session not found.' });
        }

        // Update the transcript in the database with the latest from the client
        mockInterview.transcript = transcript;

        const transcriptText = transcript.map(t => `${t.speaker}: ${t.content}`).join('\n');
        
        const nextQuestionPrompt = `
             You are an AI interviewer conducting a mock interview for a "${req.preparation.target.role}" role.
             The current conversation is below:
             ---
             ${transcriptText}
             ---
             Based on the user's last answer, ask the next logical and relevant question.
             Consider the overall interview structure. If the previous questions were behavioral, introduce a technical or situational question, and vice-versa. Do not end the interview.
             Return a JSON object with a single key "nextQuestion".
        `;
        
        const response = await callGemini(nextQuestionPrompt);
        const newQuestion = response.nextQuestion;

        // Add the new AI question to the transcript
        mockInterview.transcript.push({ speaker: 'ai', content: newQuestion, timestamp: new Date() });

        await req.preparation.save();

        res.status(200).json({ success: true, nextQuestion: newQuestion });

    } catch (error) {
        console.error("Error getting next question:", error);
        res.status(500).json({ success: false, message: 'Failed to get next question from AI.' });
    }
});


router.post('/:id/assessment/:mockId/warning', getPreparation, async (req, res) => {
    const { transcript } = req.body;
    if (!transcript || transcript.length === 0) {
        return res.status(400).json({ success: false, message: 'Transcript is required.' });
    }
    try {
        const transcriptText = transcript.map(t => `${t.speaker}: ${t.content}`).join('\n');
        const warningPrompt = `Analyze this interview transcript: "${transcriptText}". The 'user' is taking a wrong direction or going off-topic. Generate a gentle, one-sentence warning to redirect them back to the interview's core topics. Return JSON: { "warning": "..." }`;
        const response = await callGemini(warningPrompt);
        res.status(200).json({ success: true, warning: response.warning });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate warning.' });
    }
});

router.post('/:id/assessment/:mockId/end', getPreparation, async (req, res) => {
    const { transcript } = req.body;
    const { mockId } = req.params;

    if (!transcript || !Array.isArray(transcript)) {
        return res.status(400).json({ success: false, message: 'A valid transcript array is required.' });
    }
    
    try {
        const mockInterview = req.preparation.assessment.aiMockInterviews.id(mockId);
        if (!mockInterview) {
            return res.status(404).json({ success: false, message: 'Mock interview not found.' });
        }
        
        const transcriptText = transcript.map(t => `${t.speaker}: ${t.content}`).join('\n');

        const feedbackPrompt = `
        You are a world-class interview coach. Analyze the following interview transcript for a "${req.preparation.target.role}" role and provide detailed feedback.
        Transcript:
        ---
        ${transcriptText}
        ---
        Your Task: Generate a single JSON object with the following keys:
        - "overallScore": A number from 0-100.
        - "performanceSummary": A concise paragraph summarizing performance.
        - "contentAnalysis": An object with "clarity", "conciseness", "technicalAccuracy", each with "score" (0-10) and "feedback" (a string).
        - "communicationAnalysis": An object with "pacing" ("too-slow", "good", "too-fast"), "fillerWords" ({"count": number, "words": [string]}), and "confidenceLevel" ("low", "medium", "high").
        - "suggestedAnswers": An array of 1-2 objects, each with "question" and "suggestedAnswer".
        
        Output ONLY the raw JSON object.`;

        const aiFeedback = await callGemini(feedbackPrompt);
        
        const interviewDurationSeconds = Math.round((new Date() - new Date(mockInterview.date)) / 1000);

        // This atomic update prevents race conditions (VersionError).
        const updateResult = await InterviewPreparation.updateOne(
            { _id: req.preparation._id, 'assessment.aiMockInterviews._id': mockId },
            { 
                $set: {
                    'assessment.aiMockInterviews.$[interview].transcript': transcript,
                    'assessment.aiMockInterviews.$[interview].aiFeedback': aiFeedback,
                    'assessment.aiMockInterviews.$[interview].interviewDurationSeconds': interviewDurationSeconds,
                }
            },
            { 
                arrayFilters: [{ 'interview._id': new mongoose.Types.ObjectId(mockId) }] 
            }
        );

        if (updateResult.modifiedCount === 0) {
            console.warn(`Interview end: No document was modified for prepId ${req.preparation._id} and mockId ${mockId}`);
        }
        
        res.status(200).json({ success: true, data: { aiFeedback } });

    } catch (error) {
        console.error("Error ending interview:", error);
        res.status(500).json({ success: false, message: 'Failed to end interview and generate feedback.' });
    }
});



export default router;