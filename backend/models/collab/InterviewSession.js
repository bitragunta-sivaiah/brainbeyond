import mongoose from 'mongoose';

/**
 * @description Represents a scheduled interview event, linking a candidate to a plan
 * and handling all logistical details.
 */
const interviewSessionSchema = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interviewPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewPlan', required: true },
    hiringManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    jobPosting: {
        id: { type: mongoose.Schema.Types.ObjectId },
        title: { type: String }
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'canceled', 'rescheduled'],
        default: 'scheduled',
        required: true
    },
    meetingLink: { type: String, trim: true },
    internalNotes: { type: String },
    result: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewResult' }
}, {
    timestamps: true
});

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;