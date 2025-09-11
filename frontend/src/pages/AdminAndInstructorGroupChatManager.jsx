import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    MessageSquare, Search, Plus, Send, Paperclip, Smile, X, Users, Settings, Trash2,
    AlertTriangle, Palette, Upload, Hash, LogOutIcon, Copy, XCircle, MoreHorizontal, RefreshCw,
    FileText,LogOut 
} from 'lucide-react';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { io } from 'socket.io-client';

// --- Redux Imports ---
import {
    fetchMyChats, fetchChatById, createGroupChat, addMessage, softDeleteMessages, permanentlyDeleteMessages,
    addMembers, removeMember, leaveChat, deleteChat, setActiveChat, clearActiveChat, receiveMessage, updateMessage,
    syncMemberships, toggleReaction
} from '../store/redux/groupChatSlice';
import { fetchAllCourses } from '../store/redux/courseSlice';
import { uploadSingleFile } from '../store/redux/uploadSlice';
import { fetchAllUsers } from '../store/redux/authSlice';

// --- Constants & Configuration ---
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const classicBackgrounds = [
    { name: 'Sky', style: { backgroundImage: `url(https://i.pinimg.com/1200x/ae/2b/98/ae2b98eec5aedbfa5965f3d3d39b1c24.jpg)` } },
    { name: 'Ocean', style: { backgroundImage: `url(https://i.pinimg.com/736x/0e/ce/25/0ece253d859467306a766a2cbf9fabb4.jpg)` } },
    { name: 'Abstract', style: { backgroundImage: `url(https://i.pinimg.com/1200x/fa/42/e2/fa42e25d56ea94119c33138f9395c36c.jpg)` } },
    { name: 'Nature', style: { backgroundImage: `url(https://i.pinimg.com/736x/7f/8e/9d/7f8e9d6cebf38cc51fd6ae68b4bce26b.jpg)` } },
    { name: 'Minimal', style: { backgroundImage: `url(https://i.pinimg.com/736x/7d/fd/b3/7dfdb3d0d4f1a1bdfc0233f90e04a39b.jpg)` } },
];

const patternBackgrounds = [
    { name: 'Dots', style: { backgroundColor: 'var(--card)', backgroundImage: `radial-gradient(var(--border) 1px, transparent 0)`, backgroundSize: `15px 15px` } },
    { name: 'Lines', style: { backgroundColor: 'var(--muted)', backgroundImage: `linear-gradient(45deg, var(--border) 25%, transparent 25%, transparent 50%, var(--border) 50%, var(--border) 75%, transparent 75%, transparent)`, backgroundSize: `20px 20px` } },
    { name: 'Grid', style: { backgroundColor: 'var(--card)', backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px)`, backgroundSize: `20px 20px` } },
    { name: 'Checks', style: { backgroundColor: 'var(--background)', backgroundImage: `linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(-45deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted) 75%), linear-gradient(-45deg, transparent 75%, var(--muted) 75%)`, backgroundSize: `20px 20px` } },
    { name: 'Zigzag', style: { backgroundColor: 'var(--card)', backgroundImage: `linear-gradient(135deg, var(--muted) 25%, transparent 25%), linear-gradient(225deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(315deg, var(--muted) 25%, var(--card) 25%)`, backgroundSize: `25px 25px` } },
];

// --- Helper Components ---

const Tooltip = ({ text, children }) => (
    <div className="relative group flex items-center">
        {children}
        <div className="absolute bottom-full mb-2 w-max bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {text}
        </div>
    </div>
);

// --- Main Component ---

const AdminGroupChats = () => {
    const dispatch = useDispatch();
    const { chats, activeChat } = useSelector((state) => state.groupChat);
    const { courses } = useSelector((state) => state.course);
    const { user } = useSelector((state) => state.auth);

    const activeChatIdRef = useRef(activeChat?._id);

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isMembersModalOpen, setMembersModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [chatBackground, setChatBackground] = useState({ name: 'Default', style: {} });
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        dispatch(fetchMyChats());
        dispatch(fetchAllCourses());
        dispatch(fetchAllUsers());
    }, [dispatch]);

    // Effect for handling socket connection, runs once per user session
    useEffect(() => {
        if (!user?._id) return;
        const socket = io(SOCKET_SERVER_URL, { query: { userId: user._id } });
        
        socket.on('connect', () => console.log('Socket connected:', socket.id));

        socket.on('newMessage', (messageData) => {
            dispatch(receiveMessage(messageData));
            // Use ref to get current active chat ID to avoid stale closure
            if (activeChatIdRef.current !== messageData.chatId) {
                toast.success(`New message in ${messageData.chatName || 'a chat'}`);
            }
        });

        socket.on('updateMessage', (payload) => {
            dispatch(updateMessage(payload));
        });

        socket.on('deleteMessage', ({ chatId, messageIds, isPermanent }) => {
            if (isPermanent) {
                dispatch(permanentlyDeleteMessages.fulfilled({ chatId, messageIds }));
            } else {
                dispatch(softDeleteMessages.fulfilled({ chatId, messageIds }));
            }
        });

        return () => socket.disconnect();
    }, [dispatch, user]);

    // Effect to update the active chat ID ref when activeChat changes
    useEffect(() => {
        activeChatIdRef.current = activeChat?._id;
        if (activeChat?._id) {
            const savedBg = localStorage.getItem(`chat_bg_${activeChat._id}`);
            savedBg ? setChatBackground(JSON.parse(savedBg)) : setChatBackground({ name: 'Default', style: {} });
        }
    }, [activeChat?._id]);

    const handleSelectChat = (chatId) => {
        if (activeChat?._id !== chatId) {
            dispatch(setActiveChat(chatId));
            dispatch(fetchChatById({ chatId }));
        }
    };

    const handleRefreshChat = useCallback(() => {
        if (!activeChat?._id) return;
        const toastId = toast.loading('Refreshing chat...');
        dispatch(fetchChatById({ chatId: activeChat._id }))
            .unwrap()
            .then(() => {
                toast.success('Chat refreshed!', { id: toastId });
            })
            .catch((error) => {
                toast.error(error.message || 'Failed to refresh chat.', { id: toastId });
            });
    }, [dispatch, activeChat?._id]);

    const handleSetChatBackground = (bg) => {
        setChatBackground(bg);
        if (activeChat?._id) {
            localStorage.setItem(`chat_bg_${activeChat._id}`, JSON.stringify(bg));
        }
    };

    const handleCustomBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const toastId = toast.loading('Uploading background...');
        try {
            const result = await dispatch(uploadSingleFile(file)).unwrap();
            const newBg = { name: 'Custom', style: { backgroundImage: `url(${result.fileUrl})` } };
            handleSetChatBackground(newBg);
            toast.success('Background updated!', { id: toastId });
        } catch (error) {
            toast.error("Failed to upload custom background.", { id: toastId });
        }
    };

    // ** CORRECTED LOGIC **
    // A user has elevated privileges if they are a global admin OR
    // they are an admin/instructor within the context of the active chat.
    const isUserAdminOrInstructor = useMemo(() => {
        if (!activeChat || !user?._id) return false;

        // Global admin has universal power
        if (user.role === 'admin') {
            return true;
        }

        // Check for specific role within the chat
        const userRoleInChat = activeChat.members?.find(member => member.user?._id === user._id)?.role;
        return ['admin', 'instructor'].includes(userRoleInChat);
    }, [activeChat, user]);

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground font-body">
            <ChatListPanel
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onCreateChat={() => setCreateModalOpen(true)}
            />

            <main className="flex-1 flex flex-col transition-all duration-300">
                {activeChat ? (
                    <div className="flex flex-col h-full bg-cover bg-center" style={chatBackground.style}>
                        <div className="flex-1 flex flex-col min-h-0">
                            <ChatHeader
                                chat={activeChat}
                                onManageMembers={() => setMembersModalOpen(true)}
                                onOpenSettings={() => setSettingsModalOpen(true)}
                                onRefreshChat={handleRefreshChat}
                            />
                            <MessageArea
                                chat={activeChat}
                                setConfirmation={setConfirmation}
                            />
                            <MessageInput chat={activeChat} />
                        </div>
                    </div>
                ) : (
                    <WelcomeScreen />
                )}
            </main>

            <AnimatePresence>
                {isCreateModalOpen && <CreateChatModal courses={courses} onClose={() => setCreateModalOpen(false)} />}
                {isMembersModalOpen && activeChat && <ManageMembersModal chat={activeChat} onClose={() => setMembersModalOpen(false)} />}
                {isSettingsModalOpen && activeChat && (
                    <ChatSettingsModal
                        chat={activeChat}
                        onClose={() => setSettingsModalOpen(false)}
                        isUserAdminOrInstructor={isUserAdminOrInstructor}
                        setConfirmation={setConfirmation}
                        onSetBackground={handleSetChatBackground}
                        onCustomBackgroundUpload={handleCustomBackgroundUpload}
                    />
                )}
                {confirmation.isOpen && <ConfirmationModal {...confirmation} onClose={() => setConfirmation({ ...confirmation, isOpen: false })} />}
            </AnimatePresence>
        </div>
    );
};

// --- Child Components ---

const ChatListPanel = ({ chats, activeChat, onSelectChat, onCreateChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredChats = useMemo(() =>
        chats.filter(chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [chats, searchTerm]
    );

    const getRelativeTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isToday(d)) return format(d, 'p');
        if (isYesterday(d)) return 'Yesterday';
        return format(d, 'dd/MM/yy');
    };

    return (
        <aside className="w-80 bg-card flex flex-col flex-shrink-0 border-r border-border">
            <header className="p-4 border-b border-border flex justify-between items-center">
                <h1 className="text-xl font-bold font-display">Chats</h1>
                <Tooltip text="Create New Chat">
                    <button onClick={onCreateChat} className="p-2 rounded-full hover:bg-muted">
                        <Plus size={20} />
                    </button>
                </Tooltip>
            </header>
            <div className="p-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-input pl-10 pr-4 py-2 rounded-lg border-transparent focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredChats.map(chat => {
                    const lastMessage = chat.messages?.[0]; // The slice logic puts the latest message first in the preview
                    return (
                        <div
                            key={chat._id}
                            onClick={() => onSelectChat(chat._id)}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${activeChat?._id === chat._id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            <div className="relative mr-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white ${activeChat?._id === chat._id ? 'bg-white/20' : 'bg-primary/80'}`}>
                                    {chat.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold truncate">{chat.name}</h3>
                                    <p className={`text-xs flex-shrink-0 ml-2 ${activeChat?._id === chat._id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {getRelativeTime(lastMessage?.createdAt || chat.updatedAt)}
                                    </p>
                                </div>
                                <p className={`text-sm truncate ${activeChat?._id === chat._id ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                    {lastMessage?.content || (lastMessage?.attachments?.length > 0 ? 'Attachment' : 'No messages yet')}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <UserProfile />
        </aside>
    );
};

const UserProfile = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleSync = async () => {
        const toastId = toast.loading("Syncing memberships...");
        try {
            await dispatch(syncMemberships()).unwrap();
            toast.success("Sync complete!", { id: toastId });
        } catch (error) {
            toast.error("Sync failed.", { id: toastId });
        }
    };
    
    return (
        <div className="p-4 border-t border-border flex items-center justify-between bg-card-foreground/5">
            <div className="flex items-center overflow-hidden">
                <img src={user?.profileInfo?.avatar || `https://i.pravatar.cc/150?u=${user?._id}`} alt="User Avatar" className="w-10 h-10 rounded-full mr-3" />
                <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold truncate">{user?.profileInfo?.firstName} {user?.profileInfo?.lastName}</h4>
                    <p className="text-xs text-muted-foreground">Online</p>
                </div>
            </div>
            <div className="flex items-center space-x-1">
                {user?.role === 'admin' && (
                       <Tooltip text="Sync Memberships">
                           <button onClick={handleSync} className="p-2 rounded-full hover:bg-muted">
                               <RefreshCw size={18} />
                           </button>
                       </Tooltip>
                )}
                
            </div>
        </div>
    );
};

const ChatHeader = ({ chat, onManageMembers, onOpenSettings, onRefreshChat }) => (
    <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div>
            <h2 className="text-xl font-bold flex items-center">
                <Hash size={20} className="text-muted-foreground mr-2" />
                {chat.name}
            </h2>
            <p className="text-sm text-muted-foreground">{chat.members?.length || 0} members | {chat.course?.title}</p>
        </div>
        <div className="flex items-center space-x-2">
            <Tooltip text="Refresh Chat">
                <button onClick={onRefreshChat} className="p-2 rounded-full hover:bg-muted">
                    <RefreshCw size={20} />
                </button>
            </Tooltip>
            <Tooltip text="Manage Members">
                <button onClick={onManageMembers} className="p-2 rounded-full hover:bg-muted">
                    <Users size={20} />
                </button>
            </Tooltip>
            <Tooltip text="Chat Settings">
                <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-muted">
                    <Settings size={20} />
                </button>
            </Tooltip>
        </div>
    </header>
);

const MessageArea = ({ chat, setConfirmation }) => {
    const { user } = useSelector((state) => state.auth);
    const messagesEndRef = useRef(null);
    const prevChatId = useRef(null);

    useEffect(() => {
        const isNewChat = prevChatId.current !== chat._id;
        
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: isNewChat ? 'auto' : 'smooth' 
            });
        }
        prevChatId.current = chat._id;
    }, [chat.messages, chat._id]);


    const messagesWithSeparators = useMemo(() => {
        if (!Array.isArray(chat?.messages)) return [];
        const result = [];
        let lastDate = null;
        let lastSenderId = null;
        let lastTimestamp = null;

        chat.messages.forEach((msg) => {
            if (!msg || !msg.createdAt) return;
            const msgDate = new Date(msg.createdAt).toDateString();
            const msgTimestamp = new Date(msg.createdAt);

            if (msgDate !== lastDate) {
                result.push({ type: 'separator', date: msg.createdAt });
                lastDate = msgDate;
                lastSenderId = null;
            }

            const timeDiff = lastTimestamp ? (msgTimestamp - lastTimestamp) / (1000 * 60) : Infinity;
            const isGroupStart = msg.sender?._id !== lastSenderId || timeDiff > 5;

            result.push({ type: 'message', data: msg, isGroupStart });
            lastSenderId = msg.sender?._id;
            lastTimestamp = msgTimestamp;
        });
        return result;
    }, [chat.messages]);

    return (
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative" ref={messagesEndRef}>
            <div className="flex flex-col gap-1">
                {messagesWithSeparators.map((item, index) => {
                    if (item.type === 'separator') {
                        return <DateSeparator key={`sep-${index}`} date={item.date} />;
                    }
                    const msg = item.data;
                    return (
                        <Message
                            key={msg._id}
                            message={msg}
                            chatId={chat._id}
                            isOwnMessage={msg.sender?._id === user?._id}
                            isGroupStart={item.isGroupStart}
                            setConfirmation={setConfirmation}
                        />
                    );
                })}
                {/* <div ref={messagesEndRef} /> */}
            </div>
        </div>
    );
};

const DateSeparator = ({ date }) => (
    <div className="relative text-center my-4">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-muted rounded-full text-xs font-semibold text-muted-foreground">
            {isToday(new Date(date)) ? 'Today' : isYesterday(new Date(date)) ? 'Yesterday' : format(new Date(date), 'MMMM d, yyyy')}
        </span>
    </div>
);

const AttachmentRenderer = ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
            {attachments.map((file, index) => {
                const key = file.url || index;
                if (file.type.startsWith('image/')) {
                    return (
                        <a key={key} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-border">
                            <img src={file.url} alt={file.name || 'Attachment'} className="w-full h-auto object-cover" />
                        </a>
                    );
                }
                if (file.type.startsWith('video/')) {
                    return <video key={key} src={file.url} controls className="w-full rounded-lg" />;
                }
                return (
                    <a key={key} href={file.url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-3 bg-muted p-3 rounded-lg hover:bg-accent transition-colors">
                        <FileText className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                        <div className="overflow-hidden">
                           <p className="text-sm font-medium truncate">{file.name || 'File'}</p>
                           <p className="text-xs text-muted-foreground">Click to view/download</p>
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

const Message = ({ message, chatId, isOwnMessage, isGroupStart, setConfirmation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { activeChat } = useSelector((state) => state.groupChat);
    
    const [isHovered, setIsHovered] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);

    // ** CORRECTED LOGIC **
    // A user has elevated privileges if they are a global admin OR
    // they are an admin/instructor within the context of the active chat.
    const isUserAdminOrInstructor = useMemo(() => {
        if (!activeChat || !user?._id) return false;

        // Global admin has universal power
        if (user.role === 'admin') {
            return true;
        }

        // Check for specific role within the chat
        const userRoleInChat = activeChat.members?.find(member => member.user?._id === user._id)?.role;
        return ['admin', 'instructor'].includes(userRoleInChat);
    }, [activeChat, user]);

    const handleReaction = (emoji) => {
        dispatch(toggleReaction({ chatId, messageId: message._id, emoji: emoji.emoji }));
        setShowReactionPicker(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        toast.success("Copied to clipboard!");
    };
    
    const handleDeleteSelf = () => {
        dispatch(softDeleteMessages({ chatId, messageIds: [message._id] }));
        setShowDeleteMenu(false);
    };

    const handleDeleteAll = () => {
        setShowDeleteMenu(false);
        setConfirmation({
            isOpen: true,
            title: "Permanently Delete Message",
            message: "This will delete the message for everyone. This action cannot be undone.",
            onConfirm: () => dispatch(permanentlyDeleteMessages({ chatId, messageIds: [message._id] })),
        });
    };

    if (message.isDeleted) {
        return (
            <div className={`flex items-center gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : ''}`}>
                <div className="px-3 py-2 text-xs text-muted-foreground italic bg-muted rounded-lg">This message was deleted.</div>
            </div>
        );
    }
    
    if (!message.sender) {
        return null;
    }
    
    const reactionsByEmoji = (message.reactions || []).reduce((acc, reaction) => {
        if (!reaction || !reaction.emoji || !reaction.user) return acc;
        acc[reaction.emoji] = acc[reaction.emoji] || { users: [], count: 0 };
        acc[reaction.emoji].users.push(reaction.user.profileInfo?.firstName || 'A user');
        acc[reaction.emoji].count++;
        return acc;
    }, {});

    return (
        <div 
            className={`flex gap-3 relative ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : ''}`} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowReactionPicker(false); setShowDeleteMenu(false); }}
        >
            {!isOwnMessage && (
                <img src={message.sender.profileInfo.avatar || `https://i.pravatar.cc/150?u=${message.sender._id}`} alt={message.sender.username} className={`w-10 h-10 rounded-full flex-shrink-0 ${isGroupStart ? 'opacity-100' : 'opacity-0'}`} />
            )}
            <div className={`flex flex-col w-full max-w-lg ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {isGroupStart && !isOwnMessage && (
                    <div className="flex items-center text-sm mb-1">
                        <span className="font-bold mr-2">{message.sender.profileInfo.firstName}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(message.createdAt), 'p')}</span>
                    </div>
                )}
                <div className={`relative px-3 pt-2 pb-1 rounded-lg shadow-sm ${isOwnMessage ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none border border-border'}`}>
                    <AttachmentRenderer attachments={message.attachments} />
                    {message.content && <p className={`whitespace-pre-wrap ${message.attachments?.length > 0 ? 'mt-2' : ''}`}>{message.content}</p>}
                </div>
                
                <div className="h-8 flex items-center justify-start relative mt-1">
                       {Object.keys(reactionsByEmoji).length > 0 && (
                            <div className="flex flex-wrap gap-1 mr-2">
                                {Object.entries(reactionsByEmoji).map(([emoji, data]) => {
                                    const userHasReacted = user && data.users.includes(user.profileInfo.firstName);
                                    return(
                                        <Tooltip key={emoji} text={data.users.join(', ')}>
                                            <button onClick={() => handleReaction({emoji})} className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${userHasReacted ? 'bg-primary/80 text-primary-foreground' : 'bg-muted-foreground/20'}`}>
                                                <span>{emoji}</span>
                                                <span>{data.count}</span>
                                            </button>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        )}

                    <AnimatePresence>
                    {isHovered && (
                        <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 5}} className="flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-sm">
                            <Tooltip text="React"><button onClick={() => setShowReactionPicker(p => !p)} className="p-1 rounded-full hover:bg-muted"><Smile size={16}/></button></Tooltip>
                            <Tooltip text="Copy"><button onClick={handleCopy} className="p-1 rounded-full hover:bg-muted"><Copy size={16}/></button></Tooltip>
                            {isOwnMessage && <Tooltip text="Delete"><button onClick={() => setShowDeleteMenu(p => !p)} className="p-1 rounded-full hover:bg-muted"><Trash2 size={16}/></button></Tooltip>}
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {showReactionPicker && (
                        <div className="absolute bottom-full mb-2 z-10">
                            <EmojiPicker onEmojiClick={handleReaction} height={300} width={250} />
                        </div>
                    )}
                    {showDeleteMenu && isOwnMessage && (
                        <div className="absolute bottom-full mb-2 z-10 w-48 bg-card border border-border p-2 rounded-lg shadow-xl">
                           <button onClick={handleDeleteSelf} className="w-full text-left text-sm p-2 rounded hover:bg-muted">Delete for me</button>
                           {isUserAdminOrInstructor && <button onClick={handleDeleteAll} className="w-full text-left text-sm p-2 rounded hover:bg-destructive/10 text-destructive">Delete for everyone</button>}
                           <button onClick={() => setShowDeleteMenu(false)} className="w-full text-left text-sm p-2 rounded hover:bg-muted mt-1 border-t border-border">Cancel</button>
                        </div>
                    )}
                </div>
            </div>
             {isOwnMessage && (
                <div className="w-10 flex-shrink-0"></div>
            )}
        </div>
    );
};

const MessageInput = ({ chat }) => {
    const dispatch = useDispatch();
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && attachments.length === 0) return;

        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const toastId = toast.loading(`Uploading ${attachments.length} file(s)...`);
            try {
                for (const file of attachments) {
                    const result = await dispatch(uploadSingleFile(file)).unwrap();
                    uploadedAttachments.push({ url: result.fileUrl, type: file.type, name: file.name });
                }
                toast.success("Upload complete!", { id: toastId });
            } catch (error) {
                toast.error(`Failed to upload files.`, { id: toastId });
                return;
            }
        }
        
        dispatch(addMessage({ chatId: chat._id, content: text.trim(), attachments: uploadedAttachments }));
        setText('');
        setAttachments([]);
        setShowEmojiPicker(false);
    };
    
    const handleFileChange = (e) => {
        if (e.target.files.length) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };
    
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 border-t border-border bg-card">
            <AnimatePresence>
            {showEmojiPicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} width="100%" theme="dark" />
                </motion.div>
            )}
            </AnimatePresence>
            <form onSubmit={handleSendMessage} className="relative flex h-[50px] md:h-[60px] items-center gap-2 bg-muted rounded-2xl p-2">
                <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                <Tooltip text="Attach File">
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-muted-foreground/10">
                        <Paperclip size={20} className="text-muted-foreground" />
                    </button>
                </Tooltip>
                <Tooltip text="Add Emoji">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-full hover:bg-muted-foreground/10">
                        <Smile size={20} className="text-muted-foreground" />
                    </button>
                </Tooltip>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent h-full w-full outline-none border-none focus:ring-0 text-base placeholder-muted-foreground"
                />
                <button
                    type="submit"
                    className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                    disabled={!text.trim() && attachments.length === 0}
                >
                    <Send size={20} />
                </button>
            </form>
               {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                        <span key={index} className="flex items-center bg-muted-foreground/10 px-3 py-1 rounded-full text-sm">
                            {file.name}
                            <button type="button" onClick={() => removeAttachment(index)} className="ml-2 text-muted-foreground hover:text-foreground">
                                <XCircle size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

const ChatSettingsModal = ({ chat, onClose, isUserAdminOrInstructor, setConfirmation, onSetBackground, onCustomBackgroundUpload }) => {
    const dispatch = useDispatch();
    const handleLeaveChat = useCallback(() => {
        onClose();
        setConfirmation({
            isOpen: true,
            title: 'Leave Chat',
            message: `Are you sure you want to leave "${chat.name}"?`,
            onConfirm: async () => {
                try {
                    await dispatch(leaveChat(chat._id)).unwrap();
                    dispatch(clearActiveChat());
                } catch (error) { toast.error(error.message || 'Failed to leave chat.'); }
            }
        });
    }, [dispatch, chat, setConfirmation, onClose]);

    const handleDeleteChat = useCallback(() => {
        onClose();
        setConfirmation({
            isOpen: true,
            title: 'Delete Chat',
            message: `Are you sure you want to permanently delete "${chat.name}"? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    await dispatch(deleteChat(chat._id)).unwrap();
                    dispatch(clearActiveChat());
                } catch (error) { toast.error(error.message || 'Failed to delete chat.'); }
            }
        });
    }, [dispatch, chat, setConfirmation, onClose]);
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-heading">Chat Settings</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <h3 className="font-bold mb-2 flex items-center"><Palette size={16} className="mr-2"/> Classic Backgrounds</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {classicBackgrounds.map(bg => (
                                <div key={bg.name} onClick={() => onSetBackground(bg)} style={bg.style} className="h-16 rounded-md cursor-pointer bg-cover bg-center flex items-center justify-center">
                                    <span className="text-white font-bold text-xs bg-black/50 px-1 rounded">{bg.name}</span>
                                </div>
                            ))}
                        </div>

                        <h3 className="font-bold mt-6 mb-2 flex items-center"><Palette size={16} className="mr-2"/> Pattern Backgrounds</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {patternBackgrounds.map(bg => (
                                <div key={bg.name} onClick={() => onSetBackground(bg)} style={bg.style} className="h-16 rounded-md cursor-pointer flex items-center justify-center border border-border">
                                    <span className="text-foreground font-bold text-xs bg-background/50 px-1 rounded">{bg.name}</span>
                                </div>
                            ))}
                             <label className="h-16 rounded-md cursor-pointer bg-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-accent">
                                 <Upload size={20} />
                                 <span className="text-xs mt-1">Custom</span>
                                 <input type="file" accept="image/*" onChange={onCustomBackgroundUpload} className="hidden" />
                             </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-card-foreground/5 space-y-2">
                    <button onClick={handleLeaveChat} className="w-full flex items-center justify-center bg-destructive/10 text-destructive py-2 px-4 rounded-lg hover:bg-destructive/20 transition-colors">
                        <LogOut size={16} className="mr-2"/> Leave Group
                    </button>
                    {isUserAdminOrInstructor && (
                        <button onClick={handleDeleteChat} className="w-full flex items-center justify-center bg-destructive text-destructive-foreground py-2 px-4 rounded-lg hover:bg-destructive/90 transition-colors">
                            <Trash2 size={16} className="mr-2"/> Delete Group
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const CreateChatModal = ({ courses, onClose }) => {
    const dispatch = useDispatch();
    const [name, setName] = useState('');
    const [courseId, setCourseId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !courseId) {
            toast.error("Please provide a name and select a course.");
            return;
        }
        setLoading(true);
        try {
            await dispatch(createGroupChat({ name, courseId })).unwrap();
            onClose();
        } catch (error) {
            // Error toast is handled by the async thunk's rejection handler
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Create New Group Chat</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="chatName" className="block text-sm font-medium mb-1">Chat Name</label>
                        <input
                            type="text"
                            id="chatName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-input border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="courseSelect" className="block text-sm font-medium mb-1">Associated Course</label>
                        <select
                            id="courseSelect"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            className="w-full bg-input border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
                            disabled={loading}
                        >
                            <option value="">Select a course</option>
                            {(courses || []).map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors" disabled={loading}>Cancel</button>
                        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-primary/50" disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ManageMembersModal = ({ chat, onClose }) => {
    const dispatch = useDispatch();
    const { users: allUsers } = useSelector((state) => state.auth); 
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const availableUsers = useMemo(() => {
        if(!allUsers || !chat.members) return [];
        const memberIds = new Set(chat.members.map(m => m.user?._id));
        return allUsers
            .filter(user => !memberIds.has(user._id))
            .filter(user =>
                `${user.profileInfo.firstName} ${user.profileInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allUsers, chat.members, searchTerm]);

    const handleAddMember = async (userId) => {
        setLoading(true);
        try {
            await dispatch(addMembers({ chatId: chat._id, userIds: [userId] })).unwrap();
        } catch (error) { /* Handled by thunk */ } 
        finally { setLoading(false); }
    };
    
    const handleRemoveMember = async (userId) => {
        setLoading(true);
        try {
            await dispatch(removeMember({ chatId: chat._id, userId })).unwrap();
        } catch (error) { /* Handled by thunk */ } 
        finally { setLoading(false); }
    };

    const RoleIcon = ({ role }) => {
        switch (role) {
            case 'admin': return <Tooltip text="Admin"><FaUserShield className="text-destructive" /></Tooltip>;
            case 'instructor': return <Tooltip text="Instructor"><FaChalkboardTeacher className="text-yellow-500" /></Tooltip>;
            default: return <Tooltip text="Student"><FaUserGraduate className="text-muted-foreground" /></Tooltip>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col h-[70vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Manage Members for "{chat.name}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-4 flex-1 overflow-hidden">
                    <div className="flex flex-col">
                        <h3 className="font-semibold mb-2">Current Members ({chat.members.length})</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-border rounded-lg p-2 bg-input">
                            {chat.members.map(member => (
                                member.user &&
                                <div key={member.user._id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2">
                                        <img src={member.user.profileInfo.avatar || `https://i.pravatar.cc/150?u=${member.user._id}`} alt="" className="w-8 h-8 rounded-full"/>
                                        <span>{member.user.profileInfo.firstName} {member.user.profileInfo.lastName}</span>
                                        <RoleIcon role={member.role} />
                                    </div>
                                    <button onClick={() => handleRemoveMember(member.user._id)} disabled={loading} className="text-sm text-destructive hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h3 className="font-semibold mb-2">Add Members</h3>
                        <input
                            type="text"
                            placeholder="Search users to add..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-input mb-2 p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                            disabled={loading}
                        />
                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-border rounded-lg p-2 bg-input">
                            {availableUsers.length > 0 ? availableUsers.map(user => (
                                <div key={user._id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2">
                                        <img src={user.profileInfo.avatar || `https://i.pravatar.cc/150?u=${user._id}`} alt="" className="w-8 h-8 rounded-full"/>
                                        <span>{user.profileInfo.firstName} {user.profileInfo.lastName}</span>
                                    </div>
                                    <button onClick={() => handleAddMember(user._id)} disabled={loading} className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground p-2">No users found.</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Done</button>
                </div>
            </motion.div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6"
            >
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium font-heading" id="modal-title">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-destructive text-base font-medium text-destructive-foreground hover:bg-destructive/90 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => { onConfirm(); onClose(); }}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium hover:bg-muted sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const WelcomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-background">
        <MessageSquare size={80} className="text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-bold font-heading">Welcome to Chats</h1>
        <p className="text-muted-foreground mt-2">Select a conversation from the sidebar to get started.</p>
    </div>
);

export default AdminGroupChats;