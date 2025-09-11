// models/LearningRoadmap.js

import mongoose from 'mongoose';

// (dailyPlanSchema remains the same as you provided)
const dailyPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true,
        min: [1, 'Day number must be at least 1']
    },
    activities: [{
        title: {
            type: String,
            required: [true, 'Activity title is required'],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        resources: [{
            type: String, // Can contain HTML, links, or image URLs
            trim: true
        }],
        isCompleted: {
            type: Boolean,
            default: false
        }
    }]
}, { _id: false });


const learningRoadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Roadmap title is required'],
        trim: true,
        minlength: [5, 'Roadmap title must be at least 5 characters']
    },
    slug: {
        type: String,
        unique: true, // Slugs should be unique
        index: true   // Add an index for faster lookups
    },
    description: {
        type: String,
        required: [true, 'Roadmap description is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Roadmap must have an owner']
    },
    skill: {
        type: String,
        trim: true,
        required: [true, 'Skill is required for a learning roadmap']
    },
    skillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: [true, 'Skill level is required']
    },
    totalDurationDays: {
        type: Number,
        required: [true, 'Total duration in days is required'],
        min: [1, 'Duration must be at least 1 day']
    },
    dailyPlan: [dailyPlanSchema],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
        required: true
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    likesCount: {
        type: Number,
        default: 0
    },
    forksCount: {
        type: Number,
        default: 0
    },
    likedBy: [{ // Added likedBy to track who has liked the roadmap
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Mongoose pre-save hook to generate the slug automatically
learningRoadmapSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        // Create a base slug
        let baseSlug = this.title
            .toLowerCase()
            .replace(/ & /g, '-and-') // replace & with 'and'
            .replace(/[^\w-]+/g, '')  // remove non-word chars
            .replace(/--+/g, '-');      // replace multiple hyphens with a single one

        // Append a unique suffix to avoid collisions (e.g., a short timestamp)
        this.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }
    next();
});

const LearningRoadmap = mongoose.model('LearningRoadmap', learningRoadmapSchema);

export default LearningRoadmap;