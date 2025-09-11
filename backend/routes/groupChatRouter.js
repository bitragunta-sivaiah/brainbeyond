import express from 'express';
import { Types } from 'mongoose';
import GroupChat from '../models/GroupChat.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const userPopulation = {
    path: 'members.user',
    select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar username'
};

// --- HELPER FUNCTION ---
/**
 * Calculates the complete list of eligible members for a given course.
 * This includes the course creator, instructors, direct purchasers, and active subscribers.
 * @param {string} courseId - The ID of the course.
 * @param {string} creatorId - The ID of the user creating the chat.
 * @returns {Set<string>} - A Set of unique user IDs.
 */
const getEligibleMembers = async (courseId, creatorId) => {
    const memberIds = new Set();

    // 1. Add the chat creator
    if (creatorId) {
        memberIds.add(creatorId.toString());
    }

    const course = await Course.findById(courseId).populate('instructors', '_id');
    if (!course) {
        throw new Error('Course not found');
    }

    // 2. Add all instructors for the course
    course.instructors.forEach(instructor => memberIds.add(instructor._id.toString()));

    // 3. Find users who purchased the course directly
    const purchasedUsers = await User.find({
        $or: [
            { 'enrolledCourses.course': courseId },
            { 'enrollCoursePurchase.course': courseId },
        ],
    }, '_id');
    purchasedUsers.forEach(user => memberIds.add(user._id.toString()));

    // 4. Find users who have access via an active subscription
    // Step 4a: Find all subscription plans that include this course
    const relevantSubscriptionPlans = await Subscription.find({
        status: 'active',
        $or: [
            { 'courses.isAllIncluded': true },
            { 'courses.includedCourses': courseId }
        ]
    }).select('_id');

    const relevantPlanIds = relevantSubscriptionPlans.map(p => p._id);

    // Step 4b: Find users with active subscriptions to those plans
    if (relevantPlanIds.length > 0) {
        const subscribedUsers = await User.find({
            'purchasedSubscriptions': {
                $elemMatch: {
                    subscription: { $in: relevantPlanIds },
                    isActive: true,
                    // Subscription is valid if endDate is in the future OR is null (for lifetime)
                    $or: [
                        { endDate: { $gte: new Date() } },
                        { endDate: null }
                    ]
                }
            }
        }).select('_id');
        subscribedUsers.forEach(user => memberIds.add(user._id.toString()));
    }

    return { memberIds, course };
};


/**
 * @desc      Create a new group chat
 * @route     POST /api/v1/groupchats
 * @access    Private (Instructor/Admin)
 */
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
    try {
        const { name, courseId } = req.body;

        const { memberIds, course } = await getEligibleMembers(courseId, req.user._id);

        const members = Array.from(memberIds).map(id => {
            const isCreator = req.user._id.toString() === id;
            const isInstructor = course.instructors.some(inst => inst._id.toString() === id);

            let role = 'member'; // FIX: Changed 'student' to 'member' to match the schema enum.
            if (isCreator) {
                role = 'admin'; // The creator is always an admin
            } else if (isInstructor) {
                role = 'instructor'; // Other instructors get the instructor role
            }
            return { user: id, role, joinedAt: new Date() };
        });

        const newChat = new GroupChat({ name, course: courseId, members });
        let savedChat = await newChat.save();

        // Create notifications for all new members except the creator
        const notificationPromises = savedChat.members
            .filter(member => member.user.toString() !== req.user._id.toString())
            .map(member => {
                // Determine the navigation link based on the member's role
                // NOTE: The role 'student' does not exist in the GroupChat member schema, using 'member' for the link logic.
                let navigateLink = '/student/groups'; // Default for members (students)
                if (member.role === 'admin') {
                    navigateLink = '/admin/groups';
                } else if (member.role === 'instructor') {
                    navigateLink = '/instructor/groups';
                }

                return new Notification({
                    user: member.user,
                    title: `New Group Chat: ${savedChat.name}`,
                    message: `You've been added to the chat for "${course.title}".`,
                    navigateLink: navigateLink, // Use the dynamically determined link
                    type: 'course',
                    relatedItem: { itemType: 'GroupChat', itemId: savedChat._id },
                }).save();
            });


        await Promise.all(notificationPromises);

        // Populate the new chat for the response
        savedChat = await savedChat.populate([
            { path: 'course', select: 'title' },
            { path: 'members.user', select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar username' }
        ]);

        res.status(201).json({ success: true, data: savedChat });
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Syncronize members of all group chats. Removes users whose subscriptions expired.
 * @route     POST /api/v1/groupchats/sync-memberships
 * @access    Private (Admin) - Intended to be called by a cron job
 */
router.post('/sync-memberships', protect, authorize('admin'), async (req, res) => {
    try {
        const chats = await GroupChat.find().populate('course', '_id');
        let totalChatsScanned = 0;
        let totalMembershipsUpdated = 0;

        for (const chat of chats) {
            if (!chat.course) continue; // Skip if course was deleted

            const { memberIds: eligibleMemberIds } = await getEligibleMembers(chat.course._id, null);
            const eligibleMemberIdStrings = new Set(Array.from(eligibleMemberIds).map(id => id.toString()));

            const currentMemberIds = new Set(chat.members.map(m => m.user.toString()));

            // Check if there's a difference
            if (eligibleMemberIdStrings.size === currentMemberIds.size && [...eligibleMemberIdStrings].every(id => currentMemberIds.has(id))) {
                totalChatsScanned++;
                continue; // No changes needed
            }

            // Filter out members who are no longer eligible
            chat.members = chat.members.filter(member => eligibleMemberIdStrings.has(member.user.toString()));

            await chat.save();
            totalMembershipsUpdated++;
            totalChatsScanned++;
        }

        // When a subscription ends, the user is removed. If the chat becomes empty, delete it.
        await GroupChat.deleteMany({ members: { $size: 0 } });

        res.status(200).json({
            success: true,
            message: `Membership synchronization complete. Scanned ${totalChatsScanned} chats, updated ${totalMembershipsUpdated}.`,
        });

    } catch (error) {
        console.error('Error syncing group chat memberships:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Get all group chats for the authenticated user
 * @route     GET /api/v1/groupchats/my-groups
 * @access    Private
 */
router.get('/my-groups', protect, async (req, res) => {
    try {
        const chats = await GroupChat.find({ 'members.user': req.user._id })
            .populate('course', 'title')
            .populate(userPopulation)
            .populate({
                path: 'messages',
                perDocumentLimit: 1,
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'sender',
                    select: 'profileInfo.firstName profileInfo.avatar username'
                }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: chats.length, data: chats });
    } catch (error) {
        console.error('Error fetching user group chats:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Get a specific group chat by ID with ALL messages
 * @route     GET /api/v1/groupchats/:id
 * @access    Private (Members only)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const chat = await GroupChat.findOne({
                _id: req.params.id,
                'members.user': req.user._id
            })
            .populate({ path: 'course', select: 'title' })
            .populate({
                path: 'members.user',
                select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar username'
            })
            .populate({
                path: 'messages.sender',
                select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar username'
            })
            .populate({
                path: 'messages.reactions.user',
                select: 'profileInfo.firstName profileInfo.avatar username'
            })
            .lean();

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group chat not found or you are not a member.' });
        }

        res.status(200).json({ success: true, data: chat });
    } catch (error) {
        console.error('Error fetching single group chat:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid chat ID format.' });
        }
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Add a message to a group chat
 * @route     POST /api/v1/groupchats/:id/messages
 * @access    Private (Members only)
 */
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { content, replyTo, attachments } = req.body;

        const newMessage = {
            _id: new Types.ObjectId(),
            sender: req.user._id,
            content,
            replyTo: replyTo || null,
            attachments: attachments || [],
            readBy: [req.user._id],
            createdAt: new Date(),
        };

        const updatedChat = await GroupChat.findOneAndUpdate({ _id: req.params.id, 'members.user': req.user._id }, { $push: { messages: newMessage }, $set: { updatedAt: new Date() } }, { new: true, runValidators: true });

        if (!updatedChat) {
            return res.status(404).json({ success: false, message: 'Group chat not found or you are not a member.' });
        }

        const populatedMessage = {
            ...newMessage,
            sender: {
                _id: req.user._id,
                username: req.user.username,
                profileInfo: req.user.profileInfo
            },
            reactions: [],
            isDeleted: false,
        };

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { chatId: updatedChat._id, message: populatedMessage },
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @desc      Add/Remove a reaction to a message
 * @route     POST /api/v1/groupchats/:chatId/messages/:messageId/reactions
 * @access    Private (Members only)
 */
router.post('/:chatId/messages/:messageId/reactions', protect, async (req, res) => {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
        return res.status(400).json({ success: false, message: 'Emoji is required.' });
    }

    try {
        const chat = await GroupChat.findOne({ _id: chatId, 'members.user': userId });

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found or you are not a member.' });
        }

        const message = chat.messages.id(messageId);
        if (!message || message.isDeleted) {
            return res.status(404).json({ success: false, message: 'Message not found or has been deleted.' });
        }

        const reactionIndex = message.reactions.findIndex(
            r => r.user.equals(userId) && r.emoji === emoji
        );

        if (reactionIndex > -1) {
            message.reactions.splice(reactionIndex, 1);
        } else {
            message.reactions.push({ emoji, user: userId });
        }

        await chat.save();

        await chat.populate({
            path: 'messages.reactions.user',
            select: 'profileInfo.firstName profileInfo.avatar username'
        });
        const updatedMessage = chat.messages.id(messageId);

        res.status(200).json({
            success: true,
            data: updatedMessage,
        });
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @desc      Soft delete multiple messages
 * @route     DELETE /api/v1/groupchats/:chatId/messages
 * @access    Private (Sender or Admin/Instructor)
 */
router.delete('/:chatId/messages', protect, async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ success: false, message: 'An array of messageIds is required.' });
        }

        const chat = await GroupChat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found.' });
        }

        const currentUserRole = chat.members.find(member => member.user.equals(req.user._id)) ?.role;

        let updatedCount = 0;
        messageIds.forEach(msgId => {
            const message = chat.messages.id(msgId);
            if (message) {
                const isSender = message.sender.equals(req.user._id);
                const isAdmin = ['admin', 'instructor'].includes(currentUserRole);

                if (isSender || isAdmin) {
                    message.content = 'This message was deleted.';
                    message.attachments = [];
                    message.reactions = [];
                    message.isDeleted = true;
                    message.updatedAt = new Date();
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            await chat.save();
        }

        res.status(200).json({ success: true, message: `${updatedCount} messages deleted successfully.` });
    } catch (error) {
        console.error('Error soft-deleting messages:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Permanently delete multiple messages
 * @route     DELETE /api/v1/groupchats/:chatId/messages/permanent
 * @access    Private (Admin/Instructor)
 */
router.delete('/:chatId/messages/permanent', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ success: false, message: 'An array of messageIds is required.' });
        }

        await GroupChat.findByIdAndUpdate(req.params.chatId, {
            $pull: { messages: { _id: { $in: messageIds } } }
        });

        res.status(200).json({ success: true, message: 'Messages permanently deleted.' });
    } catch (error) {
        console.error('Error permanently deleting messages:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @desc      Add members to a group chat
 * @route     POST /api/v1/groupchats/:id/members
 * @access    Private (Admin/Instructor)
 */
router.post('/:id/members', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Array of userIds is required.' });
        }

        const chat = await GroupChat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group chat not found.' });
        }

        const existingMemberIds = new Set(chat.members.map(m => m.user.toString()));
        const newMembers = userIds
            .filter(id => !existingMemberIds.has(id))
            .map(id => ({ user: id, role: 'member', joinedAt: new Date() }));

        if (newMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'All specified users are already members.' });
        }

        chat.members.push(...newMembers);
        await chat.save();

        await chat.populate(userPopulation);

        res.status(200).json({
            success: true,
            message: 'Members added successfully.',
            data: chat
        });
    } catch (error) {
        console.error('Error adding members:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @desc      Remove a member from a group chat
 * @route     DELETE /api/v1/groupchats/:id/members/:userId
 * @access    Private (Admin/Instructor)
 */
router.delete('/:id/members/:userId', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { id, userId } = req.params;

        const updatedChat = await GroupChat.findByIdAndUpdate(
            id, { $pull: { members: { user: userId } } }, { new: true }
        ).populate(userPopulation);

        if (!updatedChat) {
            return res.status(404).json({ success: false, message: 'Group chat not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Member removed successfully.',
            data: updatedChat
        });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


/**
 * @desc      Leave a group chat
 * @route     POST /api/v1/groupchats/:id/leave
 * @access    Private
 */
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const chat = await GroupChat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group chat not found.' });
        }

        const memberIndex = chat.members.findIndex(m => m.user.equals(req.user._id));
        if (memberIndex === -1) {
            return res.status(400).json({ success: false, message: 'You are not a member of this group chat.' });
        }

        const leavingMember = chat.members[memberIndex];
        chat.members.splice(memberIndex, 1);

        const wasLastAdmin = leavingMember.role === 'admin' && !chat.members.some(m => m.role === 'admin');
        if (wasLastAdmin && chat.members.length > 0) {
            let nextAdmin = chat.members
                .filter(m => m.role === 'instructor')
                .sort((a, b) => a.joinedAt - b.joinedAt)[0];

            if (!nextAdmin) {
                nextAdmin = chat.members.sort((a, b) => a.joinedAt - b.joinedAt)[0];
            }

            if (nextAdmin) {
                nextAdmin.role = 'admin';
            }
        }

        if (chat.members.length === 0) {
            await GroupChat.findByIdAndDelete(req.params.id);
            return res.status(200).json({ success: true, message: 'Successfully left, and the empty chat was deleted.' });
        }

        await chat.save();
        res.status(200).json({ success: true, message: 'Successfully left the group chat.' });

    } catch (error) {
        console.error('Error leaving group chat:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @desc      Delete a group chat completely
 * @route     DELETE /api/v1/groupchats/:id
 * @access    Private (Admin/Instructor)
 */
router.delete('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const chat = await GroupChat.findByIdAndDelete(req.params.id);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group chat not found' });
        }
        // Also remove any notifications related to this chat
        await Notification.deleteMany({ 'relatedItem.itemId': req.params.id });

        res.status(200).json({ success: true, message: 'Group chat and related notifications deleted successfully' });
    } catch (error) {
        console.error('Error deleting group chat:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});


export default router;

