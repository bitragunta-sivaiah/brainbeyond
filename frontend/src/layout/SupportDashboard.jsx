import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Paperclip, Send, X, File, Bot, User, ShieldCheck, Filter,
    CheckCircle, Clock, Loader, HelpCircle
} from 'lucide-react';
import { FaSpinner, FaMagic } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
 

// Import Redux Thunks
import {
    getTickets, getTicketById, addMessage, updateTicket, getAIAssist, clearAISuggestion
} from '../store/redux/supportTicketSlice';
 

const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const MessageBubble = ({ msg, currentUserId }) => {
    const isUser = msg.sender.role === 'student' || msg.sender.role === 'instructor';
    const isAdmin = msg.sender.role === 'admin';
    const isCustomerCare = msg.sender.role === 'customercare';
    const isInternal = msg.isInternalNote;

    const getAvatar = () => {
        if (isAdmin) return <Bot className="w-5 h-5 text-primary" />;
        if (isCustomerCare) return <ShieldCheck className="w-5 h-5 text-green-500" />;
        return <User className="w-5 h-5 text-accent-foreground" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 my-4 ${isUser ? 'justify-start' : 'justify-end'}`}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">{getAvatar()}</div>
            )}
            <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                <div className={`max-w-xl p-4 rounded-lg shadow-md ${ isInternal ? 'bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-foreground' : isUser ? 'bg-card text-foreground rounded-bl-none' : 'bg-primary text-primary-foreground rounded-br-none' }`}>
                    <p className="font-bold text-sm mb-1 flex items-center gap-2">{msg.sender.username} {isInternal && <span className="text-xs font-normal text-yellow-600 dark:text-yellow-300">(Internal Note)</span>}</p>
                    <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-xs text-custom mt-1">{formatDate(msg.timestamp)}</span>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">{getAvatar()}</div>
            )}
        </motion.div>
    );
};

const SupportDashboard = ({ userRole }) => {
    const dispatch = useDispatch();
    const { tickets, ticket: activeTicket, loading, aiSuggestion } = useSelector((state) => state.tickets);
    const { bulkFileStatus } = useSelector((state) => state.upload);
    const { user } = useSelector((state) => state.auth);

    const [filters, setFilters]  = useState({ status: 'Open', priority: '' });
    const [newMessage, setNewMessage]  = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [ticketChanges, setTicketChanges] = useState({});
    
    // In a real app, you'd fetch this list from your userSlice
    const [agents, setAgents] = useState([]); 

    const chatEndRef = useRef(null);

    useEffect(() => {
        dispatch(getTickets(filters));
        // dispatch(fetchAgents()).then(res => setAgents(res.payload)); // Example of fetching agents
    }, [dispatch, filters]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeTicket?.messages]);
    
    useEffect(() => {
        if (activeTicket) {
            setTicketChanges({
                status: activeTicket.status,
                priority: activeTicket.priority,
                assignedTo: activeTicket.assignedTo?._id || '',
            });
        }
    }, [activeTicket]);

    const handleSelectTicket = (ticketId) => dispatch(getTicketById(ticketId));

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const messageData = { content: newMessage, isInternalNote };
        await dispatch(addMessage({ ticketId: activeTicket._id, messageData }));
        setNewMessage('');
        setIsInternalNote(false);
        setShowEmojiPicker(false);
    };

    const handleUpdateTicket = () => {
        dispatch(updateTicket({ ticketId: activeTicket._id, updateData: ticketChanges }));
    };

    const handleAIAssist = () => {
        if (newMessage.trim()) {
            dispatch(getAIAssist({ ticketId: activeTicket._id, draftContent: newMessage }));
        }
    };
    
    const useAISuggestion = () => {
        setNewMessage(aiSuggestion);
        dispatch(clearAISuggestion());
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Open': return <HelpCircle className="text-blue-500" />;
            case 'In Progress': return <Loader className="text-yellow-500 animate-spin" />;
            case 'Resolved': return <CheckCircle className="text-green-500" />;
            case 'Closed': return <CheckCircle className="text-gray-500" />;
            default: return <Clock className="text-gray-400" />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-background  text-foreground font-body">
            {/* Left Panel: Ticket List & Filters */}
            <aside className="w-1/3 min-w-[350px  bg-card  border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2"><Filter size={20}/> Filter Tickets</h2>
                    <div className="flex gap-2">
                        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full bg-input border-border rounded-md px-3 py-2">
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Awaiting User Response">Awaiting User Response</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                         <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} className="w-full bg-input border-border rounded-md px-3 py-2">
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && tickets.length === 0 ? <div className="flex items-center justify-center h-full"><FaSpinner className="animate-spin text-2xl text-primary" /></div>
                    : tickets.map(t => (
                        <motion.div key={t._id} whileHover={{ backgroundColor: 'var(--muted)' }} className={`p-4 border-b border-border cursor-pointer ${activeTicket?._id === t._id ? 'bg-accent ' : ''}`} onClick={() => handleSelectTicket(t._id)}>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold font-heading truncate w-4/5 flex items-center gap-2">{getStatusIcon(t.status)} {t.title}</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.priority === 'High' || t.priority === 'Urgent' ? 'text-red-500' : 'text-custom '}`}>{t.priority}</span>
                            </div>
                             <p className="text-sm text-custom ">From: {t.createdBy?.username || 'N/A'}</p>
                            <p className="text-xs text-custom  mt-1">{formatDate(t.createdAt)}</p>
                        </motion.div>
                    ))}
                </div>
            </aside>

            {/* Center Panel: Chat View */}
            <main className="flex-1 flex flex-col bg-background ">
                {activeTicket ? (
                    <>
                        <header className="p-4 border-b border-border bg-card  shadow-sm">
                            <h3 className="text-xl font-heading font-bold">{activeTicket.title}</h3>
                            <p className="text-sm text-custom ">Ticket ID: {activeTicket.ticketId}</p>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">{activeTicket.messages.map(msg => <MessageBubble key={msg._id} msg={msg} currentUserId={user._id} />)}<div ref={chatEndRef} /></div>
                        
                        <AnimatePresence>
                        {aiSuggestion && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 10}} className="p-4 m-4 mb-0 rounded-lg bg-indigo-100 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2"><FaMagic /> AI Suggestion</h4>
                                    <button onClick={() => dispatch(clearAISuggestion())}><X size={16}/></button>
                                </div>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">{aiSuggestion}</p>
                                <button onClick={useAISuggestion} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md">Use this text</button>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <footer className="p-4 bg-card  border-t border-border relative">
                            {showEmojiPicker && <div className="absolute bottom-24 right-4 z-10"><EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} /></div>}
                            <form onSubmit={handleSendMessage}>
                                <div className="flex items-center gap-4">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your response..." className="flex-1 bg-input border border-border rounded-full px-4 py-3 focus:ring-2 focus:ring-ring " />
                                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 rounded-full hover:bg-muted ">😊</button>
                                    <button type="button" onClick={handleAIAssist} disabled={loading} className="p-3 rounded-full hover:bg-muted  disabled:opacity-50"><FaMagic className="text-primary"/></button>
                                    <button type="submit" className="p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90"><Send size={20} /></button>
                                </div>
                                <div className="mt-2 flex items-center">
                                    <input type="checkbox" id="internalNote" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring "/>
                                    <label htmlFor="internalNote" className="ml-2 block text-sm text-custom ">Send as internal note</label>
                                </div>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <MessageSquare className="w-16 h-16 text-custom  mb-4"/>
                        <h3 className="text-2xl font-heading font-bold">Support Dashboard</h3>
                        <p className="text-custom  mt-2">Select a ticket from the list to begin.</p>
                    </div>
                )}
            </main>

            {/* Right Panel: Ticket Details & Actions */}
             {activeTicket && (
                <aside className="w-1/4 min-w-[300px  bg-card  border-l border-border p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xl font-bold font-heading mb-6">Ticket Details</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <label className="font-bold">Customer</label>
                            <p className="text-custom ">{activeTicket.createdBy.username}</p>
                        </div>
                         <div>
                            <label className="font-bold">Status</label>
                            <select value={ticketChanges.status} onChange={e => setTicketChanges({...ticketChanges, status: e.target.value})} className="w-full mt-1 bg-input border-border rounded-md px-3 py-2">
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Awaiting User Response</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-bold">Priority</label>
                            <select value={ticketChanges.priority} onChange={e => setTicketChanges({...ticketChanges, priority: e.target.value})} className="w-full mt-1 bg-input border-border rounded-md px-3 py-2">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-bold">Assigned To</label>
                            <select value={ticketChanges.assignedTo} onChange={e => setTicketChanges({...ticketChanges, assignedTo: e.target.value})} className="w-full mt-1 bg-input border-border rounded-md px-3 py-2">
                                <option value="">Unassigned</option>
                                {agents.map(agent => <option key={agent._id} value={agent._id}>{agent.username}</option>)}
                            </select>
                        </div>
                        <button onClick={handleUpdateTicket} disabled={loading} className="w-full mt-6 py-2 bg-primary text-primary-foreground rounded-md font-bold hover:opacity-90 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
};

export default SupportDashboard;