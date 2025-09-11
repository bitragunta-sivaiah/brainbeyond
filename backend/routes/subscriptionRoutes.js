import express from 'express';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv'
dotenv.config()
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const { Schema } = mongoose;

// Initialize Razorpay with your key and secret
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper function to send notifications
const sendNotification = async (userId, title, message, type, itemId, itemType, navigateLink) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedItem: { itemId, itemType },
            navigateLink,
        });
        console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
};

// ================================================================
//   ADMIN CRUD Actions for Subscription Plans
// ================================================================

// @desc    Create a new subscription plan (Admin only)
// @route   POST /api/subscriptions
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, description, tagline, pricing, planType, features, courses, isPopular } = req.body;
        
        const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
        
        const finalPrice = pricing.discountedPrice !== undefined ? pricing.discountedPrice : pricing.basePrice;

        const newSubscription = new Subscription({
            name,
            slug,
            description,
            tagline,
            pricing: { ...pricing, finalPrice },
            planType,
            features,
            courses,
            isPopular,
        });

        const savedSubscription = await newSubscription.save();
        res.status(201).json({ message: 'Subscription plan created successfully.', data: savedSubscription });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A plan with this name or slug already exists.' });
        }
        res.status(500).json({ message: `Failed to create subscription plan: ${error.message}` });
    }
});

// @desc    Get all subscription plans
// @route   GET /api/subscriptions
// @access  Public
router.get('/', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ status: 'active' }).populate('courses.includedCourses', 'title slug');
        res.status(200).json({ message: 'Subscriptions fetched successfully.', data: subscriptions });
    } catch (error) {
        res.status(500).json({ message: `Failed to retrieve subscriptions: ${error.message}` });
    }
});

// ================================================================
//   STUDENT SUBSCRIPTION Management
// ================================================================

// @desc    Get the current user's subscription details
// @route   GET /api/subscriptions/my-subscription
// @access  Private
router.get('/my-subscription', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('purchasedSubscriptions').populate({
            path: 'purchasedSubscriptions.subscription',
            model: 'Subscription'
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const activeSubscription = user.purchasedSubscriptions.find(sub => sub.isActive);
        
        res.status(200).json({
            success: true,
            data: {
                activeSubscription,
                allSubscriptions: user.purchasedSubscriptions
            }
        });
    } catch (error) {
        res.status(500).json({ message: `Failed to retrieve subscription details: ${error.message}` });
    }
});

// @desc    Get a single subscription plan by ID
// @route   GET /api/subscriptions/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id).populate('courses.includedCourses', 'title slug');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }
        res.status(200).json({ message: 'Subscription fetched successfully.', data: subscription });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Failed to retrieve subscription: ${error.message}` });
    }
});

// @desc    Update a subscription plan (Admin only)
// @route   PATCH /api/subscriptions/:id
// @access  Private/Admin
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const updatedSubscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedSubscription) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }
        res.status(200).json({ message: 'Subscription plan updated successfully.', data: updatedSubscription });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Failed to update subscription plan: ${error.message}` });
    }
});

// @desc    Delete a subscription plan (Admin only)
// @route   DELETE /api/subscriptions/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const deletedSubscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!deletedSubscription) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }
        res.status(200).json({ message: 'Subscription plan deleted successfully.' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Failed to delete subscription plan: ${error.message}` });
    }
});

// @desc    Initiate a new subscription purchase
// @route   POST /api/subscriptions/buy/:subscriptionId
// @access  Private/Student
router.post('/buy/:subscriptionId', protect, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const subscriptionPlan = await Subscription.findById(subscriptionId);
        
        if (!subscriptionPlan) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }
        
        const user = await User.findById(req.user._id).select('purchasedSubscriptions');
        const activeSubscription = user.purchasedSubscriptions.find(sub => sub.isActive && sub.endDate > new Date());
        
        if (activeSubscription) {
            return res.status(400).json({ message: 'You already have an active subscription. Consider renewing or upgrading.' });
        }

        if (!razorpayInstance) {
            return res.status(500).json({ message: 'Razorpay service is not available. Please try again later.' });
        }

        const price = subscriptionPlan.pricing.finalPrice || subscriptionPlan.pricing.basePrice;

        if (price === undefined || price === null || isNaN(price) || price <= 0) {
            return res.status(400).json({ message: 'Invalid subscription price for payment initiation.' });
        }
        
        const amount = Math.round(price * 100);

        let receipt = `order_sub_${req.user._id.toString().slice(-10)}_${Date.now()}`;
        
        if (receipt.length > 40) {
            const shortId = crypto.randomBytes(8).toString('hex');
            receipt = `order_sub_${shortId}`;
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount,
            currency: subscriptionPlan.pricing.currency,
            receipt,
            notes: {
                userId: req.user._id.toString(),
                subscriptionId: subscriptionPlan._id.toString(),
                action: 'buy',
            },
        });

        const order = new Order({
            user: req.user._id,
            items: [{
                itemType: 'Subscription',
                itemId: subscriptionPlan._id,
                name: subscriptionPlan.name,
                price: price, // Replaced with plain number
                quantity: 1,
            }],
            pricing: {
                subtotal: price, // Replaced with plain number
                total: price, // Replaced with plain number
            },
            payment: {
                method: 'Razorpay',
                status: 'pending',
                transactionId: razorpayOrder.id,
            },
            orderStatus: 'pending',
        });
        await order.save();

        // Send notification to the user about the new order
        const navigateLink = `/subscriptions/my-subscription`;
        await sendNotification(
            req.user._id,
            'Subscription Order Created!',
            `Your order for the "${subscriptionPlan.name}" subscription has been created. Please complete the payment.`,
            'payment',
            order._id,
            'Order',
            navigateLink
        );

        res.status(200).json({
            message: 'Payment order created.',
            razorpayOrder,
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Payment initiation failed: ${error.message}` });
    }
});

// @desc    Renew an existing subscription
// @route   POST /api/subscriptions/renew/:currentSubscriptionId
// @access  Private/Student
router.post('/renew/:currentSubscriptionId', protect, async (req, res) => {
    try {
        const { currentSubscriptionId } = req.params;
        const user = await User.findById(req.user._id).select('purchasedSubscriptions');

        const activeSubscription = user.purchasedSubscriptions.find(sub => 
            sub._id.toString() === currentSubscriptionId && sub.isActive
        );
        
        if (!activeSubscription) {
            return res.status(404).json({ message: 'No active subscription found to renew.' });
        }

        const subscriptionPlan = await Subscription.findById(activeSubscription.subscription);
        if (!subscriptionPlan) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }
        
        const newEndDate = new Date(activeSubscription.endDate);
        const billingCycle = subscriptionPlan.pricing.billingCycle;
        
        if (billingCycle === 'monthly') newEndDate.setMonth(newEndDate.getMonth() + 1);
        else if (billingCycle === 'yearly') newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        else if (billingCycle === 'quarterly') newEndDate.setMonth(newEndDate.getMonth() + 3);
        
        const price = subscriptionPlan.pricing.finalPrice || subscriptionPlan.pricing.basePrice;
        if (price === undefined || price === null || isNaN(price)) {
            return res.status(400).json({ message: 'Invalid subscription price for renewal initiation.' });
        }
        
        const amount = Math.round(price * 100);

        let receipt = `order_ren_${req.user._id.toString().slice(-10)}_${Date.now()}`;
        
        if (receipt.length > 40) {
            const shortId = crypto.randomBytes(8).toString('hex');
            receipt = `order_ren_${shortId}`;
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount,
            currency: subscriptionPlan.pricing.currency,
            receipt,
            notes: {
                userId: req.user._id.toString(),
                subscriptionId: subscriptionPlan._id.toString(),
                action: 'renew',
                currentSubscriptionRecordId: currentSubscriptionId,
                newEndDate: newEndDate.toISOString(),
            },
        });
        
        const order = new Order({
            user: req.user._id,
            items: [{
                itemType: 'Subscription',
                itemId: subscriptionPlan._id,
                name: `${subscriptionPlan.name} (Renewal)`,
                price: price,
                quantity: 1,
            }],
            pricing: { subtotal: price, total: price },
            payment: { method: 'Razorpay', status: 'pending', transactionId: razorpayOrder.id },
            orderStatus: 'pending',
        });
        await order.save();

        // Send notification to the user about the renewal order
        const navigateLink = `/subscriptions/my-subscription`;
        await sendNotification(
            req.user._id,
            'Subscription Renewal Initiated!',
            `Your order to renew the "${subscriptionPlan.name}" subscription has been created.`,
            'payment',
            order._id,
            'Order',
            navigateLink
        );

        res.status(200).json({
            message: 'Renewal payment order created.',
            razorpayOrder,
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Subscription renewal failed: ${error.message}` });
    }
});

// @desc    Upgrade an existing subscription
// @route   POST /api/subscriptions/upgrade/:newSubscriptionId
// @access  Private/Student
router.post('/upgrade/:newSubscriptionId', protect, async (req, res) => {
    try {
        const { newSubscriptionId } = req.params;
        const user = await User.findById(req.user._id).select('purchasedSubscriptions');

        const currentActiveSubscription = user.purchasedSubscriptions.find(sub => sub.isActive && sub.endDate > new Date());
        
        if (!currentActiveSubscription) {
            return res.status(400).json({ message: 'You must have an active subscription to upgrade.' });
        }

        const newSubscriptionPlan = await Subscription.findById(newSubscriptionId);
        if (!newSubscriptionPlan) {
            return res.status(404).json({ message: 'New subscription plan not found.' });
        }
        
        const currentSubscriptionPlan = await Subscription.findById(currentActiveSubscription.subscription);
        if (!currentSubscriptionPlan) {
            return res.status(404).json({ message: 'Current subscription plan not found.' });
        }
        
        const newPrice = newSubscriptionPlan.pricing.finalPrice || newSubscriptionPlan.pricing.basePrice;
        const currentPrice = currentSubscriptionPlan.pricing.finalPrice || currentSubscriptionPlan.pricing.basePrice;

        if (newPrice <= currentPrice) {
            return res.status(400).json({ message: 'Cannot upgrade to a cheaper or same-priced plan.' });
        }
        
        if (newPrice === undefined || newPrice === null || isNaN(newPrice)) {
            return res.status(400).json({ message: 'Invalid new subscription price for upgrade initiation.' });
        }
        
        const amount = Math.round(newPrice * 100);

        let receipt = `order_upg_${req.user._id.toString().slice(-10)}_${Date.now()}`;
        
        if (receipt.length > 40) {
            const shortId = crypto.randomBytes(8).toString('hex');
            receipt = `order_upg_${shortId}`;
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount,
            currency: newSubscriptionPlan.pricing.currency,
            receipt,
            notes: {
                userId: req.user._id.toString(),
                subscriptionId: newSubscriptionPlan._id.toString(),
                action: 'upgrade',
                currentSubscriptionRecordId: currentActiveSubscription._id.toString(),
            },
        });
        
        const order = new Order({
            user: req.user._id,
            items: [{
                itemType: 'Subscription',
                itemId: newSubscriptionPlan._id,
                name: `${newSubscriptionPlan.name} (Upgrade)`,
                price: newPrice,
                quantity: 1,
            }],
            pricing: { subtotal: newPrice, total: newPrice },
            payment: { method: 'Razorpay', status: 'pending', transactionId: razorpayOrder.id },
            orderStatus: 'pending',
        });
        await order.save();

        // Send notification to the user about the upgrade order
        const navigateLink = `/subscriptions/my-subscription`;
        await sendNotification(
            req.user._id,
            'Subscription Upgrade Initiated!',
            `Your order to upgrade to the "${newSubscriptionPlan.name}" subscription has been created.`,
            'payment',
            order._id,
            'Order',
            navigateLink
        );

        res.status(200).json({
            message: 'Upgrade payment order created.',
            razorpayOrder,
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid subscription ID format.' });
        }
        res.status(500).json({ message: `Subscription upgrade failed: ${error.message}` });
    }
});

// @desc    Verify payment and update subscription status (client-side callback)
// @route   POST /api/subscriptions/verify-payment
// @access  Private/Student
router.post('/verify-payment', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId, action, currentSubscriptionRecordId, newEndDate } = req.body;
        
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ message: 'Server configuration error: Razorpay secret key is missing.' });
        }

        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature.' });
        }

        const order = await Order.findOne({ 'payment.transactionId': razorpay_order_id, user: req.user._id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (!action) {
            return res.status(400).json({ message: 'Missing subscription action from order data.' });
        }

        const user = await User.findById(req.user._id);
        const subscriptionPlan = await Subscription.findById(subscriptionId);
        if (!user || !subscriptionPlan) {
            return res.status(404).json({ message: 'User or Subscription Plan not found.' });
        }
        
        // 1. Update the Order status
        order.payment.status = 'completed';
        order.orderStatus = 'completed';
        order.payment.transactionId = razorpay_payment_id;
        await order.save();

        // 2. Handle subscription logic based on action
        if (action === 'buy') {
            // Deactivate any existing active subscriptions for the user
            user.purchasedSubscriptions.forEach(sub => {
                if (sub.isActive) {
                    sub.isActive = false;
                }
            });

            let endDate = new Date();
            const billingCycle = subscriptionPlan.pricing.billingCycle;
            if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else if (billingCycle === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
            else if (billingCycle === 'lifetime') endDate = null;

            user.purchasedSubscriptions.push({
                subscription: subscriptionPlan._id,
                startDate: new Date(),
                endDate: endDate,
                isActive: true,
                autoRenew: false,
            });

        } else if (action === 'renew') {
            const subscriptionToRenew = user.purchasedSubscriptions.id(currentSubscriptionRecordId);
            if (!subscriptionToRenew) {
                return res.status(404).json({ message: 'Subscription record to renew not found.' });
            }
            subscriptionToRenew.endDate = new Date(newEndDate); 
            subscriptionToRenew.isActive = true;

        } else if (action === 'upgrade') {
            const oldSubscriptionRecord = user.purchasedSubscriptions.id(currentSubscriptionRecordId);
            if (!oldSubscriptionRecord) {
                return res.status(404).json({ message: 'Subscription record to upgrade from not found.' });
            }
            oldSubscriptionRecord.isActive = false;

            let endDate = new Date();
            const billingCycle = subscriptionPlan.pricing.billingCycle;
            if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else if (billingCycle === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
            else if (billingCycle === 'lifetime') endDate = null;

            user.purchasedSubscriptions.push({
                subscription: subscriptionPlan._id,
                startDate: new Date(),
                endDate: endDate,
                isActive: true,
                autoRenew: false,
            });
            
        } else {
            return res.status(400).json({ message: 'Unknown subscription action.' });
        }

        // 3. Save user and send notification
        await user.save();
        
        const navigateLink = `/subscriptions/my-subscription`;
        await sendNotification(
            req.user._id,
            'Subscription Updated! 🎉',
            `Your subscription to ${subscriptionPlan.name} is now active. Enjoy your access!`,
            'payment',
            subscriptionPlan._id,
            'Subscription',
            navigateLink
        );

        res.status(200).json({ message: 'Payment successful, subscription status updated.' });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format in payment data.' });
        }
        res.status(500).json({ message: `Payment verification failed: ${error.message}` });
    }
});


export default router;