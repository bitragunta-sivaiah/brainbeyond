// --- models/Lesson.js ---
// Lesson Model: Represents an individual lesson within a section, which can be a video, quiz, resource, and now, embedded doubts and replies.

import mongoose from 'mongoose';
import User from './User.js';

const lessonSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a lesson title'],
        trim: true,
        maxlength: [200, 'Lesson title cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Lesson description cannot be more than 1000 characters']
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'A lesson must belong to a section']
    },
    course: { // Denormalized for easier querying, can also be populated via section
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    type: {
        type: String,
        enum: ['video', 'quiz', 'resource'],
        required: [true, 'Please specify the type of lesson']
    },
    order: { // To define the order of lessons within a section
        type: Number,
        // Removed: required: [true, 'Please specify the order of this lesson']
        // The 'order' field is no longer required to be non-null,
        // allowing for temporary null values during reordering.
    },
    duration: { // Duration specific to video lessons (in minutes)
        type: Number,
        min: 0,
        required: function() { return this.type === 'video'; } // Required only if type is 'video'
    },
    // Fields for Video Lesson
    videoUrl: {
        type: String,
        required: function() { return this.type === 'video'; }
    },
    isCompleted: { // To track user progress - this might be better managed in a separate 'UserProgress' model
        type: Boolean,
        default: false
    },
    // Fields for Quiz Lesson
    quiz: {
        type: {
            quizTitle: { // Added for a more professional quiz structure
                type: String,
                maxlength: [200, 'Quiz title cannot be more than 200 characters'],
                trim: true
            },
            quizInstructions: { // Added for quiz instructions
                type: String,
                maxlength: [1000, 'Quiz instructions cannot be more than 1000 characters']
            },
            quizDuration: { // Added for time-bound quizzes (in minutes)
                type: Number,
                min: 1
            },
            questions: [
                {
                    questionText: { type: String, required: true },
                    questionType: { // Added to allow different question types (e.g., 'multiple-choice', 'true-false', 'short-answer')
                        type: String,
                        enum: ['multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank'],
                        default: 'multiple-choice'
                    },
                    options: [{ type: String }], // Options are not required for 'short-answer' or 'fill-in-the-blank'
                    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be a string, array of strings, or number
                    explanation: { // Added for explaining the correct answer
                        type: String,
                        maxlength: [500, 'Explanation cannot be more than 500 characters']
                    },
                    points: { // Added for scoring
                        type: Number,
                        default: 1
                    }
                }
            ],
            passScore: { type: Number, default: 70, min: 0, max: 100 }, // Percentage
            attemptsAllowed: { type: Number, default: 1, min: 0 }, // 0 for unlimited attempts
            shuffleQuestions: { // Option to shuffle questions for each attempt
                type: Boolean,
                default: false
            },
            showCorrectAnswersImmediately: { // Option to show answers after each question
                type: Boolean,
                default: false
            }
        },
        required: function() { return this.type === 'quiz'; }
    },
    // NEW: Array to store student submissions for this quiz lesson
    submittedQuizzes: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Assuming 'User' model for students
                required: true
            },
            attemptNumber: { // To track multiple attempts
                type: Number,
                required: true,
                min: 1
            },
            answers: [
                {
                    questionId: { // Reference to the question in the quiz array
                        type: String, // Or mongoose.Schema.Types.ObjectId if questions were separate documents
                        required: true
                    },
                    answeredText: { // Student's answer for text-based questions
                        type: String
                    },
                    selectedOptions: [{ type: String }], // Student's selected options for multiple choice
                    isCorrect: { // Whether the student's answer was correct for this question
                        type: Boolean
                    },
                    pointsAwarded: { // Points obtained for this question in this attempt
                        type: Number
                    }
                }
            ],
            score: { // Total score for this attempt (can be raw score or percentage)
                type: Number,
                required: true
            },
            percentageScore: { // Percentage score for easier comparison with passScore
                type: Number,
                min: 0,
                max: 100
            },
            passed: { // Whether the student passed this attempt
                type: Boolean
            },
            submittedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    // Fields for Resource Lesson
    resources: [ // Array of resource objects
        {
            name: { // Name of the resource (e.g., 'Lecture Notes', 'Example Code')
                type: String,
                required: true
            },
            url: { // URL to the resource file (e.g., PDF, ZIP, external link)
                type: String,
                required: true
            },
            fileType: { // e.g., 'pdf', 'docx', 'zip', 'link'
                type: String
            }
        }
    ],
    // ADDED: Embedded Doubts and Replies
    doubts: [
        {
            user: { // The student who asked the doubt
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            question: {
                type: String,
                required: [true, 'Doubt question cannot be empty'],
                maxlength: [1000, 'Question cannot be more than 1000 characters']
            },
            isResolved: {
                type: Boolean,
                default: false
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            replies: [
                {
                    user: { // The user who replied (can be instructor, admin, or even another student)
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true
                    },
                    text: {
                        type: String,
                        required: [true, 'Reply cannot be empty'],
                        maxlength: [1000, 'Reply cannot be more than 1000 characters']
                    },
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ]
        }
    ]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

 
// NEW: Remove this lesson from all users' completedLessons progress when deleted
lessonSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    console.log(`Removing lesson ${this._id} from all enrolled users' progress.`);
    await User.updateMany(
        {}, // Affect all users
        {
            $pull: {
                'enrolledCourses.$[].progress.completedLessons': this._id
            }
        }
    );

    // Also remove if it was the lastAccessedLesson
    await User.updateMany(
        { 'enrolledCourses.progress.lastAccessedLesson': this._id },
        {
            $unset: {
                'enrolledCourses.$[elem].progress.lastAccessedLesson': ''
            }
        },
        {
            arrayFilters: [{ 'elem.progress.lastAccessedLesson': this._id }]
        }
    );

    next();
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;