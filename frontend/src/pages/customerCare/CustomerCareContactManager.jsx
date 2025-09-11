import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllContactMessages, updateContactStatus, addContactNote } from '../../store/redux/contactSlice';
import toast from 'react-hot-toast';
import { User, Mail, MessageSquareText, Clock, ChevronDown, ChevronUp, Plus, Edit, XCircle as CloseIcon } from 'lucide-react'; // Using XCircle as a close icon

// Card and modal animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const CustomerCareContactManager = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.contact);

  const [filterStatus, setFilterStatus] = useState('pending'); // Default to pending for customer care
  const [expandedMessageId, setExpandedMessageId] = useState(null);
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

  const toggleExpand = (id) => {
    setExpandedMessageId(expandedMessageId === id ? null : id);
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
        className="w-full max-w-4xl mx-auto bg-card rounded-lg  shadow-md p-6 sm:p-8 lg:p-10"
      >
        <h1 className="text-4xl sm:text-5xl font-display text-primary leading-tight mb-8 tracking-tight text-center">
          Customer Care Portal
        </h1>

        <div className="mb-6 flex flex-wrap justify-center sm:justify-start items-center space-x-2 space-y-2 sm:space-y-0">
            {['pending', 'in-progress', 'resolved', 'spam', 'all'].map((status) => (
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

        <div className="space-y-6">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <motion.div
                key={message._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-muted p-5 rounded  shadow-sm border border-border"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-heading text-foreground flex items-center">
                    <MessageSquareText className="h-5 w-5 mr-2 text-primary" />
                    {message.subject}
                  </h3>
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                </div>

                <div className="text-sm text-muted-foreground space-y-2 mb-4">
                  <p className="flex items-center"><User className="h-4 w-4 mr-2" /> <strong>From:</strong> {message.name} ({message.email})</p>
                  <p className="flex items-center"><Clock className="h-4 w-4 mr-2" /> <strong>Received:</strong> {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}</p>
                </div>

                <AnimatePresence>
                  {expandedMessageId === message._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <hr className="my-4 border-border" />
                      <p className="text-foreground mb-4">{message.message}</p>

                      {message.internalNotes && message.internalNotes.length > 0 && (
                        <div className="bg-card p-3 rounded-sm  mb-4">
                          <h4 className="text-sm font-semibold text-primary mb-2">Internal Notes:</h4>
                          {message.internalNotes.map((note, index) => (
                            <p key={index} className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium text-foreground">{note.notedBy?.username || 'Unknown User'}:</span> {note.note} <br/>
                              <span className="text-muted-foreground text-[0.65rem] italic">{new Date(note.notedAt).toLocaleString()}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          onClick={() => openStatusModal(message)}
                          className="px-4 py-2 bg-secondary text-secondary-foreground rounded  hover:bg-secondary-foreground hover:text-secondary transition-colors text-sm flex items-center"
                        >
                          <Edit size={16} className="mr-1" /> Status
                        </button>
                        <button
                          onClick={() => openNoteModal(message)}
                          className="px-4 py-2 bg-accent text-accent-foreground rounded  hover:bg-opacity-90 transition-colors text-sm flex items-center"
                        >
                          <Plus size={16} className="mr-1" /> Add Note
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => toggleExpand(message._id)}
                  className="w-full text-center py-2 mt-4 text-primary hover:text-accent-foreground transition-colors"
                >
                  {expandedMessageId === message._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-lg text-muted-foreground py-10">
              No {filterStatus !== 'all' ? filterStatus : ''} contact messages found.
            </p>
          )}
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
              onClick={(e) => e.stopPropagation()}
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

export default CustomerCareContactManager;
