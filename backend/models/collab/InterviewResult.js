import mongoose from 'mongoose';

/**
 * @description Stores the results of a completed interview session.
 * This is a unified schema that can hold results for any type of interview.
 */
const interviewResultSchema = new mongoose.Schema({
    interviewSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
        unique: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interviewerFeedback: [{
        interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        overallFeedback: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5 },
        _id: false
    }],
    finalDecision: {
        type: String,
        enum: ['progress', 'hold', 'reject', 'pending'],
        default: 'pending'
    },
    completedAt: { type: Date, default: Date.now },
    resultType: {
        type: String,
        required: true,
        enum: ['behavioral', 'technical', 'coding-round', 'final-round']
    },

    // --- Fields for Behavioral Interviews (Optional) ---
    behavioralResponses: [{
        question: String,
        candidateResponseSummary: String,
        interviewerNotes: String,
        aiFeedback: {
            communication: { score: Number, feedback: String },
            situationalJudgement: { score: Number, feedback: String },
        },
        _id: false
    }],

    // --- Fields for Technical Interviews (Optional) ---
    technicalResponses: [{
        question: String,
        candidateAnswer: String,
        evaluationNotes: String,
        aiFeedback: {
            technicalKnowledge: { score: Number, feedback: String },
            problemSolvingApproach: { score: Number, feedback: String },
        },
        _id: false
    }],

    // --- Fields for Coding Rounds (Optional) ---
    problemSubmissions: [{
        problemTitle: { type: String, required: true },
        language: { type: String, required: true },
        finalCode: { type: String, required: true },
        executionHistory: [{
            runAt: { type: Date, default: Date.now },
            status: { type: String, enum: ['success', 'compilation-error', 'runtime-error', 'timeout'] },
            output: String,
            error: String,
            passedTestsCount: Number,
            totalTestsCount: Number,
        }],
        aiFeedback: {
            codeCorrectness: { score: Number, feedback: String },
            codeEfficiency: { score: Number, feedback: String, bigO: String },
            codeReadability: { score: Number, feedback: String }
        },
        _id: false
    }]
}, {
    // The discriminatorKey is removed
    timestamps: true
});

// This line prevents OverwriteModelError in development environments
const InterviewResult = mongoose.models.InterviewResult || mongoose.model('InterviewResult', interviewResultSchema);

export default InterviewResult;