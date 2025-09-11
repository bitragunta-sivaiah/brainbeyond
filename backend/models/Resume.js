import mongoose from 'mongoose';
import validator from 'validator';

// --- SUB-SCHEMA DEFINITIONS ---
// These sub-schemas are well-structured and remain unchanged.
const addressSchema = new mongoose.Schema({
    street: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    zipCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 100 }
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
    platform: { type: String,  trim: true, maxlength: 50 },
    url: { type: String, trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
}, { _id: false });

const namedLinkSchema = new mongoose.Schema({
    name: { type: String,  trim: true, maxlength: 50 },
    url: { type: String,  trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
}, { _id: false });

const gpaSchema = new mongoose.Schema({
    value: { type: String,  trim: true, maxlength: 20 },
    type: {
        type: String,
        enum: ['GPA', 'CGPA', 'Percentage', 'Marks'],
        trim: true
    }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
    name: { type: String, trim: true, maxlength: 150 },
    issuingOrganization: { type: String, trim: true, maxlength: 150 },
    issueDate: { type: Date },
    credentialUrl: { type: String, trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
});

const achievementSchema = new mongoose.Schema({
    title: { type: String, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 150 },
    date: { type: Date },
    description: { type: String, trim: true, maxlength: 1000 }
});

const customSectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, trim: true, maxlength: 100 },
    items: [{
        _id: false,
        title: { type: String, trim: true, maxlength: 200 },
        subTitle: { type: String, trim: true, maxlength: 200 },
        startDate: { type: Date },
        endDate: { type: Date },
        description: [{ type: String, trim: true, maxlength: 500 }],
        links: [namedLinkSchema]
    }]
});

// --- MAIN RESUME SCHEMA ---
const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A resume must belong to a user.'], // MODIFIED: Enforced data integrity
        index: true
    },
    fileName: {
        type: String,
        // REMOVED: `required` flag to allow AI to generate or use a default.
        trim: true,
        maxlength: 200
    },
    slug: { type: String, unique: true, trim: true },
    contact: {
        firstName: { type: String,  trim: true, maxlength: 50 },
        lastName: { type: String,  trim: true, maxlength: 50 },
        professionalTitle: { type: String, trim: true, maxlength: 100 },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                 validator: (v) => v ? validator.isEmail(v) : true, // Allows empty email
                 message: 'Please enter a valid email address'
            }
        },
        phone: { type: String, trim: true, maxlength: 30 },
        website: {
            type: String,
            trim: true,
            validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' }
        },
        address: addressSchema,
        socialLinks: [socialLinkSchema]
    },
    summary: { type: String, trim: true },
    workExperience: [{
        _id: false,
        jobTitle: { type: String,  trim: true  },
        company: { type: String,  trim: true  },
        location: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: [{ type: String, trim: true }],
    }],
    education: [{
        _id: false,
        institution: { type: String,  trim: true, maxlength: 150 },
        degree: { type: String,  trim: true, maxlength: 150 },
        fieldOfStudy: { type: String, trim: true, maxlength: 150 },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        gpa: gpaSchema
    }],
    projects: [{
        _id: false,
        name: { type: String,  trim: true, maxlength: 150 },
        description: [{ type: String, trim: true, maxlength: 500 }],
        technologiesUsed: [{ type: String, trim: true, maxlength: 50 }],
        links: [namedLinkSchema]
    }],
    skills: [{
        _id: false,
        category: { type: String, trim: true,  maxlength: 100 },
        items: [{ type: String, trim: true,  maxlength: 100 }]
    }],
    certifications: [certificationSchema],
    achievements: [achievementSchema],
    customSections: [customSectionSchema],
    sectionOrder: [{
        type: String,
        enum: ['summary', 'workExperience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'customSections']
    }],
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// --- MIDDLEWARE (Unchanged, remains good practice) ---
resumeSchema.pre('save', function(next) {
    if (this.isModified('fileName') && this.fileName) {
        const randomString = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        this.slug = this.fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + `-${randomString}`;
    }
    this.workExperience?.forEach(job => {
        if (job.isCurrent) job.endDate = undefined;
    });
    this.education?.forEach(edu => {
        if (edu.isCurrent) edu.endDate = undefined;
    });
    next();
});

export default mongoose.model('Resume', resumeSchema);