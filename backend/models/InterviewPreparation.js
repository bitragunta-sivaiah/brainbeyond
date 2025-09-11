import mongoose from 'mongoose';

/**
 * @description Sub-schema for individual questions in the preparation plan.
 */
const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question text is required.'],
        trim: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    answer: { // The user's own answer or notes
        type: String,
        trim: true,
    },
    isPinned: { // To mark important questions
        type: Boolean,
        default: false,
    },
    aiGeneratedAnswers: [{ // For storing alternative, AI-generated answers
        type: String,
        trim: true,
    }],
});

/**
 * @description Sub-schema for study resources like articles, videos, etc.
 */
const StudyResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Resource name is required.'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required.'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['article', 'video', 'course', 'documentation', 'book', 'other'],
        default: 'article',
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    recommendation: { // AI's or user's rating for the resource
        type: String,
        enum: ['best', 'good', 'average', 'poor'],
        default: 'average',
    },
    recommendedOrder: { // Recommended order to learn the resource
        type: Number,
    },
});

/**
 * @description Schema for a question bank managed by admins.
 */
const AdminQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question text is required.'],
        trim: true,
    },
    targetCompany: {
        type: String,
        trim: true,
        default: 'General',
        index: true,
    },
    targetRole: {
        type: String,
        required: [true, 'Target role is required.'],
        trim: true,
        index: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    topicsCovered: [{
        type: String,
        trim: true,
    }],
}, { timestamps: true });

AdminQuestionSchema.index({ targetCompany: 1, targetRole: 1 });

/**
 * @description Sub-schema for a single question-answer pair within an AI mock interview.
 */
const AiMockInterviewQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    sourceQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminQuestion',
    },
    studentRespondedAnswer: {
        type: String,
    },
    feedback: {
        type: String,
        trim: true,
    },
    rating: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'needs-improvement'],
    },
});

/**
 * @description Sub-schema for a full AI mock interview session.
 */
const AiMockInterviewSchema = new mongoose.Schema({
    interviewDate: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ['resume-based', 'role-based', 'general'],
        default: 'general',
    },
    targetRole: {
        type: String,
        trim: true,
    },
    targetCompany: {
        type: String,
        trim: true,
    },
    resumeFile: {
        data: Buffer,
        contentType: String,
    },
    overallFeedback: {
        type: String,
        trim: true,
    },
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    questions: [AiMockInterviewQuestionSchema],
});

/**
 * @description Main schema for the Interview Preparation plan.
 */
const InterviewPreparationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'A title for your preparation plan is required.'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters.'],
    },
    targetRole: {
        type: String,
        required: [true, 'Target role is required.'],
        trim: true,
    },
    targetCompany: {
        type: String,
        trim: true,
        default: 'Any',
    },
    experienceLevel: {
        type: String,
        enum: ['fresher', '1-3 years', '3-5 years', '5+ years'],
        required: [true, 'Experience level is required.'],
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started',
    },
    topics: [{
        type: String,
        trim: true,
    }],
    questions: [QuestionSchema],
    studyResources: [StudyResourceSchema],
    aiMockInterviews: [AiMockInterviewSchema],
}, {
    timestamps: true,
});

export const InterviewPreparation = mongoose.model('InterviewPreparation', InterviewPreparationSchema);
export const AdminQuestion = mongoose.model('AdminQuestion', AdminQuestionSchema);
