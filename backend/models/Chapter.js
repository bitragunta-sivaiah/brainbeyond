import mongoose from 'mongoose';

const { Schema } = mongoose;

const chapterSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Chapter title is required.'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },
    order: { // The sequential position of the chapter within the course
        type: Number,
     
    },
    isPublished: { // Controls the visibility of the chapter to students
        type: Boolean,
        default: false,
    },
    lessons: [{
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
    }],
    liveClasses: [{ // A chapter can now contain one or more live classes
        type: Schema.Types.ObjectId,
        ref: 'LiveClass',
    }],
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
});

// Middleware to handle cascading deletes for all content within the chapter
chapterSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const chapterId = this._id;
        console.log(`Starting cascade delete for Chapter: ${chapterId}`);

        // 1. Delete all lessons within this chapter
        const Lesson = mongoose.model('Lesson');
        await Lesson.deleteMany({ chapter: chapterId });
        console.log(`Deleted all lessons for chapter: ${chapterId}`);

        // 2. Delete all live classes associated with this chapter
        const LiveClass = mongoose.model('LiveClass');
        await LiveClass.deleteMany({ chapter: chapterId });
        console.log(`Deleted all live classes for chapter: ${chapterId}`);

        next();
    } catch (err) {
        console.error("Error during chapter cascade delete:", err);
        next(err);
    }
});

// Post-hook to update course statistics after a chapter is saved or deleted
chapterSchema.post(['save', 'deleteOne'], { document: true, query: false }, async function (doc) {
    try {
        const Course = mongoose.model('Course');
        // 'doc' refers to the chapter that was just processed
        const course = await Course.findById(doc.course);
        
        // This assumes your Course model has a method to recalculate its content stats
        if (course && typeof course.updateContentCounts === 'function') {
            await course.updateContentCounts();
        }
    } catch (err) {
        console.error("Error updating course stats after chapter change:", err);
    }
});

export default mongoose.model('Chapter', chapterSchema);