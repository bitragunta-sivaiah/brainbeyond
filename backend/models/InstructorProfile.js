import mongoose from 'mongoose';

const instructorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // The `unique` constraint has been removed.
        // Uniqueness will now be managed by the application logic.
    },
    headline: {
        type: String,
        trim: true,
        maxlength: 100,
        default: 'Instructor',
    },
    bio: {
        type: String,
        maxlength: 1000,
    },
    experience: {
        type: Number,
        min: 0,
        default: 0,
    },
    certifications: [{
        name: String,
        issuer: String,
        dateObtained: Date,
    }],
    specializations: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    teachingPhilosophy: {
        type: String,
        maxlength: 1000,
    },
    portfolioUrl: String,
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    totalStudents: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCourses: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    engagementScore: {
        type: Number,
        default: 0,
    },
    payoutMethod: {
        type: String,
        enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
    },
    payoutDetails: {
        accountNumber: String,
        routingNumber: String,
        paypalEmail: String,
    },
    isVerifiedInstructor: {
        type: Boolean,
        default: false,
    },
    applicationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

instructorProfileSchema.pre('save', function (next) {
    if (this.isModified('courses')) {
        this.totalCourses = this.courses.length;
    }
    next();
});

export default mongoose.model('InstructorProfile', instructorProfileSchema);