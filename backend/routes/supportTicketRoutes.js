import express from 'express';
import axios from 'axios';

import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import {
    protect,
    authorize
} from '../middleware/authMiddleware.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Helper Functions ---

const getAIResponse = async (prompt) => {
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        return "Our AI assistant is currently unavailable. A human agent will be with you shortly.";
    }
    try {
        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
        };
        const response = await axios.post(GEMINI_API_URL, payload);
        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text.trim() || prompt;
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        return "I am currently unable to process this request. A human agent has been notified and will assist you soon.";
    }
};

/**
 * @description Creates a notification for a user with a role-based navigation link.
 */
const createNotification = async (userId, title, message, ticketId) => {
    try {
        if (!userId) return;

        const userToNotify = await User.findById(userId).select('role');
        if (!userToNotify) {
            console.error(`Failed to create notification: User with ID ${userId} not found.`);
            return;
        }

        let linkPrefix = '/support';
        switch (userToNotify.role) {
            case 'student':
                linkPrefix = '/student/support';
                break;
            case 'admin':
                linkPrefix = '/admin/support';
                break;
            case 'customercare':
                linkPrefix = '/customercare/support';
                break;
        }

        const navigateLink = `${linkPrefix}/${ticketId}`;

        const notification = new Notification({
            user: userId,
            title,
            message,
            navigateLink: navigateLink
        });
        await notification.save();
    } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
    }
};

const populateTicket = (query) => {
    return query
        .populate('user', 'username fullName profileInfo.avatar')
        .populate('assignedTo', 'username fullName profileInfo.avatar')
        .populate('responses.user', 'username fullName profileInfo.avatar')
        .populate('history.actor', 'username fullName');
};

// --- STUDENT ROUTES ---
router.post(
    '/',
    protect,
    authorize('student'),
    async (req, res) => {
        const {
            subject,
            initialMessage,
            type,
            priority,
            attachments
        } = req.body;

        try {
            const newTicket = new SupportTicket({
                user: req.user._id,
                subject,
                initialMessage,
                type,
                priority,
                attachments: attachments || [],
                responses: [{
                    user: req.user._id,
                    message: initialMessage,
                    attachments: attachments || []
                }]
            });

            const agents = await User.find({
                role: 'customercare'
            }).select('_id');
            if (agents.length > 0) {
                const agentIds = agents.map(a => a._id);
                const ticketCounts = await SupportTicket.aggregate([{
                    $match: {
                        assignedTo: {
                            $in: agentIds
                        },
                        status: {
                            $in: ['open', 'in-progress', 'reopened', 'awaiting_user']
                        }
                    }
                }, {
                    $group: {
                        _id: '$assignedTo',
                        count: {
                            $sum: 1
                        }
                    }
                }, ]);
                const countsMap = new Map(ticketCounts.map(item => [item._id.toString(), item.count]));
                let leastBusyAgentId = agentIds[0];
                let minTickets = Infinity;
                for (const agentId of agentIds) {
                    const count = countsMap.get(agentId.toString()) || 0;
                    if (count < minTickets) {
                        minTickets = count;
                        leastBusyAgentId = agentId;
                    }
                }
                newTicket.assignedTo = leastBusyAgentId;
            }

            const prompt = `You are a friendly and helpful customer support AI. A student has created a new support ticket.\nProvide a welcoming and empathetic first response. Acknowledge their issue, assure them that their ticket has been received, and let them know that a human support agent will review their case as soon as possible.\n---\nTicket Subject: "${subject}"\nStudent's Message: "${initialMessage}"\n---\nYour Response:`;
            const aiMessageText = await getAIResponse(prompt);

            newTicket.responses.push({
                isAIMessage: true,
                message: aiMessageText
            });

            await newTicket.save();

            if (newTicket.assignedTo) {
                await createNotification(
                    newTicket.assignedTo,
                    `New Ticket Assigned: #${newTicket.ticketId}`,
                    `You have been assigned a new ticket titled "${subject}".`,
                    newTicket.ticketId
                );
            }

            const populatedTicket = await populateTicket(SupportTicket.findById(newTicket._id));
            res.status(201).json(populatedTicket);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server error while creating ticket.'
            });
        }
    }
);

router.post(
    '/:ticketId/responses',
    protect,
    authorize('student'),
    async (req, res) => {
        const {
            message,
            attachments
        } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({
                message: "Message is required."
            });
        }
        try {
            const ticket = await SupportTicket.findOne({
                ticketId: req.params.ticketId
            }).populate('responses.user');
            if (!ticket) return res.status(404).json({
                message: 'Ticket not found.'
            });

            // FIX: Add check for ticket.user to prevent TypeError
            if (ticket.user && ticket.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: 'You are not authorized to update this ticket.'
                });
            }

            const lastResponse = ticket.responses[ticket.responses.length - 1];
            const lastResponderIsAgent = lastResponse && lastResponse.user && ['customercare', 'admin'].includes(lastResponse.user.role);

            ticket.responses.push({
                user: req.user._id,
                message,
                attachments: attachments || []
            });

            ticket.status = ['resolved', 'closed'].includes(ticket.status) ? 'reopened' : 'in-progress';

            if (!lastResponderIsAgent) {
                const conversationHistory = ticket.responses.map(r =>
                    `${r.isAIMessage ? 'AI' : (r.user?.username || 'Student')}: ${r.message}`
                ).join('\n');
                const prompt = `You are a friendly customer support AI. A student has sent a follow-up message on their ticket, but a human agent has not yet responded. Provide a brief, reassuring message. Acknowledge their new message and confirm that an agent has been notified and will get back to them as soon as possible. Do not try to solve the problem yourself.\n---\nConversation History:\n${conversationHistory}\n---\nYour brief, reassuring response:`;
                const aiMessageText = await getAIResponse(prompt);
                ticket.responses.push({
                    isAIMessage: true,
                    message: aiMessageText
                });
            }

            if (ticket.assignedTo) {
                await createNotification(
                    ticket.assignedTo,
                    `Update on Ticket: #${ticket.ticketId}`,
                    `The student has replied to the ticket "${ticket.subject}".`,
                    ticket.ticketId
                );
            }

            await ticket.save();
            const populatedTicket = await populateTicket(SupportTicket.findById(ticket._id));
            res.status(200).json(populatedTicket);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server error while adding response.'
            });
        }
    }
);

// --- UNIVERSAL & AGENT ROUTES ---
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'student' ? {
            user: req.user._id
        } : {};
        const tickets = await SupportTicket.find(query)
            .populate('user', 'username fullName profileInfo.avatar')
            .populate('assignedTo', 'username fullName')
            .sort({
                updatedAt: -1
            });
        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error while fetching tickets.'
        });
    }
});

router.get('/:ticketId', protect, async (req, res) => {
    try {
        const ticketQuery = SupportTicket.findOne({
            ticketId: req.params.ticketId
        });
        const ticket = await populateTicket(ticketQuery);
        if (!ticket) return res.status(404).json({
            message: 'Ticket not found'
        });

        // FIX: Add check for ticket.user to prevent TypeError
        const isOwner = ticket.user && ticket.user._id.toString() === req.user._id.toString();
        const isAgent = ['customercare', 'admin'].includes(req.user.role);
        if (!isOwner && !isAgent) {
            return res.status(403).json({
                message: 'You are not authorized to view this ticket.'
            });
        }
        res.status(200).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error while fetching ticket.'
        });
    }
});

router.post(
    '/:ticketId/agent-response',
    protect,
    authorize('customercare', 'admin'),
    async (req, res) => {
        const {
            message,
            attachments
        } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({
                message: "Message is required."
            });
        }
        try {
            const ticket = await SupportTicket.findOne({
                ticketId: req.params.ticketId
            });
            if (!ticket) return res.status(404).json({
                message: 'Ticket not found'
            });

            const professionalizationPrompt = `
                You are a professional communication assistant for a customer support team.
                Your task is to review a support agent's draft response to a student.
                Rewrite the following message to be more professional, empathetic, and clear.
                Correct any spelling or grammar mistakes. Do not change the core meaning of the message.
                Keep the tone helpful and supportive.
                The output should ONLY be the revised message text, without any introductory phrases like "Here's the revised message:".

                Agent's Draft: "${message}"

                Revised Message:
            `;

            const professionalMessage = await getAIResponse(professionalizationPrompt);

            ticket.responses.push({
                user: req.user._id,
                message: professionalMessage,
                attachments: attachments || []
            });
            ticket.status = 'awaiting_user';
            await ticket.save();

            // The 'ticket.user' field is required on the model, so it shouldn't be null here
            // but for safety, we'll keep the check.
            if (ticket.user) {
                await createNotification(
                    ticket.user,
                    `Update on Your Ticket: #${ticket.ticketId}`,
                    `A support agent has replied to your ticket "${ticket.subject}".`,
                    ticket.ticketId
                );
            }

            const populatedTicket = await populateTicket(SupportTicket.findById(ticket._id));
            res.status(200).json(populatedTicket);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server error while adding agent response.'
            });
        }
    }
);

router.put(
    '/:ticketId/details',
    protect,
    authorize('customercare', 'admin'),
    async (req, res) => {
        const {
            status,
            priority,
            assignedTo
        } = req.body;
        try {
            const ticket = await SupportTicket.findOne({
                ticketId: req.params.ticketId
            });
            if (!ticket) return res.status(404).json({
                message: 'Ticket not found'
            });

            const changes = [];
            const originalTicket = ticket.toObject();

            if (status && ticket.status !== status) {
                changes.push({
                    field: 'status',
                    from: originalTicket.status,
                    to: status,
                    eventType: 'status_change'
                });
                ticket.status = status;
            }
            if (priority && ticket.priority !== priority) {
                changes.push({
                    field: 'priority',
                    from: originalTicket.priority,
                    to: priority,
                    eventType: 'priority_change'
                });
                ticket.priority = priority;
            }
            if (assignedTo && ticket.assignedTo ?.toString() !== assignedTo) {
                changes.push({
                    field: 'assignment',
                    from: originalTicket.assignedTo,
                    to: assignedTo,
                    eventType: 'assignment'
                });
                ticket.assignedTo = assignedTo;
                await createNotification(
                    assignedTo,
                    `Ticket Assigned to You: #${ticket.ticketId}`,
                    `You are now assigned to the ticket "${ticket.subject}".`,
                    ticket.ticketId
                );
            }

            if (changes.length > 0) {
                changes.forEach(change => {
                    ticket.history.push({
                        actor: req.user._id,
                        eventType: change.eventType,
                        change: {
                            field: change.field,
                            from: change.from,
                            to: change.to
                        }
                    });
                });
            }

            await ticket.save();
            const populatedTicket = await populateTicket(SupportTicket.findById(ticket._id));
            res.status(200).json(populatedTicket);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server error while updating ticket details.'
            });
        }
    }
);

export default router;