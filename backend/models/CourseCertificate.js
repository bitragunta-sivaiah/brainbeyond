import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // A library to generate unique IDs

const certificateSchema = new mongoose.Schema({
    /**
     * @description Reference to the user who earned the certificate.
     */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required.'],
        index: true
    },

    /**
     * @description Reference to the course for which the certificate is awarded.
     */
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required.'],
        index: true
    },

    /**
     * @description A unique, human-readable identifier for the certificate.
     * Example: CERT-a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
     */
    certificateId: {
        type: String,
        unique: true,
        required: [true, 'Certificate ID is required.'],
        default: () => `CERT-${uuidv4()}`
    },

    /**
     * @description The date when the certificate was officially issued.
     */
    issueDate: {
        type: Date,
        default: Date.now,
        required: true
    },

    /**
     * @description A unique token used in a URL to verify the certificate's authenticity.
     */
    verificationToken: {
        type: String,
        unique: true,
        required: true,
        default: () => uuidv4()
    },

    /**
     * @description The URL where the generated certificate (e.g., a PDF or image file) is stored.
     */
    certificateUrl: {
        type: String,
        trim: true,
        required: [true, 'Certificate URL is required.']
    },

    /**
     * @description Information about how the certificate was generated.
     */
    generationInfo: {
        generatedBy: {
            type: String,
            enum: ['admin', 'system', 'ai'],
            default: 'ai'
        },
        aiModel: {
            type: String,
            default: 'Gemini'
        }
    },

    /**
     * @description Denormalized course title to ensure the certificate remains accurate
     * even if the original course title is updated.
     */
    courseTitle: {
        type: String,
        required: [true, 'Course title is required at the time of issuance.']
    },

    /**
     * @description Denormalized instructor name for historical accuracy.
     */
    instructorName: {
        type: String,
        required: [true, 'Instructor name is required.']
    },

    /**
     * @description Indicates the type of access the user had to the course (e.g., "Free Course",
     * "Purchased Course", "Basic Monthly Subscription", etc.). This helps in displaying
     * appropriate certificate designs or information.
     */
    courseDesignType: { // <--- NEW FIELD ADDED HERE
        type: String,
        required: [true, 'Course design type is required.'],
        enum: [
            'Free Course',
            'Purchased Course',
            'Free Subscription Plan',
            'Basic Monthly Subscription',
            'Standard Yearly Subscription',
            'Premium Lifetime Subscription',
            'Pro Quarterly Subscription',
            'Unknown' // Fallback for undefined types
        ],
        default: 'Unknown'
    }

}, {
    timestamps: true
});

/**
 * @description Compound index to ensure a user can only have one certificate per course.
 */
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
