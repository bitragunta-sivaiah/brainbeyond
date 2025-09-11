import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; // Assuming your API setup is in this file
import { toast } from 'react-hot-toast';

// Initial state for the slice
const initialState = {
    chats: [], // List of all chats for the user
    activeChat: null, // The currently viewed chat, including messages
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- ASYNC THUNKS ---

/**
 * @description Fetch all chats for the logged-in user
 */
export const fetchMyChats = createAsyncThunk(
    'groupChats/fetchMyChats',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await API.get('/groupchats/my-groups');
            return data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Fetch a single group chat by its ID
 * @param {object} { chatId }
 */
export const fetchChatById = createAsyncThunk(
    'groupChats/fetchChatById',
    async ({ chatId }, { rejectWithValue }) => {
        try {
            const { data } = await API.get(`/groupchats/${chatId}`);
            return data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Create a new group chat
 * @param {object} { name, courseId }
 */
export const createGroupChat = createAsyncThunk(
    'groupChats/createGroupChat',
    async (chatData, { rejectWithValue }) => {
        try {
            const { data } = await API.post('/groupchats', chatData);
            toast.success(`Chat "${data.data.name}" created successfully!`);
            return data.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Add a new message to a chat
 * @param {object} { chatId, content, replyTo, attachments }
 */
export const addMessage = createAsyncThunk(
    'groupChats/addMessage',
    async ({ chatId, ...messageData }, { rejectWithValue }) => {
        try {
            const { data } = await API.post(`/groupchats/${chatId}/messages`, messageData);
            return data.data; // Expects { chatId, message }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(`Failed to send message: ${message}`);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Add or remove a reaction from a message
 * @param {object} { chatId, messageId, emoji }
 */
export const toggleReaction = createAsyncThunk(
    'groupChats/toggleReaction',
    async ({ chatId, messageId, emoji }, { rejectWithValue }) => {
        try {
            const { data } = await API.post(`/groupchats/${chatId}/messages/${messageId}/reactions`, { emoji });
            return { chatId, updatedMessage: data.data };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Soft delete one or more messages
 * @param {object} { chatId, messageIds }
 */
export const softDeleteMessages = createAsyncThunk(
    'groupChats/softDeleteMessages',
    async ({ chatId, messageIds }, { rejectWithValue }) => {
        try {
            const { data } = await API.delete(`/groupchats/${chatId}/messages`, { data: { messageIds } });
            toast.success(data.message || 'Message(s) deleted.');
            return { chatId, messageIds };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Permanently delete one or more messages
 * @param {object} { chatId, messageIds }
 */
export const permanentlyDeleteMessages = createAsyncThunk(
    'groupChats/permanentlyDeleteMessages',
    async ({ chatId, messageIds }, { rejectWithValue }) => {
        try {
            await API.delete(`/groupchats/${chatId}/messages/permanent`, { data: { messageIds } });
            toast.success('Message(s) permanently deleted.');
            return { chatId, messageIds };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Add new members to a chat
 * @param {object} { chatId, userIds }
 */
export const addMembers = createAsyncThunk(
    'groupChats/addMembers',
    async ({ chatId, userIds }, { rejectWithValue }) => {
        try {
            const { data } = await API.post(`/groupchats/${chatId}/members`, { userIds });
            toast.success('Members added successfully!');
            return { chatId, updatedChat: data.data };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Remove a member from a chat
 * @param {object} { chatId, userId }
 */
export const removeMember = createAsyncThunk(
    'groupChats/removeMember',
    async ({ chatId, userId }, { rejectWithValue }) => {
        try {
            const { data } = await API.delete(`/groupchats/${chatId}/members/${userId}`);
            toast.success('Member removed successfully.');
            return { chatId, updatedChat: data.data };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Leave a group chat
 * @param {string} chatId
 */
export const leaveChat = createAsyncThunk(
    'groupChats/leaveChat',
    async (chatId, { rejectWithValue }) => {
        try {
            await API.post(`/groupchats/${chatId}/leave`);
            toast.success('You have left the chat.');
            return chatId;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Delete a group chat entirely
 * @param {string} chatId
 */
export const deleteChat = createAsyncThunk(
    'groupChats/deleteChat',
    async (chatId, { rejectWithValue }) => {
        try {
            await API.delete(`/groupchats/${chatId}`);
            toast.success('Group chat deleted successfully.');
            return chatId;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

/**
 * @description Sync memberships for all chats (Admin only)
 */
export const syncMemberships = createAsyncThunk(
    'groupChats/syncMemberships',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await API.post('/groupchats/sync-memberships');
            toast.success(data.message || 'Memberships synchronized successfully!');
            dispatch(fetchMyChats());
            return;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// --- SLICE DEFINITION ---

const groupChatSlice = createSlice({
    name: 'groupChats',
    initialState,
    reducers: {
        setActiveChat: (state, action) => {
            state.activeChat = state.chats.find(chat => chat._id === action.payload);
        },
        clearActiveChat: (state) => {
            state.activeChat = null;
        },
        receiveMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (state.activeChat?._id === chatId) {
                // To prevent duplicates from socket + thunk fulfillment
                if (!state.activeChat.messages.find(m => m._id === message._id)) {
                    state.activeChat.messages.push(message);
                }
            }
            const chatIndex = state.chats.findIndex(c => c._id === chatId);
            if (chatIndex !== -1) {
                const updatedChat = state.chats[chatIndex];
                updatedChat.messages = [message]; // Update last message preview
                updatedChat.updatedAt = message.createdAt; // Update timestamp
                state.chats.splice(chatIndex, 1);
                state.chats.unshift(updatedChat);
            }
        },
        // CORRECTED: Added a dedicated reducer for real-time message updates (e.g., reactions) from sockets.
        updateMessage: (state, action) => {
            const { chatId, updatedMessage } = action.payload;
            if (state.activeChat?._id === chatId) {
                const msgIndex = state.activeChat.messages.findIndex(m => m._id === updatedMessage._id);
                if (msgIndex !== -1) {
                    state.activeChat.messages[msgIndex] = updatedMessage;
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Fetch My Chats ---
            .addCase(fetchMyChats.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMyChats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.chats = action.payload;
            })
            .addCase(fetchMyChats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // --- Fetch Chat By ID ---
            .addCase(fetchChatById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchChatById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.activeChat = action.payload;
            })
            .addCase(fetchChatById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // --- Create Chat ---
            .addCase(createGroupChat.fulfilled, (state, action) => {
                state.chats.unshift(action.payload);
            })

            // --- Add Message ---
            .addCase(addMessage.fulfilled, (state, action) => {
                const { chatId, message } = action.payload;
                if (state.activeChat?._id === chatId) {
                     if (!state.activeChat.messages.find(m => m._id === message._id)) {
                         state.activeChat.messages.push(message);
                    }
                }
                const chatIndex = state.chats.findIndex(c => c._id === chatId);
                if (chatIndex !== -1) {
                    const updatedChat = state.chats[chatIndex];
                    updatedChat.messages = [message];
                    updatedChat.updatedAt = message.createdAt;
                    state.chats.splice(chatIndex, 1);
                    state.chats.unshift(updatedChat);
                }
            })

            // --- Toggle Reaction ---
            .addCase(toggleReaction.fulfilled, (state, action) => {
                const { chatId, updatedMessage } = action.payload;
                if (state.activeChat?._id === chatId) {
                    const msgIndex = state.activeChat.messages.findIndex(m => m._id === updatedMessage._id);
                    if (msgIndex !== -1) {
                        state.activeChat.messages[msgIndex].reactions = updatedMessage.reactions;
                    }
                }
            })

            // --- Soft Delete Messages ---
            .addCase(softDeleteMessages.fulfilled, (state, action) => {
                const { chatId, messageIds } = action.payload;
                if (state.activeChat?._id === chatId) {
                    state.activeChat.messages.forEach(msg => {
                        if (messageIds.includes(msg._id)) {
                            msg.isDeleted = true;
                            msg.content = 'This message was deleted.';
                            msg.attachments = [];
                            msg.reactions = [];
                        }
                    });
                }
            })

            // --- Permanently Delete Messages ---
            .addCase(permanentlyDeleteMessages.fulfilled, (state, action) => {
                const { chatId, messageIds } = action.payload;
                if (state.activeChat?._id === chatId) {
                    state.activeChat.messages = state.activeChat.messages.filter(
                        (msg) => !messageIds.includes(msg._id)
                    );
                }
            })

            // --- Add/Remove Members ---
            .addCase(addMembers.fulfilled, (state, action) => {
                const { chatId, updatedChat } = action.payload;
                const chatIndex = state.chats.findIndex(c => c._id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].members = updatedChat.members;
                }
                if (state.activeChat?._id === chatId) {
                    state.activeChat.members = updatedChat.members;
                }
            })
            .addCase(removeMember.fulfilled, (state, action) => {
                const { chatId, updatedChat } = action.payload;
                const chatIndex = state.chats.findIndex(c => c._id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].members = updatedChat.members;
                }
                if (state.activeChat?._id === chatId) {
                    state.activeChat.members = updatedChat.members;
                }
            })

            // --- Leave/Delete Chat ---
            .addCase(leaveChat.fulfilled, (state, action) => {
                const chatId = action.payload;
                state.chats = state.chats.filter(c => c._id !== chatId);
                if (state.activeChat?._id === chatId) {
                    state.activeChat = null;
                }
            })
            .addCase(deleteChat.fulfilled, (state, action) => {
                const chatId = action.payload;
                state.chats = state.chats.filter(c => c._id !== chatId);
                if (state.activeChat?._id === chatId) {
                    state.activeChat = null;
                }
            });
    },
});

export const { setActiveChat, clearActiveChat, receiveMessage, updateMessage } = groupChatSlice.actions;

export default groupChatSlice.reducer;
