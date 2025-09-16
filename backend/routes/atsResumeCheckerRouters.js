import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import { protect } from '../middleware/authMiddleware.js';
import ATSResumeChecker from '../models/atsResumeCheckerModel.js';
import fetch from 'node-fetch'; // Required for making API calls in Node.js

// Initialize Express router
const router = express.Router();

// Configure Multer for in-memory storage with file filtering
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, JPG, or PNG file.'), false);
        }
    }
});

// Configure Cloudinary (ensure environment variables are set)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use a stable Gemini model version for production
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

/**
 * **Robust Text Extraction Helper**
 * Extracts text from various file formats (PDF, DOCX, TXT, Images).
 * @param {object} file - The file object from Multer.
 * @returns {Promise<string>} The extracted plain text from the file.
 */
const extractTextFromFile = async (file) => {
    switch (file.mimetype) {
        case 'application/pdf':
            pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.mjs`;
            const doc = await pdfjsLib.getDocument(new Uint8Array(file.buffer)).promise;
            let fullText = '';

            // First pass: Try standard text extraction
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            if (fullText.trim()) return fullText;

            // Fallback: If no text, use OCR on each page
            console.warn('Standard PDF text extraction failed. Falling back to OCR...');
            let ocrText = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = createCanvas(viewport.width, viewport.height);
                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const { data: { text } } = await Tesseract.recognize(canvas.toBuffer('image/png'), 'eng');
                ocrText += text + '\n';
            }
            if (!ocrText.trim()) throw new Error('OCR could not detect any text in the PDF.');
            return ocrText;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            const { value } = await mammoth.extractRawText({ buffer: file.buffer });
            return value;

        case 'image/jpeg':
        case 'image/png':
            const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
            return text;

        case 'text/plain':
            return file.buffer.toString('utf-8');

        default:
            throw new Error('Unsupported file type for text extraction.');
    }
};

/**
 * A wrapper for the fetch API that includes automatic retries with exponential backoff.
 * This makes the API call resilient to temporary server errors (5xx) and rate limiting (429).
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
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }
            if (response.status === 429 || response.status >= 500) {
                 console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying...`);
                 lastError = new Error(`API call failed with status: ${response.status}`);
                 const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                 await new Promise(resolve => setTimeout(resolve, delay));
                 continue;
            }
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed with network error: ${error.message}. Retrying...`);
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`API call failed after ${retries} attempts. Last error: ${lastError.message}`);
};

// Main POST route for the ATS resume check
router.post('/', protect, upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No resume file uploaded.' });
    }
    const { jobDescriptionText } = req.body;
    if (!jobDescriptionText) {
        return res.status(400).json({ message: 'Job description text is required.' });
    }

    try {
        // 1. Upload file to Cloudinary and get a URL
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'raw' }, (error, result) => {
                if (error) reject(error);
                resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });

        // 2. Extract plain text from the resume file
        const resumeText = await extractTextFromFile(req.file);
        if (!resumeText || !resumeText.trim()) {
            throw new Error('Could not extract any readable text from the uploaded file.');
        }

        const actionWords = [
            "Achieved", "Analyzed", "Authored", "Built", "Collaborated", "Coordinated", "Created", "Designed",
            "Developed", "Directed", "Engineered", "Enhanced", "Established", "Evaluated", "Executed",
            "Facilitated", "Generated", "Implemented", "Improved", "Initiated", "Innovated", "Led",
            "Managed", "Mentored", "Modeled", "Monitored", "Negotiated", "Operated", "Optimized",
            "Organized", "Performed", "Planned", "Processed", "Produced", "Programmed", "Project-managed",
            "Reduced", "Researched", "Resolved", "Reviewed", "Scheduled", "Streamlined", "Supervised",
            "Trained", "Transformed", "Upgraded", "Utilized", "Validated", "Verified", "Wrote"
        ];
        
        // 3. Construct the prompt for Gemini
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

        // 4. Perform AI analysis using the robust fetchWithRetry function
        const geminiResponse = await fetchWithRetry(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }, 5); // Attempt API call up to 5 times

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API call failed permanently with status: ${geminiResponse.status}. Details: ${errorText}`);
        }

        const geminiResult = await geminiResponse.json();

        if (!geminiResult.candidates || !geminiResult.candidates[0]?.content?.parts[0]?.text) {
             console.error("Invalid Gemini response structure:", geminiResult);
             throw new Error('Received an invalid or empty response from the AI model.');
        }
        let responseText = geminiResult.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json|```/g, '').trim();

        let analysisData;
        try {
            analysisData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse failed. Raw text:', responseText);
            throw new Error('Failed to parse the AI response. It may not be valid JSON.');
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
                foundKeywords: analysisData.keywords.matched.map(kw => ({ keyword: kw, count: 1 })), // Assuming count of 1
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