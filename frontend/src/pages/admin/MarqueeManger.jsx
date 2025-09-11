import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdminMarqueeMessages,
  createMarqueeMessage,
  updateMarqueeMessage,
  deleteMarqueeMessage,
} from '../../store/redux/marqueeSlice'; // Adjust import path
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle,
  XCircle,
  Link,
  Calendar,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MarqueeManager = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.marquee);

  const [isEditing, setIsEditing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [formData, setFormData] = useState({
    message: '',
    link: '',
    isActive: true,
    startDate: '',
    endDate: '',
    priority: 0,
  });

  useEffect(() => {
    dispatch(fetchAdminMarqueeMessages());
  }, [dispatch]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format to YYYY-MM-DDTHH:mm
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.message) {
      toast.error('Marquee message is required.');
      return;
    }
    await dispatch(createMarqueeMessage(formData));
    handleCancelEdit();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.message) {
      toast.error('Marquee message is required.');
      return;
    }
    await dispatch(updateMarqueeMessage({ ...formData, _id: currentMessage._id }));
    handleCancelEdit();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this marquee message?')) {
      await dispatch(deleteMarqueeMessage(id));
    }
  };

  const handleEditClick = (message) => {
    setIsEditing(true);
    setCurrentMessage(message);
    setFormData({
      message: message.message,
      link: message.link || '',
      isActive: message.isActive,
      startDate: formatDate(message.startDate),
      endDate: formatDate(message.endDate),
      priority: message.priority,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentMessage(null);
    setFormData({
      message: '',
      link: '',
      isActive: true,
      startDate: '',
      endDate: '',
      priority: 0,
    });
  };

  if (loading && !messages.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-8 bg-background font-body text-foreground min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-heading">Marquee Manager</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Message</span>
            </button>
          )}
        </div>

        {/* Form for Creating/Editing Message */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-6 rounded-xl bg-card shadow-md border border-border overflow-hidden"
            >
              <h2 className="text-2xl font-heading mb-4">
                {currentMessage ? 'Edit Marquee Message' : 'Create New Marquee Message'}
              </h2>
              <form onSubmit={currentMessage ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <input
                    type="text"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Enter the message to display"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link (Optional)</label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g., https://hds.com/announcement"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">
                      Active
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{currentMessage ? 'Save Changes' : 'Create Message'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Marquee Message List */}
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative p-6 rounded-xl bg-card shadow-md border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-grow">
                  <p className="text-lg font-heading text-foreground">{message.message}</p>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Priority: {message.priority}</span>
                    </div>
                    {message.link && (
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        <a href={message.link} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline">
                          {message.link}
                        </a>
                      </div>
                    )}
                    {(message.startDate || message.endDate) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {message.startDate ? `From ${new Date(message.startDate).toLocaleDateString()}` : ''}
                          {message.endDate ? ` to ${new Date(message.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  {message.isActive ? (
                    <span className="flex items-center gap-1 text-accent-foreground text-sm">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive text-sm">
                      <XCircle className="w-4 h-4" /> Inactive
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-md text-muted-foreground hover:bg-muted"
                    onClick={() => handleEditClick(message)}
                    disabled={isEditing}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-md text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(message._id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground rounded-xl bg-card shadow-md border border-border">
              {loading ? 'Loading messages...' : 'No marquee messages found. Click "Add New Message" to create one.'}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MarqueeManager;