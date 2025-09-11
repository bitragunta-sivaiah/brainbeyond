import mongoose from 'mongoose';
import {
    nanoid
} from 'nanoid';

const {
    Schema
} = mongoose;

// Note: I've re-added the maxlength constraints from your original model
// as they are generally good practice for data validation.
// You can remove them if you are certain you don't need them.

const attachmentSchema = new Schema({
    url: {
        type: String,
        required: [true, 'Attachment URL is required.'],
        trim: true,
    },
    contentType: {
        type: String,
        required: [true, 'Content type is required (e.g., image/png).'],
        trim: true,
    },
});

const responseSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // User can be null for AI-generated responses
        required: false,
    },
    // We'll add a field to distinguish AI messages
    isAIMessage: {
        type: Boolean,
        default: false,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 5000,
    },
    attachments: [attachmentSchema],
}, {
    timestamps: true
});

const historySchema = new Schema({
    actor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        required: true,
        enum: ['status_change', 'assignment', 'priority_change', 'escalation', 'note_added'],
    },
    change: {
        field: String,
        from: Schema.Types.Mixed,
        to: Schema.Types.Mixed,
    },
    note: {
        type: String,
        trim: true
    },
}, {
    _id: false,
    timestamps: {
        createdAt: true,
        updatedAt: false
    }
});

const supportTicketSchema = new Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true,
        default: () => `TICKET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(6)}`,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A user is required for the ticket.'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required.'],
        trim: true,
        minlength: [10, 'Subject must be at least 10 characters.'],
        maxlength: [200, 'Subject cannot exceed 200 characters.'],
    },
    initialMessage: {
        type: String,
        required: [true, 'Initial message is required.'],
        trim: true,
        minlength: [20, 'Message must be at least 20 characters.'],
        maxlength: [5000, 'Message cannot exceed 5000 characters.'],
    },
    type: {
        type: String,
        required: [true, 'Ticket type is required.'],
        enum: {
            values: ['technical', 'billing', 'account', 'feature_request', 'general_inquiry', 'other'],
            message: '{VALUE} is not a valid ticket type.',
        },
        default: 'general_inquiry',
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['open', 'in-progress', 'awaiting_user', 'resolved', 'closed', 'reopened'],
            message: '{VALUE} is not a valid ticket status.',
        },
        default: 'open',
    },
    priority: {
        type: String,
        required: true,
        enum: {
            values: ['low', 'medium', 'high', 'urgent', 'critical'],
            message: '{VALUE} is not a valid priority level.',
        },
        default: 'medium',
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    isEscalated: {
        type: Boolean,
        default: false,
    },
    resolutionDetails: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    satisfactionRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
    },
    satisfactionComment: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    closedAt: {
        type: Date,
        default: null,
    },
    attachments: [attachmentSchema],
    responses: [responseSchema],
    history: [historySchema],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
});

supportTicketSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        const isNowClosed = ['resolved', 'closed'].includes(this.status);
        const wasClosed = this.closedAt !== null;

        if (isNowClosed && !wasClosed) {
            this.closedAt = new Date();
        } else if (!isNowClosed && wasClosed) {
            this.closedAt = null;
        }
    }
    next();
});

supportTicketSchema.virtual('isOpen').get(function () {
    return !['resolved', 'closed'].includes(this.status);
});

supportTicketSchema.virtual('timeToResolution').get(function () {
    if (this.closedAt && this.createdAt) {
        const diffMs = this.closedAt.getTime() - this.createdAt.getTime();
        return (diffMs / (1000 * 60 * 60 * 24)).toFixed(2); // Time in days
    }
    return null;
});

supportTicketSchema.index({
    user: 1,
    createdAt: -1
});
supportTicketSchema.index({
    status: 1,
    priority: -1
});
supportTicketSchema.index({
    assignedTo: 1,
    status: 1
});
supportTicketSchema.index({
    type: 1
});

export default mongoose.model('SupportTicket', supportTicketSchema);
