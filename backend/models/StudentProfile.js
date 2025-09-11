import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // The `unique` constraint has been removed.
        // Uniqueness will now be managed by the application logic.
    },
    careerGoals: String,
    learningObjectives: [String],
    preferredLearningStyles: [{
        type: String,
        enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic']
    }],
    timeAvailability: {
        hoursPerWeek: Number,
        preferredDays: [String],
        preferredTimes: [String]
    },
    achievements: [{
        title: String,
        description: String,
        type: {
            type: String,
            enum: ['certificate', 'badge', 'award', 'contest_win']
        },
        date: Date,
        associatedWith: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'achievements.associatedModel'
        },
        associatedModel: {
            type: String,
            enum: ['Course', 'Contest']
        }
    }],
    education: [{
        degree: {
            type: String,
            trim: true
        },
        institution: {
            type: String,
            trim: true
        },
        fieldOfStudy: {
            type: String,
            trim: true
        },
        startYear: Number,
        endYear: Number,
    }],
    skills: [{
        name: {
            type: String,
            trim: true
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'beginner'
        }
    }],
    interests: [String],
    workExperience: [{
        title: {
            type: String,
            trim: true
        },
        company: {
            type: String,
            trim: true
        },
        startDate: Date,
        endDate: Date,
        description: String
    }],
    bookmarks: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'bookmarks.itemType'
        },
        itemType: {
            type: String,
            enum: ['Lesson', 'Article', 'CodingProblem']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    stats: {
        coursesCompleted: {
            type: Number,
            default: 0
        },
        lessonsCompleted: {
            type: Number,
            default: 0
        },
        quizzesTaken: {
            type: Number,
            default: 0
        },
        codingProblemsSolved: {
            type: Number,
            default: 0
        },
        streakDays: {
            type: Number,
            default: 0
        },
        lastActiveDate: Date
    }
}, {
    timestamps: true
});

studentProfileSchema.virtual('studentId').get(function () {
    return this._id;
});

export default mongoose.model('StudentProfile', studentProfileSchema);