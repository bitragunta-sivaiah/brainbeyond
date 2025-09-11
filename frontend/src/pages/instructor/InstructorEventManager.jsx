import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, MapPin, Globe, Clock, X, CloudUpload, Filter,User  } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../store/redux/eventSlice'; // Assuming this path
import { uploadSingleFile, clearSingleFileUpload } from '../../store/redux/uploadSlice'; // Assuming this path

// A simple modal component to handle creation and editing
const EventModal = ({ event, onClose, onSave, isEditing }) => {
  const dispatch = useDispatch();
  const { singleFile, singleFileStatus } = useSelector((state) => state.upload);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    isOnline: false,
    onlineLink: '',
    image: '', // This will hold the URL
    registrationRequired: false,
    registrationDeadline: '',
    maxAttendees: '',
    tags: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        isOnline: event.isOnline || false,
        onlineLink: event.onlineLink || '',
        image: event.image || '', // Initialize with existing image URL
        registrationRequired: event.registrationRequired || false,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '',
        maxAttendees: event.maxAttendees || '',
        tags: event.tags ? event.tags.join(', ') : '',
      });
    } else {
      // Clear form for new event creation
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        isOnline: false,
        onlineLink: '',
        image: '',
        registrationRequired: false,
        registrationDeadline: '',
        maxAttendees: '',
        tags: '',
      });
    }
  }, [event]);

  // Update formData.image when single file upload succeeds
  useEffect(() => {
    if (singleFileStatus === 'succeeded' && singleFile?.fileUrl) { // Safely access fileUrl
      setFormData((prev) => ({ ...prev, image: singleFile.fileUrl }));
      toast.success("Image uploaded successfully!");
    } else if (singleFileStatus === 'failed') {
      toast.error("Image upload failed!");
    }
  }, [singleFileStatus, singleFile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadSingleFile(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedData = {
      ...formData,
      tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : undefined,
      // Ensure image is included in formattedData, it's already set by useEffect
    };

    onSave(formattedData);
    dispatch(clearSingleFileUpload());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl p-6 bg-card rounded-xl shadow-md border border-border overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <h2 className="text-2xl font-bold font-heading">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleChange}
              className="rounded text-primary focus:ring-primary"
            />
            <label className="text-sm font-medium text-foreground">Is Online Event?</label>
          </div>
          {formData.isOnline ? (
            <div>
              <label className="block text-sm font-medium text-foreground">Online Link</label>
              <input
                type="url"
                name="onlineLink"
                value={formData.onlineLink}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="registrationRequired"
              checked={formData.registrationRequired}
              onChange={handleChange}
              className="rounded text-primary focus:ring-primary"
            />
            <label className="text-sm font-medium text-foreground">Registration Required?</label>
          </div>
          {formData.registrationRequired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Max Attendees</label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-input focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Event Image</label>
            <div className="mt-2 flex items-center gap-4">
              <label className="relative flex-1 block w-full border-2 border-dashed border-border p-6 rounded-lg text-center cursor-pointer hover:bg-muted transition-colors">
                <input type="file" onChange={handleFileChange} className="sr-only" />
                {singleFileStatus === 'loading' ? (
                  <div className="flex justify-center items-center">
                    <span className="animate-spin h-5 w-5 mr-3 border-4 border-t-primary rounded-full"></span>
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">
                      {formData.image ? 'Image selected' : 'Click to upload or drag and drop'}
                    </span>
                  </div>
                )}
              </label>
              {formData.image && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img src={formData.image} alt="Event" className="w-full h-full object-cover rounded-lg" />
                </div>
              )}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 mt-4 text-primary-foreground font-semibold rounded-md bg-primary hover:bg-primary/90 transition-colors"
            disabled={singleFileStatus === 'loading'}
          >
            {isEditing ? 'Save Changes' : 'Create Event'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// EventManager Component
const InstructorEventManager = () => {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth); // Assuming user is available in auth slice

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false); // New state for filtering

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Filter events based on showMyEventsOnly state
  const filteredEvents = showMyEventsOnly
    ? events.filter((event) => {
        // Safely get the organizer ID from the event, whether it's an object or a string
        const eventOrganizerId = event.organizer?._id || event.organizer;
        // Return true only if the logged-in user's ID exists and matches the event's organizer ID
        return user?._id && eventOrganizerId === user._id;
      })
    : events;

  const handleCreateEvent = (eventData) => {
    // Add organizer ID from logged-in user before dispatching
    const eventWithOrganizer = { ...eventData, organizer: user?._id };
    dispatch(createEvent(eventWithOrganizer));
    setIsModalOpen(false);
    setCurrentEvent(null);
  };

  const handleUpdateEvent = (eventData) => {
    dispatch(updateEvent({ eventId: currentEvent._id, eventData }));
    setIsModalOpen(false);
    setCurrentEvent(null);
  };

  const handleDeleteEvent = (eventId, eventOrganizerId) => {
    // Check if the logged-in user is the organizer of the event
    if (!user?._id || eventOrganizerId !== user._id) {
      alert("You can only delete your own events."); // Using alert for simplicity, consider a custom modal
      return;
    }
    if (window.confirm('Are you sure you want to delete this event?')) {
      dispatch(deleteEvent(eventId));
    }
  };

  const openEditModal = (event) => {
    // Get the organizer ID, handling both object and string formats
    const eventOrganizerId = event.organizer?._id || event.organizer;

    // Check if the logged-in user is the organizer of the event
    if (!user?._id || eventOrganizerId !== user._id) {
      alert("You can only edit your own events."); // Using alert for simplicity, consider a custom modal
      return;
    }
    setCurrentEvent(event);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentEvent(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEvent(null);
    dispatch(clearSingleFileUpload()); // Clear the upload state on modal close
  };

  return (
    <div className="container mx-auto p-6 font-body">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-display font-bold text-foreground">Event Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Event
        </motion.button>
      </div>

      <div className="flex items-center space-x-2 bg-input p-3 rounded-md shadow-sm border border-border max-w-xs mx-auto mb-6">
        <Filter size={20} className="text-muted-foreground" />
        <label htmlFor="showMyEventsOnly" className="text-sm font-medium text-foreground cursor-pointer flex-grow">
          Show only my events
        </label>
        <input
          type="checkbox"
          id="showMyEventsOnly"
          checked={showMyEventsOnly}
          onChange={() => setShowMyEventsOnly(!showMyEventsOnly)}
          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
        />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <EventModal
            event={currentEvent}
            onClose={handleCloseModal}
            onSave={currentEvent ? handleUpdateEvent : handleCreateEvent}
            isEditing={!!currentEvent}
          />
        )}
      </AnimatePresence>

      {loading && <div className="text-center py-8">Loading events...</div>}
      {error && <div className="text-center text-destructive py-8">Error: {error}</div>}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {showMyEventsOnly ? "You haven't created any events yet." : "No events available."}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEvents.map((event) => {
            const eventOrganizerId = event.organizer?._id || event.organizer;
            const isMyEvent = user?._id && eventOrganizerId === user._id;

            return (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-xl border border-border shadow-md overflow-hidden flex flex-col"
              >
                <div className="relative h-48">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow">
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-2">{event.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{event.description}</p>
                  <div className="space-y-2 text-sm text-secondary-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString()} -{' '}
                        {new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.isOnline ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <MapPin className="h-4 w-4 text-primary" />
                      )}
                      <span>{event.isOnline ? 'Online Event' : event.location}</span>
                    </div>
                    {/* Display organizer's name/username */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>
                        Organizer: {
                          event.organizer ?
                            (event.organizer.fullName || event.organizer.username || event.organizer.email || 'Unknown')
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  {isMyEvent && ( // Conditionally render edit button
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(event)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Edit ${event.title}`}
                    >
                      <Edit className="h-5 w-5" />
                    </motion.button>
                  )}
                  {isMyEvent && ( // Conditionally render delete button
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteEvent(event._id, eventOrganizerId)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete ${event.title}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InstructorEventManager;