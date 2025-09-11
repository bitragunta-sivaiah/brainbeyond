import mongoose from 'mongoose';

const adminProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    position: String,
    department: String,
    responsibilities: [String],
    accessLevel: {
        type: String,
        enum: ['super', 'content', 'financial', 'support', 'marketing'],
        default: 'content'
    },
    permissions: {
        canManageUsers: Boolean,
        canManageContent: Boolean,
        canManageCourses: Boolean,
        canManageFinancials: Boolean,
        canManageSystemSettings: Boolean,
        canViewAnalytics: Boolean,
        canManageSupport: Boolean
    },
    contactInformation: {
        officeLocation: String,
        phoneExtension: String,
        emergencyContact: String
    },
    activityLog: [{
        action: String,
        entityType: String,
        entityId: mongoose.Schema.Types.ObjectId,
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: String
    }],
    preferences: {
        dashboardLayout: String,
        notificationSettings: {
            userReports: Boolean,
            systemAlerts: Boolean,
            financialTransactions: Boolean,
            contentApprovals: Boolean
        }
    },
}, {
    timestamps: true
});

export default mongoose.model('AdminProfile', adminProfileSchema);