import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// 1. Define the Base User Schema with common fields
const baseUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot be more than 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        // Password is required only for new documents
        required: function() { return this.isNew; },
        minlength: [5, 'Password must be at least 5 characters'],
     
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'instructor', 'customercare'],
        default: 'student',
        required: true
    },
    profileInfo: {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        avatar: { type: String, default: 'https://img.freepik.com/free-photo/portrait-person-attending-vibrant-techno-music-party_23-2150551572.jpg' },
        avatarPublicId: { type: String, default: null },
        phone: { type: String, trim: true },
        dateOfBirth: Date,
        gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
        address: { street: String, city: String, state: String, country: String, zipCode: String },
        timezone: String,
        bio: { type: String, maxlength: 500 }
    },
    socialLinks: {
        website: String,
        github: String,
        linkedin: String,
        twitter: String,
        youtube: String
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    // Merged redundant enrollment fields into a single 'enrollments' array
    enrollments: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
        enrolledAt: { type: Date, default: Date.now },
        lastAccessed: Date
    }],
    purchasedSubscriptions: [{
        subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
        startDate: { type: Date, required: true },
        endDate: Date, // Implicitly not required
        isActive: { type: Boolean, default: true },
        autoRenew: { type: Boolean, default: false }
    }],
    certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
    oneTimeToken: { type: String, select: false },
    oneTimeTokenExpire: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
    sessionToken: {
        type: String,
        select: false
    },
    lastLogin: Date,
    loginHistory: [{
        ipAddress: String,
        device: String,
        browser: String,
        os: String,
        location: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: 'role'
});

// --- VIRTUAL PROPERTIES ---
baseUserSchema.virtual('fullName').get(function () {
    const nameParts = [];
    if (this.profileInfo?.firstName) nameParts.push(this.profileInfo.firstName);
    if (this.profileInfo?.lastName) nameParts.push(this.profileInfo.lastName);
    return nameParts.join(' ').trim();
});

// --- MIDDLEWARE ---

// Middleware to hash password before saving
baseUserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new) and is not empty
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- METHODS ---
baseUserSchema.methods.getSignedJwtToken = function (expiresIn = process.env.JWT_EXPIRE) {
    if (!this.sessionToken) {
        // Generate the session token here if it doesn't exist
        this.sessionToken = crypto.randomBytes(20).toString('hex');
    }
    return jwt.sign(
        { id: this._id, role: this.role, session: this.sessionToken },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn }
    );
};

baseUserSchema.methods.generateOneTimeToken = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.oneTimeToken = crypto.createHash('sha256').update(otp).digest('hex');
    this.oneTimeTokenExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    return otp;
};

baseUserSchema.methods.matchOneTimeToken = function (enteredOtp) {
    const hashedOtp = crypto.createHash('sha256').update(enteredOtp).digest('hex');
    return this.oneTimeToken === hashedOtp && this.oneTimeTokenExpire > new Date();
};

baseUserSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

baseUserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// 2. Create the base model
const User = mongoose.model('User', baseUserSchema);

// 3. Create discriminator schemas for each role

// Student-specific fields
const studentSchema = new mongoose.Schema({
    careerGoals: String,
    learningObjectives: [String],
    preferredLearningStyles: [{
        type: String,
        enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic']
    }],
    timeAvailability: {
        hoursPerWeek: Number,
        preferredDays: [String],
        preferredTimes: [String]
    },
    achievements: [{
        title: String,
        description: String,
        type: {
            type: String,
            enum: ['certificate', 'badge', 'award', 'contest_win']
        },
        date: Date,
        associatedWith: { type: mongoose.Schema.Types.ObjectId, refPath: 'achievements.associatedModel' },
        associatedModel: { type: String, enum: ['Course', 'Contest'] }
    }],
    education: [{
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startYear: Number,
        endYear: Number,
    }],
    skills: [{
        name: { type: String, trim: true },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' }
    }],
    interests: [String],
    workExperience: [{
        title: { type: String, trim: true },
        company: { type: String, trim: true },
        startDate: Date,
        endDate: Date,
        description: String
    }],
    stats: {
        coursesCompleted: { type: Number, default: 0 },
        lessonsCompleted: { type: Number, default: 0 },
        quizzesTaken: { type: Number, default: 0 },
        codingProblemsSolved: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActiveDate: Date
    }
});

// Instructor-specific fields
const instructorSchema = new mongoose.Schema({
    experience: { type: Number, min: 0, default: 0 },
    certifications: [{
        name: String,
        issuer: String,
        dateObtained: Date,
    }],
    specializations: [{ type: String, trim: true, lowercase: true }],
    teachingPhilosophy: { type: String, maxlength: 1000 },
    portfolioUrl: String,
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    totalStudents: { type: Number, default: 0, min: 0 },
    totalCourses: { type: Number, default: 0, min: 0 },
    totalReviews: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 }
});

// Customer Care-specific fields
const customerCareSchema = new mongoose.Schema({
    position: String,
    specialization: [String],
    languages: [String],
    availability: {
        workingDays: [String],
        shiftStart: String,
        shiftEnd: String,
        timezone: String
    },
    stats: {
        ticketsResolved: { type: Number, default: 0 },
        averageResolutionTime: Number,
        customerSatisfaction: Number,
        currentActiveTickets: { type: Number, default: 0 }
    },
    skills: [{
        name: String,
        proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] }
    }],
    tools: [{
        name: String,
        proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] }
    }],
    performanceReviews: [{
        date: Date,
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        feedback: String,
        goals: [String]
    }],
    currentAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' }]
});


/**
 * @description Schema for a job candidate.
 */
const candidateSchema = new mongoose.Schema({
    resumeUrl: { type: String },
    portfolioUrl: { type: String },
    keySkills: [String],
    experienceLevel: {
        type: String,
        enum: ['entry-level', 'junior', 'mid-level', 'senior', 'lead', 'principal']
    },
    jobPreferences: {
        jobTypes: [{ type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] }],
        locations: [String],
        workArrangement: { type: String, enum: ['remote', 'hybrid', 'on-site'] }
    },
    applicationHistory: [{
        jobPostId: { type: mongoose.Schema.Types.ObjectId },
        companyName: String,
        appliedAt: { type: Date, default: Date.now }
    }]
});

/**
 * @description Schema for a team member working under a hiring manager.
 */
const teamMemberSchema = new mongoose.Schema({
    hiringManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    permissions: {
        canCreateJobs: { type: Boolean, default: false },
        canEditJobs: { type: Boolean, default: false },
        canViewCandidates: { type: Boolean, default: true },
        canUpdateCandidateStatus: { type: Boolean, default: true },
        canScheduleInterviews: { type: Boolean, default: true },
    }
});

/**
 * @description Schema for a hiring manager or company representative.
 */
const collabHiringSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    companyWebsite: { type: String, trim: true },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    jobPosts: [{
        title: { type: String, required: true, trim: true },
        status: { type: String, enum: ['draft', 'open', 'closed', 'archived'], default: 'draft' },
        location: {
            city: String,
            state: String,
            country: String,
            type: { type: String, enum: ['remote', 'hybrid', 'on-site'], required: true }
        },
        jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], required: true },
        department: { type: String, trim: true },
        description: { type: String, required: true },
        responsibilities: [String],
        qualifications: [String],
        skillsRequired: [String],
        salaryRange: {
            min: Number,
            max: Number,
            currency: { type: String, default: 'INR' },
            period: { type: String, enum: ['yearly', 'monthly', 'hourly'], default: 'yearly' }
        },
        postedDate: { type: Date, default: Date.now },
        expiryDate: Date,
        applicants: [{
            candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            resumeFile : String,
            coverLetter: String,
            applicationDate: { type: Date, default: Date.now },
            status: {
                type: String,
                enum: ['applied', 'screening', 'shortlisted', 'interviewing', 'offer', 'hired', 'rejected', 'on-hold'],
                default: 'applied'
            },
            currentStage: String
        }]
    }]
});

// Apply the discriminators to the base User model
User.discriminator('candidate', candidateSchema);
User.discriminator('team_member', teamMemberSchema);
User.discriminator('collab_hiring', collabHiringSchema);

// 4. Apply the discriminators to the base User model
User.discriminator('student', studentSchema);
User.discriminator('instructor', instructorSchema);
User.discriminator('customercare', customerCareSchema);
// 'admin' role will use the base schema without extra fields

export default User;