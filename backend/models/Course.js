import mongoose from 'mongoose';
import slugify from 'slugify';
import Lesson from './Lesson.js'; // Import Lesson model to count lessons

const { Schema } = mongoose;

const courseSchema = new Schema({
    // --- Basic Information ---
    title: {
        type: String,
        required: [true, 'Course title is required.'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters.'],
    
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens).'],
    },
    description: {
        type: String,
        required: [true, 'Course description is required.'],
        minlength: [50, 'Description must be at least 50 characters.'],
    },
    shortDescription: {
        type: String,
        required: [true, 'Short description is required.'],
        minlength: [20, 'Short description must be at least 20 characters.'],
         
    },
    // --- Media & Content ---
    thumbnail: {
        type: String,
        required: [true, 'Course thumbnail URL is required.'],
        trim: true,
    },
    previewVideo: {
        type: String,
        trim: true,
    },
    // --- Category and Metadata ---
    category: {
        type: String,
        enum: {
            values: ['Web Development', 'Data Science', 'Mobile Development', 'Design', 'Marketing', 'Other'],
            message: '{VALUE} is not a valid category.',
        },
        required: [true, 'Course category is required.'],
    },
    customCategoryName: {
        type: String,
        trim: true,
        required: function() {
            return this.category === 'Other';
        },
    },
    instructors: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'At least one instructor is required.'],
    }],
    prerequisites: [{
        type: String,
        trim: true,
        minlength: 3,
    }],
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        lowercase: true,
    },
    language: {
        type: String,
        default: 'English',
        trim: true,
    },
    duration: {
        type: Number,
        min: [0, 'Duration cannot be negative.'],
    },
    // --- Financials ---
    price: {
        type: Number,
        required: [true, 'Course price is required.'],
        min: [0, 'Price cannot be negative.'],
    },
    discountedPrice: {
        type: Number,
        min: [0, 'Discounted price cannot be negative.'],
    },
    isFree: {
        type: Boolean,
        default: false,
    },
    chapters: [{
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
    }],
    // --- User & Subscription Integration ---
    enrolledStudents: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        enrollmentDate: {
            type: Date,
            default: Date.now,
        },
    }],
    isIncludedInSubscription: {
        type: Boolean,
        default: false,
        required: [true, 'Specify if the course is included in a subscription.'],
    },
    availableInPlans: [{
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
    }],
    // --- Coupon Integration ---
    coupons: [{
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
    }],
    // review by users
    reviews: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Review comment cannot exceed 500 characters.'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    // --- Status & Visibility ---
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    // --- Statistics ---
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalRatings: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalStudents: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalLessons: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalQuizzes: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalArticles: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCodingProblems: {
        type: Number,
        default: 0,
        min: 0,
    },
    // --- Tags and Searchability ---
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
}, {
    timestamps: true,
});

// Helper function to update course statistics
courseSchema.methods.updateLessonCounts = async function() {
    try {
        const totalLessons = await mongoose.model('Lesson').countDocuments({ course: this._id });
        const totalQuizzes = await mongoose.model('Lesson').countDocuments({ course: this._id, type: 'quiz' });
        const totalArticles = await mongoose.model('Lesson').countDocuments({ course: this._id, type: 'article' });
        const totalCodingProblems = await mongoose.model('Lesson').countDocuments({ course: this._id, type: 'codingProblem' });
        
        this.totalLessons = totalLessons;
        this.totalQuizzes = totalQuizzes;
        this.totalArticles = totalArticles;
        this.totalCodingProblems = totalCodingProblems;

        await this.save();
    } catch (error) {
        console.error(`Error updating lesson counts for course ${this._id}:`, error);
    }
};

courseSchema.pre('validate', function(next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true
        });
    }
    next();
});

courseSchema.pre(['remove', 'deleteOne'], { document: true, query: false }, async function(next) {
    try {
        const courseId = this._id;
        console.log(`Starting cascade delete for Course: ${courseId}`);

        const User = mongoose.model('User');
        await User.updateMany(
            { $or: [{ 'enrolledCourses.course': courseId }, { 'enrollCoursePurchase.course': courseId }] },
            { 
                $pull: {
                    enrolledCourses: { course: courseId },
                    enrollCoursePurchase: { course: courseId }
                }
            }
        );
        console.log(`Removed course ${courseId} from all user enrollments.`);

        const chapters = await mongoose.model('Chapter').find({ course: courseId });
        for (const chapter of chapters) {
            await chapter.deleteOne();
        }
        console.log(`Initiated deletion for all chapters in course: ${courseId}`);

        next();
    } catch (err) {
        next(err);
    }
});

export default mongoose.model('Course', courseSchema);