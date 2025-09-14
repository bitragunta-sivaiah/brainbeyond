import mongoose from 'mongoose';
import User from './User.js';

const { Schema } = mongoose;

// --- EXISTING SUB-SCHEMAS (Unchanged) ---

const resourceSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Please add a resource title'],
        trim: true,
        maxlength: [200, 'Resource title cannot be more than 200 characters']
    },
    url: {
        type: String,
        required: [true, 'Please add a resource URL']
    },
    type: {
        type: String,
        enum: ['pdf', 'doc', 'zip', 'link', 'image', 'other', 'csv'],
    },
});

const answerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isBestAnswer: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const doubtSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    question: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['unanswered', 'answered', 'resolved'],
        default: 'unanswered',
    },
    answers: [answerSchema],
}, { timestamps: true });

const commentReplySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
}, { timestamps: true });

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    replies: [commentReplySchema],
}, { timestamps: true });

const quizAttemptAnswerSchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, required: true },
    answeredText: String,
    selectedOptions: [{ type: String }],
    isCorrect: { type: Boolean },
    pointsAwarded: { type: Number }
});

const quizAttemptSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    answers: [quizAttemptAnswerSchema],
    completedAt: { type: Date }
}, { timestamps: true });


// --- NEW SUB-SCHEMAS FOR AI TEST FEATURE ---

const aiSuggestionSchema = new Schema({
    suggestionText: {
        type: String,
        required: [true, 'Suggestion text is required.'],
        trim: true
    },
    recommendedLesson: {
        type: Schema.Types.ObjectId,
        ref: 'Lesson'
    },
    suggestionType: {
        type: String,
        enum: ['review_concept', 'practice_problem', 'next_lesson', 'external_resource'],
        default: 'review_concept'
    }
});

const aiTestAttemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'failed'],
        default: 'in-progress'
    },
    dialogue: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        evaluation: { type: String }
    }],
    finalFeedback: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 100
    },
    isPassed: {
        type: Boolean,
        default: false
    },
    suggestions: [aiSuggestionSchema],
    completedAt: {
        type: Date
    }
}, { timestamps: true });


// --- MAIN LESSON SCHEMA (UPDATED) ---

const lessonSchema = new Schema({
    // General Lesson Information
    title: {
        type: String,
        required: [true, 'Please add a lesson title'],
        trim: true,
        maxlength: [200, 'Lesson title cannot be more than 200 characters']
    },
    description: {
        type: String,
        // The maxlength constraint has been removed here to allow for longer descriptions.
    },
    chapter: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: [true, 'A lesson must belong to a chapter']
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    type: {
        type: String,
        enum: ['video', 'article', 'codingProblem', 'quiz', 'contest', 'aiTest'],
        required: [true, 'Please specify the type of lesson']
    },
    order: {
        type: Number,
        required: true,
    },
    isFree: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    resources: [resourceSchema],
    doubts: [doubtSchema],

    // --- Dynamic content based on `type` ---
    content: {
        video: {
            duration: { type: Number, min: 0 },
            videoUrl: { type: String }
        },
        article: {
            content: { type: String },
            excerpt: { type: String, maxLength: 300 },
            author: { type: Schema.Types.ObjectId, ref: 'User' },
            featuredImage: String,
            category: {
                type: String,
                enum: {
                    values: ['Web Development', 'Data Science', 'Mobile Development', 'Design', 'Marketing', 'Other'],
                    message: '{VALUE} is not a valid category.',
                },
            },
            tags: [{ type: String, maxlength: [50, 'Tag cannot be more than 50 characters'] }],
            isPublished: { type: Boolean, default: false },
            publishedAt: Date,
            meta: {
                views: { type: Number, default: 0 },
                likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            },
            comments: [commentSchema]
        },
        codingProblem: {
            description: { type: String, maxlength: [1000, 'Coding problem description cannot be more than 1000 characters'] },
            difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'intermediate', 'advanced'], default: 'medium' },
            starterCode: { type: String },
            solutionCode: { type: String },
            testCases: [{
                input: { type: String },
                output: { type: String, required: [true, 'Please add expected output for the test case'] },
                isHidden: { type: Boolean, default: false },
            }],
            allowedLanguages: [{ type: String, required: [true, 'Please specify at least one allowed programming language'] }],
            points: { type: Number, default: 10 },
            hints: [{ type: String, maxlength: [500, 'Hint cannot be more than 500 characters'] }],
            topics: [String],
            submissions: [{
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                code: { type: String, required: [true, 'Please add your solution code'] },
                language: { type: String, required: [true, 'Please specify the programming language used'] },
                status: { type: String, enum: ['pending', 'correct', 'incorrect', 'error'], default: 'pending' },
                score: { type: Number, default: 0 },
                results: [{
                    testCaseId: { type: Schema.Types.ObjectId },
                    passed: { type: Boolean, default: false },
                    executionTime: Number,
                    memoryUsed: Number,
                    output: String,
                    expectedOutput: String
                }],
            }, { timestamps: true }]
        },
        quiz: {
            quizInstructions: { type: String, maxlength: [1000, 'Quiz instructions cannot be more than 1000 characters'] },
            questions: [{
                questionText: { type: String, required: [true, 'Please add a question text'], maxlength: [500, 'Question text cannot be more than 500 characters'] },
                questionType: { type: String, enum: ['single-choice', 'multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank'], default: 'multiple-choice' },
                options: [{ optionText: { type: String, required: true }, isCorrect: { type: Boolean, default: false } }],
                correctAnswer: [String],
                explanation: { type: String, maxlength: [500, 'Explanation cannot be more than 500 characters'] },
                points: { type: Number, default: 1 }
            }],
            passScore: { type: Number, min: 0, max: 100, default: 50 },
            attemptsAllowed: { type: Number, default: 1, min: 0 },
            shuffleQuestions: { type: Boolean, default: false },
            showCorrectAnswersImmediately: { type: Boolean, default: false },
            attempts: [quizAttemptSchema]
        },
        contest: {
            description: { type: String, maxlength: [1000, 'Contest description cannot be more than 1000 characters'] },
            startTime: { type: Date },
            endTime: { type: Date },
            problems: [{ type: Schema.Types.ObjectId, ref: 'CodingProblem' }],
            maxParticipants: { type: Number, default: 100 },
            isPublic: { type: Boolean, default: true },
            participants: [{
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                score: { type: Number, default: 0 },
                rank: { type: Number, default: 0 },
                solvedProblems: [{
                    problem: { type: Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
                    solvedAt: { type: Date, default: Date.now },
                    score: { type: Number, default: 0 },
                    isCorrect: { type: Boolean, default: false },
                    attempts: [{ code: { type: String, required: [true, 'Please add your solution code'] } }],
                }],
            }, { timestamps: true }],
            rules: [String],
            prices: [{ position: Number, amount: Number }],
            status: {
                type: String,
                enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
                default: 'upcoming'
            }
        },
        aiTest: {
            instructions: {
                type: String,
                maxlength: [1000, 'AI test instructions cannot be more than 1000 characters.'],
                default: 'The AI will ask you a series of questions to test your understanding of this lesson. Answer each question to the best of your ability.'
            },
            topicsCovered: [{
                type: String,
                trim: true
            }],
            passingRating: {
                type: Number,
                min: 0,
                max: 100,
                default: 75
            },
            attemptsAllowed: {
                type: Number,
                default: 2,
                min: 0
            },
            attempts: [aiTestAttemptSchema]
        }
    }
}, {
    timestamps: true,
});

// --- MIDDLEWARE (UPDATED) ---

lessonSchema.pre('save', function (next) {
    const lesson = this;
    const { type, content } = lesson;

    const allowedKeys = {
        video: ['duration', 'videoUrl'],
        article: ['content', 'excerpt', 'author', 'featuredImage', 'category', 'tags', 'isPublished', 'publishedAt', 'meta', 'comments'],
        codingProblem: ['description', 'difficulty', 'starterCode', 'solutionCode', 'testCases', 'allowedLanguages', 'points', 'hints', 'topics', 'submissions'],
        quiz: ['quizInstructions', 'questions', 'passScore', 'attemptsAllowed', 'shuffleQuestions', 'showCorrectAnswersImmediately', 'attempts'],
        contest: ['description', 'startTime', 'endTime', 'problems', 'maxParticipants', 'isPublic', 'participants', 'rules', 'prices', 'status'],
        aiTest: ['instructions', 'topicsCovered', 'passingRating', 'attemptsAllowed', 'attempts']
    };

    if (!content || !content[type]) {
        return next(new Error(`A lesson of type '${type}' must have a valid 'content.${type}' object.`));
    }

    for (const key of Object.keys(content)) {
        if (key !== type) {
            lesson.content[key] = undefined;
        }
    }

    next();
});

// --- HOOKS (Unchanged) ---

lessonSchema.pre(['remove', 'deleteOne'], { document: true, query: false }, async function (next) {
    try {
        const lessonId = this._id;
        console.log(`Starting cascade delete for Lesson: ${lessonId}`);

        const User = mongoose.model('User');

        await User.updateMany(
            { 'enrolledCourses.completedLessons': lessonId },
            { $pull: { 'enrolledCourses.$.completedLessons': lessonId } }
        );

        await User.updateMany(
            { 'enrollCoursePurchase.completedLessons': lessonId },
            { $pull: { 'enrollCoursePurchase.$.completedLessons': lessonId } }
        );

        console.log(`Removed lesson ${lessonId} from all user completion records.`);

        const Chapter = mongoose.model('Chapter');
        await Chapter.updateOne(
            { _id: this.chapter },
            { $pull: { lessons: lessonId } }
        );
        console.log(`Removed lesson ${lessonId} reference from parent chapter.`);

        next();
    } catch (err) {
        next(err);
    }
});

lessonSchema.post(['save', 'deleteOne'], async function (doc) {
    const Course = mongoose.model('Course');
    const course = await Course.findById(doc.course);
    if (course && course.updateLessonCounts) {
        await course.updateLessonCounts();
    }
});

export default mongoose.model('Lesson', lessonSchema);