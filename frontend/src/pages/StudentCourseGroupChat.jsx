import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    MessageSquare, Search, Send, Paperclip, Smile, X, Users, Settings, Trash2,LogOut ,
    AlertTriangle, Palette, Upload, Hash, LogOutIcon, Copy, XCircle, Menu, SmilePlus, File, Download
} from 'lucide-react';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { io } from 'socket.io-client';

// --- Redux Imports (Student-specific) ---
import {
    fetchMyChats, fetchChatById, addMessage, softDeleteMessages, permanentlyDeleteMessages,
    leaveChat, setActiveChat, clearActiveChat, receiveMessage, toggleReaction
} from '../store/redux/groupChatSlice'; // Assuming this path is correct
import { uploadSingleFile } from '../store/redux/uploadSlice'; // Assuming this path is correct

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Constants & Helpers ---
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

const allBackgrounds = [...classicBackgrounds, ...patternBackgrounds];

const Tooltip = ({ text, children }) => (
    <div className="relative group flex items-center">
        {children}
        <div className="absolute bottom-full mb-2 w-max bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
            {text}
        </div>
    </div>
);

// --- Main Component ---
const StudentGroupChats = () => {
    const dispatch = useDispatch();
    const { chats, activeChat } = useSelector((state) => state.groupChat);
    const { user: currentUser } = useSelector((state) => state.auth);
    const activeChatRef = useRef(activeChat);

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isMembersModalOpen, setMembersModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [chatBackground, setChatBackground] = useState({ name: 'Default', style: {} });
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    
    const socketRef = useRef(null);
    
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);
    
    useEffect(() => {
        dispatch(fetchMyChats());
    }, [dispatch]);

    useEffect(() => {
        if (!currentUser?._id) return;

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_SERVER_URL, { query: { userId: currentUser._id } });

            socketRef.current.on('connect', () => console.log('Socket connected:', socketRef.current.id));
            
            socketRef.current.on('newMessage', (messageData) => {
                dispatch(receiveMessage(messageData));
                const currentActiveChat = activeChatRef.current;
                if (currentActiveChat?._id !== messageData.chatId) {
                    toast(`New message in ${messageData.chatName || 'a group'}`, { icon: '📬' });
                }
            });
            
            socketRef.current.on('updateReaction', ({ chatId, message }) => {
                dispatch(toggleReaction.fulfilled({ chatId, updatedMessage: message }));
            });

            socketRef.current.on('deleteMessage', ({ chatId, messageIds }) => {
                dispatch(softDeleteMessages.fulfilled({ chatId, messageIds }));
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [dispatch, currentUser]);

    useEffect(() => {
        if (activeChat?._id) {
            const savedBg = localStorage.getItem(`chat_bg_${activeChat._id}`);
            savedBg ? setChatBackground(JSON.parse(savedBg)) : setChatBackground({ name: 'Default', style: {} });
        }
    }, [activeChat?._id]);

    const handleSelectChat = (chatId) => {
        if (activeChat?._id !== chatId) {
            dispatch(setActiveChat(chatId));
            dispatch(fetchChatById({ chatId }));
            setSidebarOpen(false);
        }
    };

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

    const isUserAdminOrInstructor = useMemo(() => {
        if (!activeChat || !Array.isArray(activeChat.members) || !currentUser?._id) return false;
        const userRole = activeChat.members.find(member => member.user?._id === currentUser._id)?.role;
        return ['admin', 'instructor'].includes(userRole);
    }, [activeChat, currentUser]);

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-body overflow-hidden relative">
            <ChatListPanel
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="flex-1 flex flex-col transition-all duration-300">
                {activeChat ? (
                    <div className="flex flex-col h-full bg-cover bg-center" style={chatBackground.style}>
                         <div className="flex-1 flex flex-col min-h-0  ">
                            <ChatHeader
                                chat={activeChat}
                                onViewMembers={() => setMembersModalOpen(true)}
                                onOpenSettings={() => setSettingsModalOpen(true)}
                                onToggleSidebar={() => setSidebarOpen(true)}
                            />
                            <MessageArea
                                chat={activeChat}
                                currentUser={currentUser}
                                isUserAdminOrInstructor={isUserAdminOrInstructor}
                                setConfirmation={setConfirmation}
                            />
                            <MessageInput chat={activeChat} />
                        </div>
                    </div>
                ) : (
                    <WelcomeScreen onToggleSidebar={() => setSidebarOpen(true)} />
                )}
            </main>

            <AnimatePresence>
                {isMembersModalOpen && activeChat && <ViewMembersModal chat={activeChat} onClose={() => setMembersModalOpen(false)} />}
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

const ChatListPanel = ({ chats, activeChat, onSelectChat, isOpen, setIsOpen }) => {
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
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`absolute md:static top-0 left-0 h-full bg-card flex flex-col flex-shrink-0 border-r border-border w-80 z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <header className="p-4 border-b border-border">
                    <h1 className="text-xl font-bold font-display">My Group Chats</h1>
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
                        const lastMessage = chat.messages?.[0];
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
                                        {lastMessage?.attachments?.length > 0 ? `${lastMessage.attachments.length} attachment(s)` : lastMessage?.content || 'No messages yet'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <UserProfile />
            </aside>
        </>
    );
};

const UserProfile = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    return (
        <div className="p-4 border-t border-border flex items-center justify-between bg-card-foreground/5">
            <div className="flex items-center overflow-hidden">
                <img src={currentUser?.profileInfo?.avatar || `https://i.pravatar.cc/150?u=${currentUser?._id}`} alt="User Avatar" className="w-10 h-10 rounded-full mr-3" />
                <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold truncate">{currentUser?.profileInfo?.firstName} {currentUser?.profileInfo?.lastName}</h4>
                    <p className="text-xs text-muted-foreground">Online</p>
                </div>
            </div>
            <Tooltip text="Logout">
                <button className="p-2 rounded-full hover:bg-muted">
                    <LogOutIcon size={18} />
                </button>
            </Tooltip>
        </div>
    );
};

const ChatHeader = ({ chat, onViewMembers, onOpenSettings, onToggleSidebar }) => (
    <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-card/80">
        <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-muted md:hidden">
                <Menu size={20} />
            </button>
            <div>
                <h2 className="text-xl font-bold flex items-center">
                    <Hash size={20} className="text-muted-foreground mr-2 hidden sm:block" />
                    {chat.name}
                </h2>
                <p className="text-sm text-muted-foreground">{chat.members.length} members | {chat.course?.title}</p>
            </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
            <Tooltip text="View Members">
                <button onClick={onViewMembers} className="p-2 rounded-full hover:bg-muted">
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

const Attachment = ({ file }) => {
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
        return (
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img src={file.url} alt={file.name} className="w-20 h-20 object-cover  rounded " />
            </a>
        );
    }

    return (
        <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center gap-3 max-w-xs">
            <File className="w-8 h-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Download size={12} /> Download
                </a>
            </div>
        </div>
    );
};

const Message = ({ message, chatId, isOwnMessage, isGroupStart, isUserAdminOrInstructor, setConfirmation }) => {
    const dispatch = useDispatch();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const { user: currentUser } = useSelector((state) => state.auth);
    const defaultReactions = ['👍', '❤️', '😂', '🎉', '😢'];

    if (message.isDeleted || !message.sender) {
        return (
            <div className={`flex items-center gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : ''}`}>
                <div className="px-3 py-2 text-xs text-muted-foreground italic bg-muted rounded-lg">This message was deleted.</div>
            </div>
        );
    }
    
    const handleReaction = (emoji) => {
        dispatch(toggleReaction({ chatId, messageId: message._id, emoji: emoji }));
        setPickerOpen(false);
    };
    
    const handleCopy = () => {
        const textToCopy = message.content + (message.attachments.length > 0 ? `\n${message.attachments.map(a => a.url).join('\n')}` : '');
        navigator.clipboard.writeText(textToCopy);
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

    const reactionsByEmoji = (message.reactions || []).reduce((acc, reaction) => {
        acc[reaction.emoji] = acc[reaction.emoji] || { users: [], count: 0 };
        const firstName = reaction?.user?.profileInfo?.firstName || 'A user';
        if (!acc[reaction.emoji].users.includes(firstName)) {
            acc[reaction.emoji].users.push(firstName);
        }
        acc[reaction.emoji].count = (acc[reaction.emoji].users || []).length;
        return acc;
    }, {});
    
    const hasContent = message.content && message.content.trim().length > 0;
    const hasAttachments = message.attachments && message.attachments.length > 0;

    return (
        <div className={`group flex items-start gap-3 relative mb-6 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : 'mt-1'}`}>
            {!isOwnMessage && (
                <img src={message.sender.profileInfo.avatar || `https://i.pravatar.cc/150?u=${message.sender._id}`} alt={message.sender.username} className={`w-10 h-10 rounded-full self-end ${isGroupStart ? 'opacity-100' : 'opacity-0'}`} />
            )}
            <div className={`flex flex-col max-w-lg ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {isGroupStart && !isOwnMessage && (
                    <div className="flex items-center text-sm mb-1">
                        <span className="font-bold mr-2">{message.sender.profileInfo.firstName}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(message.createdAt), 'p')}</span>
                    </div>
                )}
                <div className={`relative px-3 pt-2 pb-1 rounded-lg ${isOwnMessage ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none border border-border'}`}>
                    {hasAttachments && (
                        <div className="flex flex-col gap-2 ">
                            {message.attachments.map((file, index) => <Attachment key={index} file={file} />)}
                        </div>
                    )}
                    {hasContent && (
                        <p className={`whitespace-pre-wrap ${hasAttachments ? 'mt-2' : ''}`}>{message.content}</p>
                    )}
                    
                    <div className={`absolute   ${isOwnMessage ? 'right-2 -bottom-10  pr-2' : 'left-0  -bottom-13  pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex  items-center gap-0.5 bg-card border border-border rounded-full p-1 shadow-lg`}>
                        {/* --- FIX: Reaction controls only show for other users' messages --- */}
                        {!isOwnMessage && (
                            <>
                                {defaultReactions.map(emoji => (
                                     <button key={emoji} onClick={() => handleReaction(emoji)} className="p-1 md:p-1.5 text-lg rounded-full hover:bg-muted transform transition-transform hover:scale-125">
                                         {emoji}
                                     </button>
                                 ))}
                                 
                                <div className="w-px h-5 bg-border mx-1"></div>
                            </>
                        )}
                        <button onClick={handleCopy} className="p-1   rounded-full text-foreground hover:bg-muted"><Copy size={16}/></button> 
                        {isOwnMessage && (
                          <div className="relative">
                            <button onClick={() => setShowDeleteMenu(p => !p)} className="p-1 rounded-full text-foreground  hover:bg-muted"><Trash2 size={16}/></button>
                            {showDeleteMenu && (
                                <div className="absolute bottom-full mb-2 right-0 z-10 w-48 bg-card border border-border p-2 rounded  ">
                                    <button onClick={handleDeleteSelf} className="w-full text-left text-sm p-2 rounded text-destructive hover:bg-muted">Delete for me</button>
                                    {isUserAdminOrInstructor && <button onClick={handleDeleteAll} className="w-full text-left text-sm p-2   rounded hover:bg-destructive/10 text-destructive">Delete for everyone</button>}
                                </div>
                            )}
                          </div>
                        )}
                    </div>
                </div>
                {Object.keys(reactionsByEmoji).length > 0 && (
                    /* --- FIX: Reactions positioned absolutely below the message bubble --- */
                    <div className={`absolute bottom-0 mb-[-22px] flex flex-wrap gap-1 ${isOwnMessage ? 'right-2' : 'left-12'}`}>
                        {Object.entries(reactionsByEmoji).map(([emoji, data]) => {
                            const userHasReacted = data.users.includes(currentUser.profileInfo.firstName);
                            return (
                                <Tooltip key={emoji} text={data.users.join(', ')}>
                                    <button onClick={() => handleReaction(emoji)} className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${userHasReacted ? 'bg-primary/20 border-primary' : 'bg-muted border-border'}`}>
                                        <span>{emoji}</span>
                                        <span className="font-semibold">{data.count}</span>
                                    </button>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- All subsequent components are correct and included ---
const MessageArea = ({ chat, currentUser, isUserAdminOrInstructor, setConfirmation }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

    const messagesWithSeparators = useMemo(() => {
        if (!Array.isArray(chat?.messages)) return [];
        const result = [];
        let lastDate = null;
        let lastSenderId = null;
        let lastTimestamp = null;

        [...chat.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).forEach((msg) => {
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
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
            <div className="flex flex-col gap-1">
                {messagesWithSeparators.map((item, index) => {
                    if (item.type === 'separator') {
                        return <DateSeparator key={`sep-${index}`} date={item.date} />;
                    }
                    return (
                        <Message
                            key={item.data._id}
                            message={item.data}
                            chatId={chat._id}
                            isOwnMessage={item.data.sender?._id === currentUser._id}
                            isGroupStart={item.isGroupStart}
                            isUserAdminOrInstructor={isUserAdminOrInstructor}
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
        <span className="px-3 py-1 rounded-full bg-card text-xs font-semibold text-muted-foreground border border-border">
            {isToday(new Date(date)) ? 'Today' : isYesterday(new Date(date)) ? 'Yesterday' : format(new Date(date), 'MMMM d, yyyy')}
        </span>
    </div>
);

const MessageInput = ({ chat }) => {
    const dispatch = useDispatch();
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && attachments.length === 0) return;

        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const toastId = toast.loading(`Uploading ${attachments.length} file(s)...`);
            try {
                const uploadPromises = attachments.map(file => 
                    dispatch(uploadSingleFile(file)).unwrap()
                );
                const results = await Promise.all(uploadPromises);
                uploadedAttachments = results.map((result, index) => ({
                    url: result.fileUrl,
                    type: attachments[index].type,
                    name: attachments[index].name
                }));
                toast.success("Upload complete!", { id: toastId });
            } catch (error) {
                toast.error("An error occurred during upload.", { id: toastId });
                return;
            }
        }
        
        dispatch(addMessage({ chatId: chat._id, content: text, attachments: uploadedAttachments }));
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
                        <EmojiPicker 
                            onEmojiClick={(e) => {
                                setText(prev => prev + e.emoji);
                                inputRef.current?.focus();
                            }} 
                            width="100%" 
                            height={350}
                            theme="dark" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
             {attachments.length > 0 && (
                <div className="mb-2 p-2 border border-border rounded-lg flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center bg-muted pl-3 pr-2 py-1 rounded-full text-sm">
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button type="button" onClick={() => removeAttachment(index)} className="ml-2 text-muted-foreground hover:text-foreground">
                                <XCircle size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <div className="flex-1 relative h-[50px] md:h-[60px] flex items-center bg-muted rounded-xl px-1 md:px-4">
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
                        ref={inputRef}
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none h-[30px] w-full focus:ring-0 outline-none text-base placeholder-muted-foreground px-2"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-primary text-primary-foreground p-3 h-[50px] w-[50px] md:h-[60px] md:w-[60px] flex items-center justify-center rounded-lg hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                    disabled={!text.trim() && attachments.length === 0}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

const ChatSettingsModal = ({ chat, onClose, setConfirmation, onSetBackground, onCustomBackgroundUpload }) => {
    const dispatch = useDispatch();
    const handleLeaveChat = useCallback(() => {
        onClose();
        setConfirmation({
            isOpen: true,
            title: 'Leave Chat',
            message: `Are you sure you want to leave "${chat.name}"?`,
            onConfirm: async () => {
                await dispatch(leaveChat(chat._id)).unwrap().catch(err => toast.error(err.message || "Failed to leave chat"));
                dispatch(clearActiveChat());
            }
        });
    }, [dispatch, chat, setConfirmation, onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Chat Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                </div>
                
                <h3 className="font-bold mt-6 mb-2 flex items-center"><Palette size={16} className="mr-2"/> Chat Background</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {allBackgrounds.map(bg => (
                        <div key={bg.name} onClick={() => onSetBackground(bg)} style={bg.style} className="h-16 rounded-md cursor-pointer bg-cover bg-center flex items-center justify-center border border-border">
                            <span className="text-white font-bold text-xs bg-black/50 px-1 rounded">{bg.name}</span>
                        </div>
                    ))}
                    <label className="h-16 rounded-md cursor-pointer bg-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-accent border border-border">
                        <Upload size={20} />
                        <span className="text-xs mt-1">Custom</span>
                        <input type="file" accept="image/*" onChange={onCustomBackgroundUpload} className="hidden" />
                    </label>
                </div>

                <div className="mt-6">
                    <button onClick={handleLeaveChat} className="w-full flex items-center justify-center bg-destructive/10 text-destructive py-2 px-4 rounded-lg hover:bg-destructive/20 transition-colors">
                        <LogOut size={16} className="mr-2"/> Leave Group
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ViewMembersModal = ({ chat, onClose }) => {
    const RoleIcon = ({ role }) => {
        switch (role) {
            case 'admin': return <Tooltip text="Admin"><FaUserShield className="text-destructive" /></Tooltip>;
            case 'instructor': return <Tooltip text="Instructor"><FaChalkboardTeacher className="text-yellow-500" /></Tooltip>;
            default: return <Tooltip text="Student"><FaUserGraduate className="text-muted-foreground" /></Tooltip>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Members in "{chat.name}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar border border-border rounded-lg p-2 bg-input mt-4 space-y-2">
                    {chat.members.map(member => (
                        member.user &&
                        <div key={member.user._id} className="flex items-center justify-between p-2 rounded-md">
                            <div className="flex items-center gap-3">
                                <img src={member.user.profileInfo.avatar || `https://i.pravatar.cc/150?u=${member.user._id}`} alt="" className="w-10 h-10 rounded-full"/>
                                <div>
                                    <span className='font-semibold'>{member.user.profileInfo.firstName} {member.user.profileInfo.lastName}</span>
                                    <p className='text-xs text-muted-foreground'>{member.user.username}</p>
                                </div>
                            </div>
                            <RoleIcon role={member.role} />
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium font-heading">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-destructive text-base font-medium text-destructive-foreground hover:bg-destructive/90 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => { onConfirm(); onClose(); }}>
                        Confirm
                    </button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium hover:bg-muted sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const WelcomeScreen = ({ onToggleSidebar }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-background">
        <header className="absolute top-0 left-0 w-full p-4 md:hidden">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-muted">
                <Menu size={24} />
            </button>
        </header>
        <MessageSquare size={80} className="text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-bold font-heading">Welcome to Group Chats</h1>
        <p className="text-muted-foreground mt-2">Select a conversation from the sidebar to get started.</p>
    </div>
);

export default StudentGroupChats;