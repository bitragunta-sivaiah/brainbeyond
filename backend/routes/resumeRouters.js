import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import crypto from 'crypto';

// --- Import your models and middleware ---
import Resume from '../models/Resume.js';
import ATSResumeChecker from '../models/atsResumeCheckerModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- CONFIGURATIONS & HELPERS ---

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, JPG, or PNG file.'), false);
        }
    }
});

/**
 * **ROBUST AI JSON PARSING HELPER**
 * Cleans and parses a string that is expected to contain a single JSON object,
 * handling common AI response quirks like markdown code blocks and trailing text.
 * @param {string} rawText - The raw text from the AI API call.
 * @returns {object} The parsed JavaScript object.
 * @throws {Error} If no valid JSON can be extracted or parsed.
 */
const parseAIJsonResponse = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error("AI response is empty or not a string.");
    }

    const text = rawText.trim();

    // Strategy 1: Look for a JSON markdown block (```json ... ```)
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch (error) {
            console.error("Failed to parse the extracted JSON markdown block:", jsonBlockMatch[1]);
            throw new Error(`JSON parsing failed within markdown block: ${error.message}`);
        }
    }

    // Strategy 2: Fallback for raw JSON, find the first '{' to the last '}'
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Could not find a valid JSON object within the AI's response.");
    }

    const jsonStringToParse = text.substring(startIndex, endIndex + 1);
    try {
        return JSON.parse(jsonStringToParse);
    } catch (error) {
        console.error("Failed to parse the extracted JSON substring:", jsonStringToParse);
        throw new Error(`JSON parsing failed: ${error.message}`);
    }
};


/**
 * **ENHANCED NORMALIZATION FUNCTION**
 * Cleans, normalizes, and enriches the AI's resume data to perfectly match the Mongoose schema.
 */
const normalizeAiResumeData = (aiData) => {
    const data = { ...aiData };

    // --- Contact Information Normalization ---
    data.contact = data.contact || {};
    
    if (data.contact.fullName && !data.contact.firstName && !data.contact.lastName) {
        const nameParts = data.contact.fullName.trim().split(/\s+/);
        data.contact.firstName = nameParts.shift() || "John";
        data.contact.lastName = nameParts.join(' ') || "Doe";
    } else {
        data.contact.firstName = data.contact.firstName || "John";
        data.contact.lastName = data.contact.lastName || "Doe";
    }
    
    data.contact.email = data.contact.email || "contact@example.com";
    
    if (Array.isArray(data.contact.socialLinks)) {
        data.contact.socialLinks = data.contact.socialLinks
            .map(link => {
                if (link.url && !link.platform) {
                    try {
                        const urlHost = new URL(link.url).hostname.toLowerCase();
                        if (urlHost.includes('linkedin.com')) link.platform = 'LinkedIn';
                        else if (urlHost.includes('github.com')) link.platform = 'GitHub';
                        else if (urlHost.includes('twitter.com') || urlHost.includes('x.com')) link.platform = 'Twitter/X';
                        else if (urlHost.includes('behance.net')) link.platform = 'Behance';
                        else if (urlHost.includes('dribbble.com')) link.platform = 'Dribbble';
                        else if (urlHost.includes('medium.com')) link.platform = 'Medium';
                        else link.platform = 'Portfolio';
                    } catch (e) {
                        return null; 
                    }
                }
                return link;
            })
            .filter(link => link && link.url); 
    }

    data.fileName = data.fileName || "AI-Optimized Resume";

    if (Array.isArray(data.education)) {
        data.education.forEach(edu => {
            edu.institution = edu.institution || "A University";
            if (edu.gpa && typeof edu.gpa === 'string') {
                const gpaString = edu.gpa;
                const match = gpaString.match(/(\d+\.?\d*)/);
                const value = match ? match[1] : gpaString;
                let type = 'GPA';
                if (gpaString.includes('%')) {
                    type = 'Percentage';
                }
                edu.gpa = { value, type };
            }
        });
    }

    if (Array.isArray(data.skills)) {
        const skillMap = new Map();
        for (const skill of data.skills) {
            const category = (skill.category || "General Skills").trim();
            if (!category) continue;
            if (!skillMap.has(category)) {
                skillMap.set(category, new Set());
            }
            if (Array.isArray(skill.items)) {
                for (const item of skill.items) {
                    if (item && typeof item === 'string' && item.trim()) {
                        skillMap.get(category).add(item.trim());
                    }
                }
            }
        }
        const cleanedSkills = [];
        for (const [category, itemsSet] of skillMap.entries()) {
            const items = Array.from(itemsSet);
            if (items.length > 0) {
                cleanedSkills.push({ category, items });
            }
        }
        data.skills = cleanedSkills;
    }

    return data;
};

/**
 * Helper to convert structured resume JSON to plain text for AI analysis.
 */
const convertResumeJsonToText = (resumeJson) => {
    let text = `${resumeJson.contact?.firstName} ${resumeJson.contact?.lastName}\n${resumeJson.summary}\n\n`;
    (resumeJson.workExperience || []).forEach(j => {
        text += `Title: ${j.jobTitle} at ${j.company}\n`;
        text += `- ${(j.description || []).join('\n- ')}\n\n`;
    });
    (resumeJson.education || []).forEach(e => {
        text += `Education: ${e.degree} from ${e.institution}\n\n`;
    });
    (resumeJson.skills || []).forEach(s => {
        text += `Skills (${s.category}): ${(s.items || []).join(', ')}\n`;
    });
    return text;
};

/**
 * Extracts text from various file types.
 */
const extractTextFromFile = async (file) => {
    switch (file.mimetype) {
        case 'application/pdf':
            pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.mjs`;
            const doc = await pdfjsLib.getDocument(new Uint8Array(file.buffer)).promise;
            let fullText = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            if (fullText.trim()) return fullText;

            console.warn('Standard PDF extraction failed. Falling back to OCR...');
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
        
        default:
            return file.buffer.toString('utf-8');
    }
};

// --- **FULLY ENHANCED AI HELPER FUNCTIONS** ---

/**
 * Generates a highly detailed ATS analysis report from the AI.
 */
const getAnalysisFromAI = async (jobDescription, resumeText) => {
    const analysisPrompt = `
    You are 'ATS-Prime', an elite AI recruitment analyst. Your task is to provide a comprehensive, actionable analysis of the provided RESUME against the JOB DESCRIPTION.

    Instructions:
    Generate a JSON object with the following strict structure. Do not add any text or markdown before or after the JSON object. Every field is mandatory.

    {
      "atsScore": <Number, 0-100, representing the overall match percentage>,
      "enhancementPotential": <Number, 0-100, estimating how much the resume can improve>,
      "scoreRationale": "<Brief, clear explanation for the scores given>",
      "summary": "<A concise executive summary of the candidate's strengths and critical weaknesses>",
      "keywords": {
        "matched": ["<List all keywords and skills from the job description found in the resume>"],
        "missing": ["<List critical keywords and skills from the job description MISSING from the resume>"]
      },
      "sectionAnalysis": [
        {
          "sectionName": "<e.g., Summary, Work Experience, Projects>",
          "rating": <Number, 0-10, rating the section's effectiveness>,
          "weakSentences": ["<**CRITICAL**: COPY THE ORIGINAL weak or poorly phrased sentences from the resume that you are improving. This array MUST NOT be empty if 'suggestedSentences' has content.>"],
          "suggestedSentences": ["<Provide perfectly rewritten, high-impact '10/10' versions of the corresponding sentences in the 'weakSentences' array.>"]
        }
      ],
      "suggestedActionWords": ["<Provide a list of 10-15 powerful action verbs relevant to the job description (e.g., 'Architected', 'Engineered', 'Orchestrated', 'Quantified', 'Spearheaded')>"],
      "generalTips": [
          "<Provide a list of 3-5 high-level, actionable tips to improve the overall resume. Focus on quantification, tailoring, and adding missing sections like projects.>"
      ]
    }

    Return ONLY the raw JSON object.

    JOB DESCRIPTION:
    ---
    ${jobDescription}
    ---
    RESUME TEXT:
    ---
    ${resumeText}
    ---`;

    try {
        const geminiResponse = await axios.post(GEMINI_API_URL, {
            contents: [{ parts: [{ text: analysisPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const aiResponseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("--- RAW AI RESPONSE RECEIVED (Analysis) ---");
        console.log(aiResponseText);
        console.log("---------------------------------");

        return parseAIJsonResponse(aiResponseText);

    } catch (error) {
        console.error("Error in getAnalysisFromAI:", error.message);
        // MODIFIED: Replaced the generic error with a more user-friendly one.
        throw new Error("The AI service returned an unexpected response. Please try again in a few moments.");
    }
};

/**
 * Rewrites a resume with a hyper-specific prompt.
 */
const getOptimizedResumeFromAI = async (jobDescription, originalResumeText) => {
    const optimizationPrompt = `
    You are 'ResumeSynth', an AI expert resume writer. Your task is to parse and completely reconstruct the provided unstructured resume text. The final output must be a resume that would score 95-100% on any ATS for the given job description.

    **Critical Parsing & Mapping Rules:**
    You must intelligently map common resume headings to the correct JSON fields.
    1.  **Contact/Header**:
        - If you see a full name (e.g., "Jane Doe"), split it into "firstName": "Jane" and "lastName": "Doe".
        - Identify all contact info (email, phone, website).
        - If you find URLs for sites like LinkedIn or GitHub, place them in the \`socialLinks\` array.
    2.  **Summary Section**:
        - Look for headings like "Summary", "Personal Summary", "Objective", or "Professional Profile". The content below it goes into the \`summary\` field.
    3.  **Work Experience Section**:
        - Look for headings like "Experience", "Work Experience", "Work History", "Employment", or "Professional Experience".
        - For each job listed, extract the \`jobTitle\`, \`company\`, \`location\`, dates, and \`description\` bullet points. Map this data into an object inside the \`workExperience\` array.
    4.  **Projects Section**:
        - Look for headings like "Projects", "Personal Projects", or "Portfolio".
        - For each project, extract its \`name\`, \`description\`, and any associated links or technologies. Map this data into an object inside the \`projects\` array.
    5.  **Achievements/Awards Section**:
        - Look for headings like "Awards", "Honors", "Achievements", or "Recognition".
        - For each item, extract the \`title\`, issuer/description, and date. Map this data into an object inside the \`achievements\` array.

    **Optimization & Generation Process:**
    - Aggressively rewrite the resume content. Weave in keywords from the job description naturally.
    - Quantify achievements. If the original says "Improved performance," rewrite it as "Improved system performance by 15% by optimizing database queries." Invent plausible metrics if necessary.
    - Ensure every bullet point starts with a strong action verb.
    - Group all identified skills into logical categories (e.g., "Programming Languages", "Databases", "Cloud & DevOps"). DO NOT create duplicate category names.

    **Final Output Format:**
    - Your entire response MUST be a single, valid JSON object that perfectly matches the provided schema structure.
    - **CRITICAL JSON RULES**:
        - ALWAYS include "fileName", "contact.firstName", "contact.lastName", and "contact.email". Use placeholders if needed.
        - The "gpa" field MUST be an object: {"value": "4.0", "type": "GPA"}.
        - The "skills" field must be an array of objects: [{ "category": "Category Name", "items": ["Skill 1", "Skill 2"] }].

    Return ONLY the raw JSON object.

    JOB DESCRIPTION:
    ---
    ${jobDescription}
    ---
    ORIGINAL RESUME TEXT:
    ---
    ${originalResumeText}
    ---`;

    try {
        const optimzationResponse = await axios.post(GEMINI_API_URL, {
            contents: [{ parts: [{ text: optimizationPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const aiResponseText = optimzationResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("--- RAW AI RESPONSE RECEIVED (Optimization) ---");
        console.log(aiResponseText);
        console.log("---------------------------------");

        return parseAIJsonResponse(aiResponseText);

    } catch (error) {
        console.error("Error in getOptimizedResumeFromAI:", error.message);
        // MODIFIED: Replaced the generic error with a more user-friendly one.
        throw new Error("The AI service returned an unexpected response while optimizing. Please try again in a few moments.");
    }
};


// --- STANDARD RESUME CRUD ROUTES ---

router.post('/', protect, async (req, res) => {
    try {
        const resume = await Resume.create({ ...req.body, userId: req.user._id });
        res.status(201).json(resume);
    } catch (error) {
        res.status(400).json({ message: 'Error creating resume', error: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id, isDeleted: false }).sort({ updatedAt: -1 });
        res.status(200).json(resumes);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching resumes' });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.status(200).json(resume);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching resume' });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const updatedResume = await Resume.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedResume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.status(200).json(updatedResume);
    } catch (error) {
        res.status(400).json({ message: 'Error updating resume', error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isDeleted: true },
            { new: true }
        );
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.status(200).json({ message: 'Resume moved to trash successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting resume' });
    }
});


// --- AI-POWERED ATS & OPTIMIZATION ROUTES ---

router.post('/check-score', protect, upload.single('resumeFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a resume file.' });
    if (!req.body.jobDescription) return res.status(400).json({ message: 'Please provide a job description.' });

    try {
        const { jobDescription } = req.body;
        const resumeText = await extractTextFromFile(req.file);
        if (!resumeText.trim()) return res.status(400).json({ message: 'Could not extract text from the file.' });

        const resumeHash = crypto.createHash('sha256').update(resumeText).digest('hex');
        const jobDescriptionHash = crypto.createHash('sha256').update(jobDescription).digest('hex');

        const existingAnalysis = await ATSResumeChecker.findOne({ userId: req.user._id, resumeHash, jobDescriptionHash });
        if (existingAnalysis) {
            return res.status(200).json(existingAnalysis);
        }

        const analysisReport = await getAnalysisFromAI(jobDescription, resumeText);
        const newAnalysis = await ATSResumeChecker.create({
            userId: req.user._id,
            jobDescriptionText: jobDescription,
            analysisReport,
            resumeHash,
            jobDescriptionHash,
        });
        res.status(200).json(newAnalysis);

    } catch (error) {
        console.error('Error checking ATS score:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: error.message || 'An error occurred during ATS analysis.' });
    }
});

router.post('/optimize-and-create', protect, upload.single('resumeFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a resume file.' });
    if (!req.body.jobDescription) return res.status(400).json({ message: 'Please provide a job description.' });

    try {
        const { jobDescription } = req.body;
        const originalResumeText = await extractTextFromFile(req.file);
        if (!originalResumeText.trim()) return res.status(400).json({ message: 'Could not extract text from the file.' });

        const optimizedResumeData = await getOptimizedResumeFromAI(jobDescription, originalResumeText);
        
        const normalizedData = normalizeAiResumeData(optimizedResumeData);

        const savedResume = await Resume.create({
            ...normalizedData,
            userId: req.user._id,
        });

        const optimizedResumeText = convertResumeJsonToText(normalizedData);
        const analysisReport = await getAnalysisFromAI(jobDescription, optimizedResumeText);
        
        const resumeHash = crypto.createHash('sha256').update(optimizedResumeText).digest('hex');
        const jobDescriptionHash = crypto.createHash('sha256').update(jobDescription).digest('hex');

        const newAnalysis = await ATSResumeChecker.create({
            userId: req.user._id,
            optimizedResumeId: savedResume._id,
            jobDescriptionText: jobDescription,
            analysisReport,
            resumeHash,
            jobDescriptionHash
        });

        res.status(201).json({
            message: 'Resume optimized and created successfully!',
            newResume: savedResume,
            analysis: newAnalysis,
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Resume validation failed: ${error.message}` });
        }
        console.error('Error optimizing resume:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: error.message || 'An error occurred during the optimization process.' });
    }
});

export default router;
