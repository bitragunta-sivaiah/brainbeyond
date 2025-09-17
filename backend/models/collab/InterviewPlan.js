import mongoose from 'mongoose';

const baseInterviewPlanSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Interview title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    type: { type: String, required: true, enum: ['behavioral', 'technical', 'coding-round', 'final-round'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

const InterviewPlan = mongoose.models.InterviewPlan || mongoose.model('InterviewPlan', baseInterviewPlanSchema);

const behavioralInterviewSchema = new mongoose.Schema({
    questions: [{
        question: { type: String, required: true },
        source: { type: String, enum: ['ai-generated', 'custom'], default: 'custom' }
    }],
    evaluationCriteria: {
        communication: { type: Boolean, default: true },
        situationalJudgement: { type: Boolean, default: true },
        teamworkAndCollaboration: { type: Boolean, default: true },
        problemSolving: { type: Boolean, default: true },
    }
});

const technicalInterviewSchema = new mongoose.Schema({
    topics: { type: [String], required: true },
    questions: [{
        question: { type: String, required: true },
        source: { type: String, enum: ['ai-generated', 'custom'], default: 'custom' },
        expectedKeywords: [String]
    }],
    evaluationCriteria: {
        technicalKnowledge: { type: Boolean, default: true },
        problemSolvingApproach: { type: Boolean, default: true },
        clarityOfExplanation: { type: Boolean, default: true },
    }
});

const codingRoundInterviewSchema = new mongoose.Schema({
    problems: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        source: { type: String, enum: ['ai-generated', 'custom'], default: 'custom' },
        starterCode: [{
             language: { type: String, required: true },
             code: { type: String }
        }],
        solution: { type: String, select: false },
        testCases: [{
            input: { type: mongoose.Schema.Types.Mixed, required: true },
            expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
            isHidden: { type: Boolean, default: false },
        }],
        allowedLanguages: { type: [String], required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
    }],
    evaluationCriteria: {
        codeCorrectness: { type: Boolean, default: true },
        codeEfficiency: { type: Boolean, default: true },
        codeReadability: { type: Boolean, default: true },
    }
});

const finalRoundInterviewSchema = new mongoose.Schema({
    agenda: { type: [String], required: true },
    focusAreas: { type: [String], required: true }
});

InterviewPlan.discriminator('behavioral', behavioralInterviewSchema);
InterviewPlan.discriminator('technical', technicalInterviewSchema);
InterviewPlan.discriminator('coding-round', codingRoundInterviewSchema);
InterviewPlan.discriminator('final-round', finalRoundInterviewSchema);

export default InterviewPlan;