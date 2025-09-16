import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import crypto from 'crypto';
import fetch from 'node-fetch';

// --- Import your models and middleware ---
import Resume from '../models/Resume.js';
import ATSResumeChecker from '../models/atsResumeCheckerModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==============================================================================
// --- CONFIGURATIONS & CORE HELPERS ---
// ==============================================================================

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Multer configuration
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

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.mjs`;

/**
 * **NEW: ROBUST API CALL HELPER WITH EXPONENTIAL BACKOFF**
 * This function replaces direct API calls to handle transient errors like overloads.
 * It automatically retries on server errors (5xx) or rate limiting (429).
 */
const callApiWithRetry = async (url, options, retries = 5) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response.json();
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

/**
 * **ROBUST AI JSON PARSING HELPER**
 * Cleans and parses a string that is expected to contain a single JSON object.
 */
const parseAIJsonResponse = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error("AI response is empty or not a string.");
    }
    const text = rawText.trim();
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch (error) {
            console.error("Failed to parse the extracted JSON markdown block:", jsonBlockMatch[1]);
            throw new Error(`JSON parsing failed within markdown block: ${error.message}`);
        }
    }
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
 * Cleans, normalizes, and enriches AI data to match the Mongoose schema.
 */
const normalizeAiResumeData = (aiData) => {
    const data = { ...aiData };
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
        data.contact.socialLinks = data.contact.socialLinks.map(link => {
            if (link.url && !link.platform) {
                try {
                    const urlHost = new URL(link.url).hostname.toLowerCase();
                    if (urlHost.includes('linkedin.com')) link.platform = 'LinkedIn';
                    else if (urlHost.includes('github.com')) link.platform = 'GitHub';
                    else if (urlHost.includes('twitter.com') || urlHost.includes('x.com')) link.platform = 'Twitter/X';
                    else link.platform = 'Portfolio';
                } catch (e) { return null; }
            }
            return link;
        }).filter(link => link && link.url);
    }
    data.fileName = data.fileName || "AI-Optimized Resume";
    if (Array.isArray(data.education)) {
        data.education.forEach(edu => {
            edu.institution = edu.institution || "A University";
            if (edu.gpa && typeof edu.gpa === 'string') {
                const gpaString = edu.gpa;
                const match = gpaString.match(/(\d+\.?\d*)/);
                const value = match ? match[1] : gpaString;
                let type = gpaString.includes('%') ? 'Percentage' : 'GPA';
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

    // Add sections only if they exist and are arrays
    if (Array.isArray(resumeJson.workExperience)) {
        resumeJson.workExperience.forEach(j => {
            text += `Title: ${j.jobTitle} at ${j.company}\n`;
            text += `- ${(j.description || []).join('\n- ')}\n\n`;
        });
    }

    if (Array.isArray(resumeJson.education)) {
        resumeJson.education.forEach(e => {
            text += `Education: ${e.degree} from ${e.institution}\n\n`;
        });
    }

    // Fix: Handle case where resumeJson.skills might not be an array
    const skillsArray = Array.isArray(resumeJson.skills) ? resumeJson.skills : (resumeJson.skills ? Object.values(resumeJson.skills) : []);
    skillsArray.forEach(s => {
        text += `Skills (${s.category}): ${(s.items || []).join(', ')}\n`;
    });

    return text;
};

/**
 * Extracts text from various file types with OCR fallback.
 */
const extractTextFromFile = async (file) => {
    switch (file.mimetype) {
        case 'application/pdf':
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

        case 'image/jpeg':
        case 'image/png':
        case 'image/webp':
            const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
            return text;

        case 'text/plain':
            return file.buffer.toString('utf-8');

        default:
            throw new Error('Unsupported file type for text extraction.');
    }
};

// ==============================================================================
// --- **ENHANCED AI HELPER FUNCTIONS (NOW RESILIENT)** ---
// ==============================================================================

/**
 * REFACTORED: Generates a detailed ATS analysis using the resilient API caller.
 */
const getAnalysisFromAI = async (jobDescription, resumeText) => {
    const analysisPrompt = `
    You are 'ATS-Prime', an elite AI recruitment analyst. Your task is to provide a comprehensive, actionable analysis of the provided RESUME against the JOB DESCRIPTION.
    Instructions:
    Generate a JSON object with the following strict structure. Do not add any text or markdown before or after the JSON object. Every field is mandatory.
    {
      "atsScore": <Number, 0-100, representing the overall match percentage  will real and practical scoring criteria and 100 enhancementPotential>,
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
      "suggestedActionWords": ["<Provide a list of 10-15 powerful action verbs relevant to the job description (e.g., 'Architected', 'Engineered', 'Orchestrated', 'Quantified', 'Spearheaded') that the candidate should use. >"],
      "generalTips": ["<Provide a list of 3-5 high-level, actionable tips to improve the overall resume. Focus on quantification, tailoring, and adding missing sections like projects., certifications, or skills.>"]
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
        const payload = {
            contents: [{ parts: [{ text: analysisPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const geminiResponseData = await callApiWithRetry(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const aiResponseText = geminiResponseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponseText) {
            throw new Error("Received an invalid or empty response from the AI analysis service.");
        }
        return parseAIJsonResponse(aiResponseText);
    } catch (error) {
        console.error("Error in getAnalysisFromAI after retries:", error.message);
        throw new Error("The AI service is currently unavailable for analysis. Please try again in a few moments.");
    }
};

/**
 * REFACTORED: Rewrites a resume using the resilient API caller.
 */
const getOptimizedResumeFromAI = async (jobDescription, originalResumeText) => {
    const optimizationPrompt = `
    You are 'ResumeSynth', an AI expert resume writer. Your task is to parse and completely reconstruct the provided unstructured resume text into a structured JSON format. The final output must be a resume that would score 95-100% on any ATS for the given job description., focusing on clarity, relevance, and impact.
    Instructions:
    Generate a single JSON object with the following strict structure. Do not add any text or markdown before or after the JSON object. Every field is mandatory, even if empty.

    **Critical Parsing & Mapping Rules:**
    1.  **Strict JSON Output:** Generate ONLY a single JSON object. Do not include any other text, explanations, or markdown blocks (e.g., \`\`\`json).
    2.  **Mapping Headings:** Intelligently map common resume headings (e.g., "Professional Experience," "Career History," "Education & Training," "Technical Skills," "Honors & Awards") to the correct JSON fields.
    3.  **Handling Missing Sections:** If a section (e.g., 'projects', 'certifications') is not found in the original resume text, create an empty array for that field. Do not omit any top-level keys from the final JSON structure.
    4.  **Dates:** Parse dates accurately and format them as 'YYYY-MM-DD'. If a job or education is current, set 'isCurrent' to true and omit the 'endDate'.
    5.  **Descriptions:** For 'workExperience' and 'projects', break down dense paragraphs into a list of bullet points. Each bullet point should be a single, high-impact string, using powerful action verbs relevant to the job description.
    6.  **Skills:** Categorize skills into logical groups (e.g., 'Programming Languages', 'Frameworks', 'Databases', 'Tools').
    7.  **Custom Sections:** Map any non-standard sections (e.g., "Awards," "Volunteering," "Interests") into the 'customSections' array. Each item in 'customSections' must have a 'sectionTitle' and an 'items' array.

    **JSON Structure Requirements:**
    {
      "contact": {
        "firstName": "string",
        "lastName": "string",
        "professionalTitle": "string",
        "email": "string",
        "phone": "string",
        "website": "string",
        "address": { "city": "string", "country": "string" },
        "socialLinks": [ { "platform": "string", "url": "string" } ]
      },
      "summary": "string",
      "workExperience": [
        {
          "jobTitle": "string",
          "company": "string",
          "location": "string",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD" | null,
          "isCurrent": boolean,
          "description": ["string", "string"]
        }
      ],
      "education": [
        {
          "institution": "string",
          "degree": "string",
          "fieldOfStudy": "string",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD" | null,
          "isCurrent": boolean,
          "gpa": { "value": "string", "type": "string" }
        }
      ],
      "projects": [
        {
          "name": "string",
          "description": ["string", "string"],
          "technologiesUsed": ["string"],
          "links": [{ "name": "string", "url": "string" }]
        }
      ],
      "skills": [
        {
          "category": "string",
          "items": ["string", "string"]
        }
      ],
      "certifications": [
        {
          "name": "string",
          "issuingOrganization": "string",
          "issueDate": "YYYY-MM-DD",
          "credentialUrl": "string"
        }
      ],
      "achievements": [
        {
          "title": "string",
          "issuer": "string",
          "date": "YYYY-MM-DD",
          "description": "string"
        }
      ],
      "customSections": [
        {
          "sectionTitle": "string",
          "items": [ { "title": "string", "subTitle": "string", "description": ["string"] } ]
        }
      ],
      "sectionOrder": ["contact", "summary", "workExperience", "education", "projects", "skills", "certifications", "achievements", "customSections"]
    }

    JOB DESCRIPTION:
    ---
    ${jobDescription}
    ---
    ORIGINAL RESUME TEXT:
    ---
    ${originalResumeText}
    ---`;
    try {
        const payload = {
            contents: [{ parts: [{ text: optimizationPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const optimzationResponseData = await callApiWithRetry(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const aiResponseText = optimzationResponseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponseText) {
            throw new Error("Received an invalid or empty response from the AI optimization service.");
        }
        return parseAIJsonResponse(aiResponseText);
    } catch (error) {
        console.error("Error in getOptimizedResumeFromAI after retries:", error.message);
        throw new Error("The AI service is currently unavailable for optimization. Please try again in a few moments.");
    }
};

// ==============================================================================
// --- ROUTES ---
// ==============================================================================

// --- Standard Resume CRUD Routes ---
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

// --- AI-Powered ATS & Optimization Routes ---
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
        console.error('Error checking ATS score:', error.message);
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
        console.error('Error optimizing resume:', error.message);
        res.status(500).json({ message: error.message || 'An error occurred during the optimization process.' });
    }
});

export default router;