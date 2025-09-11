import mongoose from 'mongoose';

const { Schema } = mongoose;

const progressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    completedLessons: [{
        lesson: {
            type: Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        completionDate: {
            type: Date,
            default: Date.now
        },
    }],
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// A compound index to ensure each user-course combination is unique
progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Method to calculate and update progress percentage
progressSchema.methods.calculateProgress = async function() {
    const totalLessonsInCourse = await mongoose.model('Lesson').countDocuments({ course: this.course });
    if (totalLessonsInCourse > 0) {
        this.progressPercentage = Math.round((this.completedLessons.length / totalLessonsInCourse) * 100);
    } else {
        this.progressPercentage = 0;
    }
    this.lastAccessed = Date.now();
    await this.save();
};

export default mongoose.model('Progress', progressSchema);