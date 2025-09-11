import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import mammoth from 'mammoth';
import { protect } from '../middleware/authMiddleware.js';
import ATSResumeChecker from '../models/atsResumeCheckerModel.js';

// Initialize Express router
const router = express.Router();

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Cloudinary (ensure environment variables are set)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use the provided API URL and key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper function to extract text from a DOCX file buffer
const extractTextFromBuffer = async (buffer, mimetype) => {
    try {
        if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return result.value;
        } else {
            throw new Error('Unsupported file type. Only DOCX are allowed with this configuration.');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from the resume file.');
    }
};

// Main POST route for the ATS resume check
router.post('/', protect, upload.single('resume'), async (req, res) => {
    // 1. Validate incoming request
    if (!req.file) {
        return res.status(400).json({ message: 'No resume file uploaded.' });
    }
    const { jobDescriptionText } = req.body;
    if (!jobDescriptionText) {
        return res.status(400).json({ message: 'Job description text is required.' });
    }

    try {
        // 2. Upload file to Cloudinary and get a URL
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'raw' }, (error, res) => {
                if (error) reject(error);
                resolve(res);
            });
            uploadStream.end(req.file.buffer);
        });

        // 3. Extract plain text from the resume file
        const resumeText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);

        // Define a comprehensive list of action words
        const actionWords = [
            "Achieved", "Analyzed", "Authored", "Built", "Collaborated", "Coordinated", "Created", "Designed",
            "Developed", "Directed", "Engineered", "Enhanced", "Established", "Evaluated", "Executed",
            "Facilitated", "Generated", "Implemented", "Improved", "Initiated", "Innovated", "Led",
            "Managed", "Mentored", "Modeled", "Monitored", "Negotiated", "Operated", "Optimized",
            "Organized", "Performed", "Planned", "Processed", "Produced", "Programmed", "Project-managed",
            "Reduced", "Researched", "Resolved", "Reviewed", "Scheduled", "Streamlined", "Supervised",
            "Trained", "Transformed", "Upgraded", "Utilized", "Validated", "Verified", "Wrote"
        ];

        // 4. Perform AI analysis using a direct fetch call to Gemini
        // UPDATED PROMPT: Enhanced for 100% accuracy (as much as possible with LLMs) and specific action words
        const prompt = `You are an extremely critical and precise ATS (Applicant Tracking System) and a highly experienced career coach. Your primary goal is to provide a 100% accurate and actionable analysis of a resume against a given job description. Provide the response as a perfectly valid JSON object. Do not include any text, notes, or explanations outside of the JSON object itself. Do not use markdown backticks.

        Job Description:
        ${jobDescriptionText}

        Resume:
        ${resumeText}

        Analyze the resume with extreme scrutiny and provide a JSON object with the following keys:
        1.  **atsScore**: A numerical score from 0 to 100 representing the exact percentage match of the resume's content (keywords, skills, experience) to the job description. Be very strict in your scoring.
        2.  **summary**: A concise, direct, and critical summary of the analysis, highlighting key strengths and weaknesses in relation to the job description.
        3.  **keywords**: An object with two arrays: 'matched' (exact keywords and phrases from the job description found in the resume) and 'missing' (crucial keywords and phrases from the job description that are entirely absent or poorly represented in the resume).
        4.  **improvements**: An array of highly specific, actionable suggestions for improvement. Each suggestion must be a clear, concise instruction. For example, instead of "improve bullet points", state "Rewrite bullet point X to include quantifiable achievement Y by doing Z."
        5.  **tips**: An array of general, professional tips for resume optimization.
        6.  **suggestActionWords**: An array of powerful action verbs from the following list that the candidate could use to enhance their bullet points: ${JSON.stringify(actionWords)}. Only include words from this list that would genuinely improve the resume based on the job description.
        7.  **sectionWaysChanges**: An array of objects, where each object represents a resume section (e.g., "Summary", "Experience", "Skills", "Education", "Projects"). Each object must have:
            - sectionName: String (e.g., "Summary", "Work Experience", "Technical Skills", "Education", "Projects")
            - sectionMistakesSentences: Array of Strings describing specific mistakes or areas for improvement within that section. If no mistakes, provide an empty array.
            - bestAIGenerateSentences: Array of Strings with improved, ATS-optimized sentences for that section, directly addressing the identified mistakes or enhancing weak points. If no improvements, provide an empty array.
            - rating: Number from 0 to 10 for the section's quality, with 10 being perfect alignment with the job description.
        `;

        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API call failed with status: ${geminiResponse.status}. Details: ${errorText}`);
        }

        const geminiResult = await geminiResponse.json();
        let responseText = geminiResult.candidates[0].content.parts[0].text;

        // Clean up the response text before parsing
        responseText = responseText.replace(/```json|```/g, '').trim();

        let analysisData;
        try {
            analysisData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Initial JSON parse failed. Raw text:', responseText);
            // Attempt a more robust cleanup for common JSON issues from LLMs
            const cleanedResponse = responseText
                .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas before ] or }
                .replace(/([}\]])\s*(\s*)"/g, '$1,"') // Ensure comma between objects/arrays
                .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
                .replace(/'/g, '"'); // Replace single quotes with double quotes

            try {
                analysisData = JSON.parse(cleanedResponse);
            } catch (finalParseError) {
                console.error('Final JSON parse failed:', finalParseError);
                throw new Error('Failed to parse Gemini API response into a valid JSON object after multiple attempts.');
            }
        }

        // 5. Save the analysis to your database
        const newAnalysis = new ATSResumeChecker({
            userId: req.user._id,
            resumeFile: {
                path: uploadResult.secure_url,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            },
            resumeText,
            jobDescriptionText,
            matchScore: analysisData.atsScore,
            keywordAnalysis: {
                foundKeywords: analysisData.keywords.matched.map(kw => ({ keyword: kw, count: 1 })), // Assuming count of 1 for simplicity
                missingKeywords: analysisData.keywords.missing
            },
            suggestions: analysisData.improvements,
            tips: analysisData.tips,
            suggestActionWords: analysisData.suggestActionWords,
            sectionWaysChanges: analysisData.sectionWaysChanges,
        });

        await newAnalysis.save();

        // 6. Respond to the client with the full analysis
        res.status(200).json({
            message: 'Resume analyzed successfully.',
            data: newAnalysis,
            geminiAnalysis: analysisData
        });

    } catch (error) {
        console.error('Full analysis failed:', error);
        res.status(500).json({
            message: 'Internal server error during resume analysis.',
            error: error.message
        });
    }
});

export default router;
