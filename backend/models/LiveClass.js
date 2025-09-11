import mongoose from 'mongoose';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid'; // Recommended for generating unique room names

const { Schema } = mongoose;

/**
 * @description Schema for resources linked to a live class, like presentation slides or code files.
 */
const classResourceSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Resource title is required.'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required.']
    },
});

/**
 * @description Schema for tracking user participation in the live class.
 */
const participantSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['registered', 'attended', 'absent'],
        default: 'registered'
    },
    joinedAt: Date,
}, { _id: false });


const liveClassSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Live class title is required.'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },
    chapter: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: [true, 'A live class must be associated with a chapter.'],
        index: true,
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    schedule: {
        startTime: {
            type: Date,
            required: [true, 'Start time is required.'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required.'],
        },
        durationInMinutes: {
            type: Number,
        },
    },
    jitsiConfig: {
        roomName: {
            type: String,
            required: [true, 'A Jitsi room name is required.'],
            unique: true,
            default: () => uuidv4(),
        },
        passcode: {
            type: String,
            trim: true,
        },
    },
    recording: {
        url: String,
        processingStatus: {
            type: String,
            enum: ['unavailable', 'processing', 'available', 'failed'],
            default: 'unavailable',
        },
    },
    participants: [participantSchema],
    resources: [classResourceSchema],
    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled',
        index: true,
    },
    remindersSent: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    // Ensure virtuals are included when converting to JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// --- VIRTUALS for Jitsi Links ---

// IMPORTANT: This should ideally be an environment variable (e.g., process.env.JITSI_MEET_URL)
const JITSI_BASE_URL = 'https://meet.jit.si/';

/**
 * @description Virtual property to generate the public join link for participants.
 */
liveClassSchema.virtual('joinUrl').get(function() {
    if (this.jitsiConfig && this.jitsiConfig.roomName) {
        return `${JITSI_BASE_URL}${this.jitsiConfig.roomName}`;
    }
    return null; // Return null if there's no room name
});

/**
 * @description Virtual property to generate the access link for the instructor.
 * Note: In a simple Jitsi setup, this is the same as the join URL. The first user
 * to join becomes the moderator. For a more secure setup where only the instructor
 * is the moderator, you would generate a JWT on your server and append it to this URL.
 */
liveClassSchema.virtual('instructorUrl').get(function() {
    // This logic is the same as joinUrl but provides a clear API distinction.
    if (this.jitsiConfig && this.jitsiConfig.roomName) {
        return `${JITSI_BASE_URL}${this.jitsiConfig.roomName}`;
    }
    return null;
});

// --- MIDDLEWARE ---

// Middleware to auto-generate slug from title before saving
liveClassSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + uuidv4().split('-')[0];
    }
    next();
});

// Middleware to calculate duration and validate times before saving
liveClassSchema.pre('save', function (next) {
    if (this.isModified('schedule.startTime') || this.isModified('schedule.endTime')) {
        const { startTime, endTime } = this.schedule;
        if (startTime && endTime) {
            if (endTime <= startTime) {
                return next(new Error('End time must be after start time.'));
            }
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            this.schedule.durationInMinutes = Math.round(duration);
        }
    }
    next();
});


export default mongoose.model('LiveClass', liveClassSchema);