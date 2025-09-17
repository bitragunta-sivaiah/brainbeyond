import mongoose from 'mongoose';

/**
 * @description Defines the subscription tiers for hiring collaborators.
 * This model dictates the features, limits, and types of plans available to a 'collab_hiring' user.
 */
const subscriptionPlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: [true, 'Plan name is required.'],
        trim: true,
        unique: true
    },
    // NEW: Added a type selector for different plan categories.
    planType: {
        type: String,
        required: [true, 'Plan type is required.'],
        enum: ['individual', 'team', 'enterprise', 'custom'],
        default: 'team'
    },
    // NEW: A field to store a custom name if planType is 'custom'.
    customPlanName: {
        type: String,
        trim: true,
        // This field should only be used when 'planType' is 'custom'.
        // Validation for this can be handled in your backend logic/controller.
    },
    price: {
        monthly: { type: Number, required: true, min: 0 },
        yearly: { type: Number, required: true, min: 0 }
    },
    features: {
        type: [String],
        required: true
    },

    // --- Core Limits & Features ---
    jobPostLimit: { // NEW: Added a limit for active job postings.
        type: Number,
        required: [true, 'Job post limit is required.'],
        default: 5
    },
    teamMemberLimit: {
        type: Number,
        required: true,
        default: 1
    },
    dailyInterviewLimit: {
        type: Number,
        required: true,
        default: 5
    },
    
    // --- Boolean Toggles for Premium Features ---
    aiFeedbackEnabled: {
        type: Boolean,
        default: true
    },
    advancedAnalytics: { // NEW: Access to advanced reporting and analytics.
        type: Boolean,
        default: false,
    },
    
    // --- Additional Plan Attributes ---
    supportLevel: { // NEW: Differentiated customer support levels.
        type: String,
        enum: ['standard', 'priority', 'dedicated'],
        default: 'standard'
    },
    isRecommended: { // NEW: Useful for highlighting a plan in the UI (e.g., "Most Popular").
        type: Boolean,
        default: false,
    },
    isActive: { // Controls if the plan is available for new subscriptions.
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields.
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;