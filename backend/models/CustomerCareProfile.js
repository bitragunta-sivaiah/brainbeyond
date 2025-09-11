import mongoose from 'mongoose';

const customerCareProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    position: String,
    specialization: [String],
    languages: [String],
    availability: {
        workingDays: [String],
        shiftStart: String,
        shiftEnd: String,
        timezone: String
    },
    stats: {
        ticketsResolved: {
            type: Number,
            default: 0
        },
        averageResolutionTime: Number,
        customerSatisfaction: Number,
        currentActiveTickets: {
            type: Number,
            default: 0
        }
    },
    skills: [{
        name: String,
        proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
    }],
    tools: [{
        name: String,
        proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
    }],
    performanceReviews: [{
        date: Date,
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        feedback: String,
        goals: [String]
    }],
    currentAssignments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportTicket'
    }],
    responseTemplates: [{
        title: String,
        content: String,
        category: String,
        lastUsed: Date
    }],
    lastReviewed: Date
}, {
    timestamps: true
});

export default mongoose.model('CustomerCareProfile', customerCareProfileSchema);