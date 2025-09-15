import mongoose from 'mongoose';
import validator from 'validator';

// --- SUB-SCHEMA DEFINITIONS ---
// These sub-schemas are well-structured and remain unchanged.
const addressSchema = new mongoose.Schema({
    street: { type: String, trim: true,  },
    city: { type: String, trim: true,  },
    state: { type: String, trim: true,  },
    zipCode: { type: String, trim: true, },
    country: { type: String, trim: true,  }
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
    platform: { type: String,  trim: true,  },
    url: { type: String, trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
}, { _id: false });

const namedLinkSchema = new mongoose.Schema({
    name: { type: String,  trim: true,  },
    url: { type: String,  trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
}, { _id: false });

const gpaSchema = new mongoose.Schema({
    value: { type: String,  trim: true, },
    type: {
        type: String,
        enum: ['GPA', 'CGPA', 'Percentage', 'Marks'],
        trim: true
    }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
    name: { type: String, trim: true, },
    issuingOrganization: { type: String, trim: true, },
    issueDate: { type: Date },
    credentialUrl: { type: String, trim: true, validate: { validator: (v) => v ? validator.isURL(v) : true, message: 'Please enter a valid URL' } }
});

const achievementSchema = new mongoose.Schema({
    title: { type: String, trim: true,  },
    issuer: { type: String, trim: true, },
    date: { type: Date },
    description: { type: String, trim: true,  }
});

const customSectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, trim: true,  },
    items: [{
        _id: false,
        title: { type: String, trim: true,  },
        subTitle: { type: String, trim: true,  },
        startDate: { type: Date },
        endDate: { type: Date },
        description: [{ type: String, trim: true, }],
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
      
    },
    slug: { type: String, unique: true, trim: true },
    contact: {
        firstName: { type: String,  trim: true,  },
        lastName: { type: String,  trim: true,  },
        professionalTitle: { type: String, trim: true,  },
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
        institution: { type: String,  trim: true, },
        degree: { type: String,  trim: true, },
        fieldOfStudy: { type: String, trim: true, },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        gpa: gpaSchema
    }],
    projects: [{
        _id: false,
        name: { type: String,  trim: true, },
        description: [{ type: String, trim: true,  }],
        technologiesUsed: [{ type: String, trim: true,  }],
        links: [namedLinkSchema]
    }],
    skills: [{
        _id: false,
        category: { type: String, trim: true,   },
        items: [{ type: String, trim: true,   }]
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
