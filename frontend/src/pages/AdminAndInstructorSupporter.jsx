import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom'; // <-- Import useParams and useNavigate

// --- Redux Actions ---
// Make sure this path is correct for your project structure
import {
    getTickets,
    getTicketById,
    addAgentResponse,
    updateTicketDetails,
    clearTicket,
} from '../store/redux/supportTicketSlice';
import { uploadBulkFiles } from '../store/redux/uploadSlice';
import { fetchAllUsers } from '../store/redux/authSlice';


// --- Icons ---
import {
    X, Paperclip, Send, Loader, Inbox,
    Ticket, BarChart3, CheckCircle, Timer
} from 'lucide-react';
import { RiRobot2Fill } from "react-icons/ri";

// --- Socket.IO Connection ---
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
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
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.closed}`}>
            {status.replace('_', ' ').toUpperCase()}
        </span>
    );
};

const getPriorityBadge = (priority) => {
    const styles = {
        low: 'bg-gray-200 text-gray-800',
        medium: 'bg-green-200 text-green-800',
        high: 'bg-yellow-200 text-yellow-800',
        urgent: 'bg-red-200 text-red-800',
        critical: 'bg-red-500 text-white',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[priority] || styles.low}`}>
            {priority.toUpperCase()}
        </span>
    );
};

// --- Main Component ---
const AdminSupport = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // <-- Initialize navigate
    const { ticketId: ticketIdFromParams } = useParams(); // <-- Get ticketId from URL

    const { user: currentUser, users: allUsers } = useSelector((state) => state.auth);
    const { tickets, ticket: selectedTicket, loading: ticketLoading } = useSelector((state) => state.supportTicket);
    
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [filters, setFilters] = useState({ status: 'all', priority: 'all' });

    // Fetch initial data
    useEffect(() => {
        dispatch(getTickets());
        dispatch(fetchAllUsers());
    }, [dispatch]);
    
    // Sync URL parameter with component state
    useEffect(() => {
        if (ticketIdFromParams) {
            setSelectedTicketId(ticketIdFromParams);
        } else {
            setSelectedTicketId(null);
        }
    }, [ticketIdFromParams]);

    // Fetch details for a selected ticket
    useEffect(() => {
        if (selectedTicketId) {
            dispatch(getTicketById(selectedTicketId));
        } else {
            dispatch(clearTicket());
        }
    }, [selectedTicketId, dispatch]);

    // Set up real-time updates with Socket.IO
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, { query: { userId: currentUser?._id } });

        const handleUpdate = (updatedTicket) => {
              toast.success(`Ticket #${updatedTicket.ticketId} updated.`);
              dispatch(getTickets());
              if (updatedTicket.ticketId === selectedTicketId) {
                  dispatch(getTicketById(updatedTicket.ticketId));
              }
        }
        socket.on('new_ticket_created', handleUpdate);
        socket.on('ticket_updated_by_student', handleUpdate);

        return () => {
            socket.off('new_ticket_created', handleUpdate);
            socket.off('ticket_updated_by_student', handleUpdate);
            socket.disconnect();
        };
    }, [currentUser, selectedTicketId, dispatch]);
    
    // Filter all users to get a list of 'customercare' agents
    const agents = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(user => user.role === 'customercare');
    }, [allUsers]);

    // Filter tickets based on the selected filters
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => 
            (filters.status === 'all' || t.status === filters.status) &&
            (filters.priority === 'all' || t.priority === filters.priority)
        );
    }, [tickets, filters]);

    // Handlers for navigation
    const handleSelectTicket = (ticketId) => {
        navigate(`/admin/support/${ticketId}`); // Assumes this is your base route
    };

    const handleBackToList = () => {
        navigate('/admin/support');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] font-body bg-background text-foreground overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            <h1 className="text-2xl font-bold font-heading p-4 border-b border-border">Admin Support Dashboard</h1>
            
            <AnalyticsDashboard tickets={tickets} />
            
            <div className="flex flex-grow overflow-hidden border-t border-border">
                {/* Ticket List Panel */}
                <aside className={`w-full md:w-2/5 lg:w-1/3 border-r border-border flex flex-col transition-transform duration-300 ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
                    <TicketListFilters filters={filters} setFilters={setFilters} />
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {ticketLoading && tickets.length === 0 ? (
                            <div className="p-4 text-center">Loading tickets...</div>
                        ) : (
                            filteredTickets.map((t) => (
                               <TicketListItem 
                                    key={t._id} 
                                    ticket={t} 
                                    isSelected={selectedTicketId === t.ticketId} 
                                    onSelect={() => handleSelectTicket(t.ticketId)} 
                                />
                            ))
                        )}
                    </div>
                </aside>

                {/* Ticket Details Panel */}
                <main className={`w-full md:w-3/5 lg:w-2/3 flex flex-col transition-transform duration-300 ${selectedTicketId ? 'flex' : 'hidden md:flex'}`}>
                    {selectedTicket ? (
                        <TicketDetailsPanel 
                            ticket={selectedTicket} 
                            agents={agents} 
                            onBack={handleBackToList} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-custom">
                                <Inbox size={48} className="mx-auto mb-4" />
                                <h2 className="text-xl font-heading">Select a ticket from the list</h2>
                                <p>View conversations, update details, and respond to users.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- Sub-Component: AnalyticsDashboard ---
const AnalyticsDashboard = ({ tickets }) => {
    const stats = useMemo(() => {
        const openTickets = tickets.filter(t => ['open', 'in-progress', 'reopened', 'awaiting_user'].includes(t.status));
        
        const today = new Date().setHours(0, 0, 0, 0);
        const resolvedToday = tickets.filter(t => {
            const closedDate = new Date(t.closedAt).setHours(0, 0, 0, 0);
            return ['resolved', 'closed'].includes(t.status) && closedDate === today;
        });

        const resolvedTicketsWithTime = tickets.filter(t => t.timeToResolution !== null && t.timeToResolution !== undefined);
        const avgResolutionTime = resolvedTicketsWithTime.length > 0
            ? (resolvedTicketsWithTime.reduce((acc, t) => acc + parseFloat(t.timeToResolution), 0) / resolvedTicketsWithTime.length).toFixed(2)
            : 'N/A';

        return {
            total: tickets.length,
            open: openTickets.length,
            resolvedToday: resolvedToday.length,
            avgTime: avgResolutionTime,
        };
    }, [tickets]);

    const statCards = [
        { title: 'Total Tickets', value: stats.total, icon: <Ticket className="h-8 w-8 text-blue-500" /> },
        { title: 'Open Tickets', value: stats.open, icon: <BarChart3 className="h-8 w-8 text-yellow-500" /> },
        { title: 'Resolved Today', value: stats.resolvedToday, icon: <CheckCircle className="h-8 w-8 text-green-500" /> },
        { title: 'Avg. Resolution (Days)', value: stats.avgTime, icon: <Timer className="h-8 w-8 text-purple-500" /> },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {statCards.map((card, index) => (
                 <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-lg p-4 flex items-center"
                 >
                    <div className="p-3 bg-muted rounded-full mr-4">{card.icon}</div>
                    <div>
                        <p className="text-sm text-custom font-medium">{card.title}</p>
                        <p className="text-2xl font-bold font-heading">{card.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// --- Sub-Component: TicketListFilters ---
const TicketListFilters = ({ filters, setFilters }) => {
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    return (
        <div className="p-3 border-b border-border flex gap-3">
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring">
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="awaiting_user">Awaiting User</option>
                <option value="reopened">Reopened</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
            </select>
              <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring">
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
            </select>
        </div>
    );
};

// --- Sub-Component: TicketListItem ---
const TicketListItem = ({ ticket, isSelected, onSelect }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onSelect}
        className={`p-4 border-b border-border cursor-pointer hover:bg-muted ${isSelected ? 'bg-accent' : ''}`}
    >
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold font-heading text-md truncate pr-2 flex-1">{ticket.subject}</h3>
            {getPriorityBadge(ticket.priority)}
        </div>
        <div className="flex justify-between items-center text-sm text-custom">
            <span className="truncate pr-2">#{ticket.ticketId} by {ticket.user.fullName || ticket.user.username}</span>
            {getStatusBadge(ticket.status)}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex justify-between">
            <span>Assigned: {ticket.assignedTo?.username || 'Unassigned'}</span>
            <span>Last Update: {formatDate(ticket.updatedAt)}</span>
        </div>
    </motion.div>
);

// --- Sub-Component: TicketDetailsPanel ---
const TicketDetailsPanel = ({ ticket, agents, onBack }) => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const { loading: responseLoading } = useSelector((state) => state.supportTicket);
    const { bulkFileStatus } = useSelector((state) => state.upload);
    const fileInputRef = useRef(null);

    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    
    const handleDetailChange = (details) => {
        dispatch(updateTicketDetails({ ticketId: ticket.ticketId, details }));
    };
    
    const handleSendResponse = async (e) => {
        e.preventDefault();
        if (!message.trim() && attachments.length === 0) return;

        let uploadedAttachments = [];
        if (attachments.length > 0) {
            const uploadAction = await dispatch(uploadBulkFiles(attachments));
            if (uploadBulkFiles.fulfilled.match(uploadAction)) {
                // Adjust this mapping to your actual API response for file uploads
                uploadedAttachments = uploadAction.payload.data.map(f => ({ url: f.fileUrl, contentType: f.fileType }));
            } else return;
        }
        
        const responseData = { ticketId: ticket.ticketId, message, attachments: uploadedAttachments };
        const result = await dispatch(addAgentResponse(responseData));
        if (addAgentResponse.fulfilled.match(result)) {
            setMessage('');
            setAttachments([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="p-4 border-b border-border flex items-center justify-between">
                <div>
                     <h2 className="text-xl font-bold font-heading">{ticket.subject}</h2>
                    <p className="text-sm text-custom">Ticket #{ticket.ticketId}</p>
                </div>
                <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-muted">
                    <X size={20} />
                </button>
            </header>

            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow flex flex-col">
                      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                        {ticket.responses?.map((res, index) => (
                           <div key={index} className={`flex items-end gap-3 mb-6 ${res.user?._id === currentUser._id ? 'justify-end' : 'justify-start'}`}>
                                {res.user?._id !== currentUser._id && (
                                    res.isAIMessage ? (
                                     <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground self-start shrink-0"><RiRobot2Fill size={24} /></div>
                                    ) : (
                                     <img src={res.user?.profileInfo?.avatar || `https://ui-avatars.com/api/?name=${res.user?.fullName}`} alt="avatar" className="w-10 h-10 rounded-full object-cover self-start shrink-0" />
                                    )
                                )}
                                <div className={`max-w-lg p-3 rounded-xl ${res.user?._id === currentUser._id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm">{res.user?._id === currentUser._id ? 'You' : (res.isAIMessage ? 'AI Assistant' : res.user?.fullName)}</span>
                                        <span className="text-xs opacity-70">{formatDate(res.createdAt)}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words">{res.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <footer className="p-4 border-t border-border bg-card">
                          <form onSubmit={handleSendResponse} className="flex items-center gap-3">
                            <input type="file" multiple ref={fileInputRef} onChange={(e) => setAttachments(Array.from(e.target.files))} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-muted"><Paperclip size={20} /></button>
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your reply..." rows="1" className="flex-grow bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring" />
                            <button type="submit" disabled={responseLoading || bulkFileStatus === 'loading'} className="bg-primary text-primary-foreground p-3 rounded-full disabled:bg-opacity-50 flex items-center justify-center">
                                {responseLoading || bulkFileStatus === 'loading' ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </footer>
                </div>

                <aside className="w-64 border-l border-border p-4 flex-shrink-0 flex-col space-y-4 overflow-y-auto custom-scrollbar">
                    <h3 className="font-bold text-lg">Ticket Details</h3>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select value={ticket.status} onChange={(e) => handleDetailChange({ status: e.target.value })} className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring">
                            <option value="open">Open</option><option value="in-progress">In Progress</option><option value="awaiting_user">Awaiting User</option><option value="reopened">Reopened</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Priority</label>
                        <select value={ticket.priority} onChange={(e) => handleDetailChange({ priority: e.target.value })} className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring">
                           <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Assign To</label>
                         <select value={ticket.assignedTo?._id || ''} onChange={(e) => handleDetailChange({ assignedTo: e.target.value })} className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring">
                            <option value="">Unassigned</option>
                            {agents.map(agent => (
                                <option key={agent._id} value={agent._id}>{agent.fullName || agent.username}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                        <h4 className="font-bold mb-2">Ticket History</h4>
                         <ul className="space-y-3 text-sm">
                            {ticket.history?.map((h, i) => (
                                <li key={i}>
                                    <p><span className="font-semibold">{h.actor.username}</span> changed {h.change.field} from <span className="font-mono bg-muted px-1 rounded">{h.change.from}</span> to <span className="font-mono bg-muted px-1 rounded">{h.change.to}</span>.</p>
                                    <p className="text-xs text-custom">{formatDate(h.createdAt)}</p>
                                </li>
                            ))}
                             {ticket.history?.length === 0 && <p className="text-xs text-custom">No changes yet.</p>}
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AdminSupport;