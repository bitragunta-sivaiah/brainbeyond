import mongoose from 'mongoose';
import slugify from 'slugify';

// Sub-schema for individual resources (links, videos, articles)
const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Resource title is required'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required'],
        trim: true,
    },
    resourceType: {
        type: String,
        enum: ['video', 'article', 'documentation', 'book', 'project_source', 'other'],
        default: 'article',
    },
}, { _id: false });

// Sub-schema for a single learning activity within a day
const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Activity title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    activityType: {
        type: String,
        enum: ['learning', 'practice', 'project', 'assessment', 'break'],
        default: 'learning',
    },
    estimatedTimeMinutes: {
        type: Number,
        min: [0, 'Estimated time cannot be negative'],
    },
    resources: [resourceSchema], // Use the structured resource schema
    isCompleted: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

// Sub-schema for a full day's plan
const dailyPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true,
        min: [1, 'Day number must be at least 1'],
    },
    title: { // Optional title for the day's theme, e.g., "Introduction to State"
        type: String,
        trim: true,
    },
    activities: [activitySchema], // Use the structured activity schema
}, { _id: false });


// Sub-schema for ratings and reviews
const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
}, { timestamps: true });


// Main schema for the Learning Roadmap
const learningRoadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Roadmap title is required'],
        trim: true,
        minlength: [5, 'Roadmap title must be at least 5 characters'],
        maxlength: [150, 'Roadmap title cannot exceed 150 characters'],
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Roadmap description is required'],
        trim: true,
    },
    coverImage: {
        type: String,
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Roadmap must have an owner'],
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    skill: {
        type: String,
        trim: true,
        required: [true, 'Skill is required for a learning roadmap'],
    },
    skillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: [true, 'Skill level is required'],
    },
    prerequisites: [{
        type: String,
        trim: true,
    }],
    totalDurationDays: {
        type: Number,
        required: [true, 'Total duration in days is required'],
        min: [1, 'Duration must be at least 1 day'],
    },
    dailyPlan: [dailyPlanSchema],
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    isPublic: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
    },
    version: {
        type: Number,
        default: 1,
    },
    changelog: {
        type: String,
        trim: true,
    },

    // --- Engagement Metrics ---
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    forksCount: { type: Number, default: 0 },
    
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    ratings: [ratingSchema],
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


// --- VIRTUALS ---

learningRoadmapSchema.virtual('averageRating').get(function() {
    if (this.ratings && this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
        return Math.round((sum / this.ratings.length) * 10) / 10;
    }
    return 0;
});


// --- MIDDLEWARE / HOOKS ---

learningRoadmapSchema.pre('save', async function(next) {
    if (!this.isModified('title')) {
        return next();
    }
    
    const baseSlug = slugify(this.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    this.slug = baseSlug;

    const slugRegex = new RegExp(`^${baseSlug}(-\\d+)?$`);
    const existingRoadmaps = await this.constructor.find({ slug: slugRegex });

    if (existingRoadmaps.length > 0) {
        const isCurrentDoc = existingRoadmaps.some(doc => doc._id.equals(this._id));
        if (!isCurrentDoc || existingRoadmaps.length > 1) {
             this.slug = `${baseSlug}-${existingRoadmaps.length + 1}`;
        }
    }
    
    next();
});


// --- MODEL METHODS ---

learningRoadmapSchema.methods.recordView = function() {
    this.viewsCount++;
    return this.save();
};

const LearningRoadmap = mongoose.model('LearningRoadmap', learningRoadmapSchema);

export default LearningRoadmap;