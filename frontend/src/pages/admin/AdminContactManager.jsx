import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllContactMessages, updateContactStatus, addContactNote } from '../../store/redux/contactSlice';
import toast from 'react-hot-toast';
import { MessageSquareText, Mail, User, Clock, CheckCircle, XCircle, FileText, Plus, Edit, CornerUpLeft } from 'lucide-react';

// Modal variants for Framer Motion
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// Backdrop variants for Framer Motion
const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const AdminContactManager = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.contact);

  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    dispatch(getAllContactMessages());
  }, [dispatch]);

  const filteredMessages = messages.filter((msg) => {
    if (filterStatus === 'all') return true;
    return msg.status === filterStatus;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const openStatusModal = (message) => {
    setCurrentMessage(message);
    setNewStatus(message.status);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setCurrentMessage(null);
    setNewStatus('');
  };

  const handleStatusUpdate = async () => {
    if (currentMessage && newStatus) {
      await dispatch(updateContactStatus({ id: currentMessage._id, status: newStatus }));
      dispatch(getAllContactMessages()); // Refresh data
      closeStatusModal();
    }
  };

  const openNoteModal = (message) => {
    setCurrentMessage(message);
    setNewNote('');
    setIsNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
    setCurrentMessage(null);
    setNewNote('');
  };

  const handleAddNote = async () => {
    if (currentMessage && newNote.trim()) {
      await dispatch(addContactNote({ id: currentMessage._id, note: newNote }));
      dispatch(getAllContactMessages()); // Refresh data
      closeNoteModal();
    } else {
      toast.error('Note cannot be empty.');
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-body">
        <p className="text-lg text-primary">Loading contact messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-body">
        <p className="text-lg text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 font-body">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl mx-auto bg-card rounded-lg  shadow-md p-6 sm:p-8 lg:p-10"
      >
        <h1 className="text-4xl sm:text-5xl font-display text-primary leading-tight mb-8 tracking-tight text-center">
          Admin Contact Management
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex space-x-2">
            {['all', 'pending', 'in-progress', 'resolved', 'spam'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`py-2 px-4 rounded-sm  text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-muted'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground">Total Messages: {filteredMessages.length}</p>
        </div>

        <div className="overflow-x-auto custom-scrollbar rounded  border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Name {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('email')}
                >
                  <div className="flex items-center">
                    Email {getSortIcon('email')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('subject')}
                >
                  <div className="flex items-center">
                    Subject {getSortIcon('subject')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedMessages.length > 0 ? (
                sortedMessages.map((message) => (
                  <tr key={message._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {message.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {message.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-xs truncate">
                      <div className="flex items-center">
                        <MessageSquareText className="h-4 w-4 mr-2 text-muted-foreground" />
                        {message.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          message.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : message.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : message.status === 'resolved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}
                      >
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openStatusModal(message)}
                          className="text-primary hover:text-accent-foreground transition-colors"
                          title="Change Status"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => openNoteModal(message)}
                          className="text-primary hover:text-accent-foreground transition-colors"
                          title="Add Note"
                        >
                          <Plus size={20} />
                        </button>
                        <button
                          onClick={() => alert(`Full Message: ${message.message}\n\nInternal Notes: ${message.internalNotes.map(n => n.note).join('\n')}`)}
                          className="text-primary hover:text-accent-foreground transition-colors"
                          title="View Details"
                        >
                          <FileText size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-muted-foreground">
                    No contact messages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Status Update Modal */}
      <AnimatePresence>
        {isStatusModalOpen && currentMessage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeStatusModal}
          >
            <motion.div
              className="bg-card p-6 rounded-lg  shadow-2xl max-w-md w-full"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <h3 className="text-xl font-heading text-primary mb-4">Update Status for: {currentMessage.subject}</h3>
              <div className="mb-4">
                <label htmlFor="status-select" className="block text-sm font-medium text-muted-foreground mb-1">Select New Status</label>
                <select
                  id="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border border-border rounded  bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeStatusModal}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded  hover:bg-secondary-foreground hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded  hover:bg-opacity-90 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isNoteModalOpen && currentMessage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeNoteModal}
          >
            <motion.div
              className="bg-card p-6 rounded-lg  shadow-2xl max-w-md w-full"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-heading text-primary mb-4">Add Internal Note for: {currentMessage.subject}</h3>
              <div className="mb-4">
                <label htmlFor="note-textarea" className="block text-sm font-medium text-muted-foreground mb-1">Note</label>
                <textarea
                  id="note-textarea"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows="4"
                  className="w-full p-2 border border-border rounded  bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring custom-scrollbar"
                  placeholder="Type your note here..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeNoteModal}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded  hover:bg-secondary-foreground hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded  hover:bg-opacity-90 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminContactManager;
