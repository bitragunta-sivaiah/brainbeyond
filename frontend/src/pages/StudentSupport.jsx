import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom'; // <-- Import useParams and useNavigate

// --- Redux Actions ---
import {
    createTicket,
    getTickets,
    getTicketById,
    addResponse,
    clearTicket,
} from '../store/redux/supportTicketSlice'; // Adjust path as needed
import { uploadBulkFiles, clearBulkFileUpload } from '../store/redux/uploadSlice'; // Adjust path as needed

// --- Icons ---
import {
    Plus, X, Paperclip, Send, ArrowLeft, Loader, FileText, Image as ImageIcon, Trash2, FileArchive
} from 'lucide-react';
import { RiRobot2Fill } from "react-icons/ri";

// --- Socket.IO Connection ---
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Helper Functions ---

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const getStatusBadge = (status) => {
    const styles = {
        open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        awaiting_user: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        reopened: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.closed}`}>
            {status.replace('_', ' ').toUpperCase()}
        </span>
    );
};

const getFileIcon = (contentType) => {
    if (contentType?.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-accent" />;
    if (contentType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (contentType?.startsWith('application/zip') || contentType?.startsWith('application/x-zip-compressed')) return <FileArchive className="h-6 w-6 text-yellow-500" />;
    return <FileText className="h-6 w-6 text-custom" />;
};


// --- Main Component ---
const StudentSupport = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // <-- Initialize navigate
    const { ticketId: ticketIdFromParams } = useParams(); // <-- Get ticketId from URL

    const { user } = useSelector((state) => state.auth);
    const { tickets, ticket: selectedTicket, loading: ticketLoading } = useSelector((state) => state.supportTicket);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    
    // Effect to get all tickets on component mount
    useEffect(() => {
        dispatch(getTickets());
    }, [dispatch]);

    // Effect to sync URL parameter with the component's state
    useEffect(() => {
        if (ticketIdFromParams) {
            setSelectedTicketId(ticketIdFromParams);
        } else {
            setSelectedTicketId(null);
        }
    }, [ticketIdFromParams]);
    
    // Effect to fetch details of the selected ticket
    useEffect(() => {
        if (selectedTicketId) {
            dispatch(getTicketById(selectedTicketId));
        } else {
            dispatch(clearTicket());
        }
    }, [selectedTicketId, dispatch]);

    // Effect for Socket.IO connection and real-time updates
    useEffect(() => {
        if (!user?._id) return;
        const socket = io(SOCKET_SERVER_URL, {
            query: { userId: user._id },
            withCredentials: true,
        });

        socket.on('connect', () => console.log('Connected to socket server'));
        
        socket.on('ticket_updated', (updatedTicket) => {
            // A ticket was updated, refresh the main list
            dispatch(getTickets());
            // If it's the one we are viewing, refresh its details too
            if (updatedTicket.ticketId === selectedTicketId) {
                dispatch(getTicketById(updatedTicket.ticketId));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user, selectedTicketId, dispatch]);

    const handleSelectTicket = (ticketId) => {
        navigate(`/student/support/${ticketId}`); // <-- Navigate to update URL
    };

    const handleBackToList = () => {
        navigate('/student/support'); // <-- Navigate to base page
    };

    return (
        <div className="flex h-[calc(100vh-80px)] font-body bg-background text-foreground overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            <aside className={`w-full md:w-1/3 lg:w-1/4 border-r border-border flex flex-col transition-transform duration-300 ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-heading font-bold">My Tickets</h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary text-primary-foreground px-3 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span className="hidden lg:inline">New Ticket</span>
                    </motion.button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {ticketLoading && tickets.length === 0 ? (
                        <div className="p-4 text-center">Loading tickets...</div>
                    ) : (
                        tickets.map((t) => (
                            <motion.div
                                key={t.ticketId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => handleSelectTicket(t.ticketId)} // <-- Use handler to navigate
                                className={`p-4 border-b border-border cursor-pointer hover:bg-muted ${selectedTicketId === t.ticketId ? 'bg-secondary' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold font-heading text-md mb-1 truncate pr-2">{t.subject}</h3>
                                    {getStatusBadge(t.status)}
                                </div>
                                <p className="text-sm text-custom truncate">Ticket ID: {t.ticketId}</p>
                                <p className="text-xs text-muted-foreground mt-2">Last updated: {formatDate(t.updatedAt)}</p>
                            </motion.div>
                        ))
                    )}
                </div>
            </aside>

            <main className={`w-full md:w-2/3 lg:w-3/4 flex flex-col transition-transform duration-300 ${selectedTicketId ? 'flex' : 'hidden md:flex'}`}>
                {selectedTicket ? (
                    <TicketDetails ticket={selectedTicket} onBack={handleBackToList} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-custom">
                            <FileText size={48} className="mx-auto mb-4" />
                            <h2 className="text-xl font-heading">Select a ticket to view details</h2>
                            <p>or create a new ticket to get started.</p>
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isModalOpen && <CreateTicketModal onClose={() => setIsModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-Component: TicketDetails ---
const TicketDetails = ({ ticket, onBack }) => { // <-- Removed messagesEndRef from props
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { loading: responseLoading } = useSelector((state) => state.supportTicket);
    const { bulkFileStatus } = useSelector((state) => state.upload);
    const fileInputRef = useRef(null);

    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments(prev => [...prev, ...files]);
    };
    
    const removeAttachment = (fileName) => {
        setAttachments(prev => prev.filter(file => file.name !== fileName));
    };

    const handleSendResponse = async (e) => {
        e.preventDefault();
        if (!message.trim() && attachments.length === 0) return;

        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const uploadResultAction = await dispatch(uploadBulkFiles(attachments));
            if (uploadBulkFiles.fulfilled.match(uploadResultAction)) {
                const uploadedData = uploadResultAction.payload.data;
                uploadedAttachments = uploadedData.map(file => ({
                    url: file.fileUrl,
                    contentType: file.fileType,
                }));
            } else {
                return; // Upload failed, toast already shown by thunk
            }
        }
        
        const responseData = {
            ticketId: ticket.ticketId,
            message,
            attachments: uploadedAttachments,
        };
        
        const result = await dispatch(addResponse(responseData));
        if(addResponse.fulfilled.match(result)) {
            setMessage('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="p-4 border-b border-border flex items-center gap-4">
                <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-muted">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-bold font-heading">{ticket.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-custom">
                        <span>#{ticket.ticketId}</span>
                        {getStatusBadge(ticket.status)}
                    </div>
                </div>
            </header>

            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {ticket.responses?.map((res, index) => (
                    <motion.div
                        key={res._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-3 mb-6 ${res.user?._id === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                        {res.user?._id !== user._id && (
                            res.isAIMessage ? (
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground self-start shrink-0">
                                    <RiRobot2Fill size={24} />
                                </div>
                            ) : (
                                <img
                                    src={res.user?.profileInfo?.avatar || `https://ui-avatars.com/api/?name=${res.user?.fullName}&background=random`}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full object-cover self-start shrink-0"
                                />
                            )
                        )}
                        <div className={`max-w-lg p-3 rounded-xl ${res.user?._id === user._id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">
                                    {res.user?._id === user._id ? 'You' : (res.isAIMessage ? 'AI Assistant' : res.user?.fullName)}
                                </span>
                                <span className="text-xs opacity-70">{formatDate(res.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap break-words">{res.message}</p>
                             {res.attachments && res.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {res.attachments.map((att, idx) => (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" key={idx} className="flex items-center gap-2 p-2 bg-black bg-opacity-20 rounded-lg hover:bg-opacity-30">
                                            {getFileIcon(att.contentType)}
                                            <span className="text-sm truncate">{att.url.split('/').pop().substring(0, 20)}...</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <footer className="p-4 border-t border-border bg-card">
                 {attachments.length > 0 && (
                    <div className="mb-2 p-2 border border-dashed border-border rounded-lg grid grid-cols-2 md:grid-cols-3 gap-2">
                        {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm">
                                {getFileIcon(file.type)}
                                <span className="truncate flex-1">{file.name}</span>
                                <button onClick={() => removeAttachment(file.name)} className="text-destructive hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSendResponse} className="flex items-center gap-3">
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-muted">
                        <Paperclip size={20} />
                    </button>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        rows="1"
                        className="flex-grow bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring focus:outline-none resize-none"
                    />
                    <button
                        type="submit"
                        disabled={responseLoading || bulkFileStatus === 'loading'}
                        className="bg-primary text-primary-foreground p-3 rounded-full disabled:bg-opacity-50 flex items-center justify-center"
                    >
                        {responseLoading || bulkFileStatus === 'loading' ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </footer>
        </div>
    );
};

// --- Sub-Component: Create Ticket Modal ---
const CreateTicketModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.supportTicket);
    const { bulkFileStatus } = useSelector((state) => state.upload);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        subject: '', initialMessage: '', type: 'general_inquiry', priority: 'medium'
    });
    const [attachments, setAttachments] = useState([]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    const removeAttachment = (fileName) => setAttachments(prev => prev.filter(file => file.name !== fileName));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const uploadResultAction = await dispatch(uploadBulkFiles(attachments));
            if (uploadBulkFiles.fulfilled.match(uploadResultAction)) {
                 const uploadedData = uploadResultAction.payload.data;
                 uploadedAttachments = uploadedData.map(file => ({
                    url: file.fileUrl,
                    contentType: file.fileType,
                }));
            } else {
                return; // Upload failed
            }
        }
        
        const ticketData = { ...formData, attachments: uploadedAttachments };
        const resultAction = await dispatch(createTicket(ticketData));

        if (createTicket.fulfilled.match(resultAction)) {
            onClose();
            dispatch(clearBulkFileUpload());
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-heading">Create New Support Ticket</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                        <X size={24} />
                    </button>
                </div>
                <form id="create-ticket-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Category</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring">
                                <option value="general_inquiry">General Inquiry</option>
                                <option value="technical">Technical Issue</option>
                                <option value="billing">Billing Question</option>
                                <option value="account">Account Help</option>
                                <option value="feature_request">Feature Request</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="initialMessage" className="block text-sm font-medium mb-1">How can we help?</label>
                        <textarea name="initialMessage" value={formData.initialMessage} onChange={handleChange} required rows="6" className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="w-full flex justify-center items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary">
                            <Paperclip size={18} />
                            <span>Add Files</span>
                        </button>
                         {attachments.length > 0 && (
                            <div className="mt-3 p-2 border border-border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm">
                                        {getFileIcon(file.type)}
                                        <span className="truncate flex-1">{file.name}</span>
                                        <button type="button" onClick={() => removeAttachment(file.name)} className="text-destructive hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border">
                        Cancel
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" form="create-ticket-form" disabled={loading || bulkFileStatus === 'loading'} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground disabled:bg-opacity-60 flex items-center gap-2">
                        {(loading || bulkFileStatus === 'loading') && <Loader size={18} className="animate-spin" />}
                        Submit Ticket
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StudentSupport;