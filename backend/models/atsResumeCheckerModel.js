import mongoose from 'mongoose';

const atsResumeCheckerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // A reference to the AI-generated resume, if applicable
    optimizedResumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume'
    },
    jobDescriptionText: {
        type: String,
        required: true,
        trim: true
    },
    // --- FIELDS ADDED FOR CACHING ---
    // These ensure that uploading the same resume/JD combination yields the same result without a new API call.
    resumeHash: {
        type: String,
        index: true
    },
    jobDescriptionHash: {
        type: String,
        index: true
    },
    // --- CORRECTED: The analysis report, matching the enhanced AI prompt's JSON structure ---
    analysisReport: {
        atsScore: { type: Number, default: 0 },
        enhancementPotential: { type: Number, default: 0 },
        scoreRationale: { type: String, default: '' },
        summary: { type: String, default: '' },
        keywords: {
            matched: [String],
            missing: [String],
        },
        improvements: {
            content: [String],
            formatting: [String],
        },
        sectionAnalysis: [{
            _id: false,
            sectionName: String,
            weakSentences: [String],
            suggestedSentences: [String],
            rating: Number,
        }],
    },
}, { timestamps: true });

export default mongoose.model('ATSResumeChecker', atsResumeCheckerSchema);