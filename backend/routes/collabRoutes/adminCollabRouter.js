import express from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

// Import all required models
import SubscriptionPlan from '../../models/collab/SubscriptionPlan.js';
import User from '../../models/User.js';
import InterviewPlan from '../../models/collab/InterviewPlan.js';
import InterviewSession from '../../models/collab/InterviewSession.js';
import InterviewResult from '../../models/collab/InterviewResult.js';
import Order from '../../models/Order.js';

// Import authentication middleware
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and admin authorization middleware to all routes in this file
router.use(protect, authorize('admin'));

//==========================================================================
// CRUD Routes for Subscription Plans
//==========================================================================

/**
 * @route   POST /api/v1/admin/collab/plans
 * @desc    Create a new subscription plan
 * @access  Private (Admin)
 */
router.post('/plans', async (req, res) => {
    try {
        // CHANGED: Destructuring all new fields from the updated model
        const {
            planName,
            planType,
            customPlanName,
            price,
            features,
            jobPostLimit,
            teamMemberLimit,
            dailyInterviewLimit,
            aiFeedbackEnabled,
            advancedAnalytics,
            supportLevel,
            isRecommended,
            isActive
        } = req.body;

        // More robust validation for new required fields
        if (!planName || !planType || !price || !features || !jobPostLimit) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields: planName, planType, price, features, and jobPostLimit.' });
        }

        // NEW: Add logic to handle the custom plan name
        const planData = {
            planName,
            planType,
            // Only save customPlanName if the type is 'custom'
            customPlanName: planType === 'custom' ? customPlanName : undefined,
            price,
            features,
            jobPostLimit,
            teamMemberLimit,
            dailyInterviewLimit,
            aiFeedbackEnabled,
            advancedAnalytics,
            supportLevel,
            isRecommended,
            isActive
        };

        const newPlan = await SubscriptionPlan.create(planData);

        res.status(201).json({ success: true, data: newPlan });
    } catch (error) {
        console.error('Error creating subscription plan:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: `A plan with the name "${req.body.planName}" already exists.` });
        }
        // Handle Mongoose validation errors more gracefully
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   GET /api/v1/admin/collab/plans
 * @desc    Get all subscription plans
 * @access  Private (Admin)
 */
router.get('/plans', async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find();
        res.status(200).json({ success: true, count: plans.length, data: plans });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   PUT /api/v1/admin/collab/plans/:id
 * @desc    Update a subscription plan
 * @access  Private (Admin)
 * @note    This route dynamically handles all fields from the new model
 * due to the use of req.body. No major changes were needed here.
 */
router.put('/plans/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid plan ID' });
        }

        // If planType is not 'custom', ensure customPlanName is removed
        if (req.body.planType && req.body.planType !== 'custom') {
            req.body.customPlanName = undefined;
        }

        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedPlan) {
            return res.status(404).json({ success: false, message: 'Subscription plan not found' });
        }

        res.status(200).json({ success: true, data: updatedPlan });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   DELETE /api/v1/admin/collab/plans/:id
 * @desc    Delete a subscription plan
 * @access  Private (Admin)
 */
router.delete('/plans/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid plan ID' });
        }
        const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Subscription plan not found' });
        }
        res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting subscription plan:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


//==========================================================================
// Analytics and Reporting Routes
//==========================================================================

const getHiringAnalyticsData = async () => {
    // 1. Find all users who are hiring managers
    const hiringManagers = await User.find({ role: 'collab_hiring' }).lean();

    // 2. Find purchase counts for each plan using an aggregation pipeline on Orders
    const planPurchaseStats = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.itemType': 'collab_subscriptionplan', 'payment.status': 'completed' } },
        { $group: { _id: '$items.itemId', purchaseCount: { $sum: 1 } } }
    ]);

    const purchaseCountMap = new Map(
        planPurchaseStats.map(stat => [stat._id.toString(), stat.purchaseCount])
    );

    // 3. Process each hiring manager to gather their specific stats
    const analyticsDataPromises = hiringManagers.map(async (manager) => {
        const activeSub = manager.purchasedSubscriptions?.find(sub => sub.isActive);
        const planId = activeSub?.subscription;

        const [interviewPlanCount, interviewSessionCount, completedSessions] = await Promise.all([
            InterviewPlan.countDocuments({ createdBy: manager._id }),
            InterviewSession.countDocuments({ hiringManager: manager._id }),
            InterviewSession.find({ hiringManager: manager._id, status: 'completed' }).select('_id candidate').lean()
        ]);

        const completedSessionIds = completedSessions.map(s => s._id);
        const uniqueCandidates = new Set(completedSessions.map(s => s.candidate.toString()));
        const candidatesAttempted = uniqueCandidates.size;

        // CORRECTED: The `finalDecision` enum is ['progress', 'hold', 'reject', 'pending'].
        // A "selected" candidate is one whose status is 'progress'. The original 'hired' was incorrect.
        const candidatesSelected = await InterviewResult.countDocuments({
            interviewSession: { $in: completedSessionIds },
            finalDecision: 'progress' 
        });

        return {
            userId: manager._id,
            userName: manager.username,
            companyName: manager.companyName,
            teamMemberCount: manager.teamMembers?.length || 0,
            planPurchaseCount: planId ? (purchaseCountMap.get(planId.toString()) || 0) : 0,
            interviewPlansCreated: interviewPlanCount,
            interviewSessionsScheduled: interviewSessionCount,
            candidatesAttempted,
            candidatesSelected,
        };
    });

    return Promise.all(analyticsDataPromises);
};


/**
 * @route   GET /api/v1/admin/collab/analytics
 * @desc    Get aggregated analytics for all 'collab_hiring' users
 * @access  Private (Admin)
 */
router.get('/analytics', async (req, res) => {
    try {
        const data = await getHiringAnalyticsData();
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        console.error('Error fetching hiring analytics:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


/**
 * @route   GET /api/v1/admin/collab/analytics/export
 * @desc    Export aggregated analytics for 'collab_hiring' users to Excel
 * @access  Private (Admin)
 */
router.get('/analytics/export', async (req, res) => {
    try {
        const analyticsData = await getHiringAnalyticsData();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Hiring Analytics');

        worksheet.columns = [
            { header: 'User Name', key: 'userName', width: 25 },
            { header: 'Company Name', key: 'companyName', width: 30 },
            { header: 'Team Members', key: 'teamMemberCount', width: 15 },
            { header: 'Total Plan Purchases', key: 'planPurchaseCount', width: 20 },
            { header: 'Interview Plans Created', key: 'interviewPlansCreated', width: 25 },
            { header: 'Sessions Scheduled', key: 'interviewSessionsScheduled', width: 20 },
            { header: 'Candidates Attempted', key: 'candidatesAttempted', width: 22 },
            { header: 'Candidates Selected', key: 'candidatesSelected', width: 20 },
            { header: 'User ID', key: 'userId', width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.addRows(analyticsData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="hiring_analytics.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting analytics to Excel:', error);
        res.status(500).json({ success: false, message: 'Server Error while exporting data.' });
    }
});

export default router;