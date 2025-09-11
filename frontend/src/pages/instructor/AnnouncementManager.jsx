import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../store/redux/dataSlice';
import { fetchAllCourses } from '../../store/redux/courseSlice';
import { Plus, Edit, Trash, X, Calendar, User, BookOpen, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementManager = () => {
  const dispatch = useDispatch();
  const { announcements, status, error } = useSelector((state) => state.data);
  const { user } = useSelector((state) => state.auth);
  const { courses } = useSelector((state) => state.course);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [showMyAnnouncementsOnly, setShowMyAnnouncementsOnly] = useState(false); // New state for filtering

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: user?._id || '', // Safely set author ID from the logged-in user
    target: 'all',
    course: '', // This should store the course ID, not the object or title
    isActive: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });

  useEffect(() => {
    dispatch(fetchAnnouncements());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // Filter announcements based on showMyAnnouncementsOnly state
  const filteredAnnouncements = showMyAnnouncementsOnly
    ? announcements.filter((announcement) => {
        // Safely get the author ID from the announcement, whether it's an object or a string
        const announcementAuthorId = announcement.author?._id || announcement.author;
        // Return true only if the logged-in user's ID exists and matches the announcement's author ID
        return user?._id && announcementAuthorId === user._id;
      })
    : announcements;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentAnnouncement) {
      dispatch(updateAnnouncement({ id: currentAnnouncement._id, updatedAnnouncement: formData }));
    } else {
      dispatch(createAnnouncement(formData));
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleAddAnnouncement = () => {
    setCurrentAnnouncement(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditAnnouncement = (announcement) => {
    // Get the author ID, handling both object and string formats
    const announcementAuthorId = announcement.author?._id || announcement.author;

    // Check if the logged-in user is the author of the announcement
    if (!user?._id || announcementAuthorId !== user._id) {
      // If not the author, prevent editing (e.g., show a message or do nothing)
      alert("You can only edit your own announcements."); // Using alert for simplicity, consider a custom modal
      return;
    }

    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      author: typeof announcement.author === 'object' ? announcement.author._id : announcement.author,
      target: announcement.target,
      // Correctly set the course ID for formData if course is an object
      course: announcement.course?._id || '',
      isActive: announcement.isActive,
      startDate: new Date(announcement.startDate).toISOString().slice(0, 10),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 10) : '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = (id, announcementAuthorId) => {
    // Check if the logged-in user is the author of the announcement
    if (!user?._id || announcementAuthorId !== user._id) {
      // If not the author, prevent deletion
      alert("You can only delete your own announcements."); // Using alert for simplicity, consider a custom modal
      return;
    }

    if (window.confirm('Are you sure you want to delete this announcement?')) {
      dispatch(deleteAnnouncement(id));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      author: user?._id || '',
      target: 'all',
      course: '', // Reset course to an empty string (ID)
      isActive: true,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-display text-primary mb-8 text-center"
      >
        Announcement Manager
      </motion.h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-primary-foreground py-3 px-6 rounded-md shadow-md hover:bg-opacity-90 transition-all flex items-center gap-2"
          onClick={handleAddAnnouncement}
        >
          <Plus size={20} /> New Announcement
        </motion.button>

        <div className="flex items-center space-x-2 bg-input p-3 rounded-md shadow-sm border border-border">
          <Filter size={20} className="text-muted-foreground" />
          <label htmlFor="showMyAnnouncementsOnly" className="text-sm font-medium text-foreground cursor-pointer">
            Show only my announcements
          </label>
          <input
            type="checkbox"
            id="showMyAnnouncementsOnly"
            checked={showMyAnnouncementsOnly}
            onChange={() => setShowMyAnnouncementsOnly(!showMyAnnouncementsOnly)}
            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card p-6 md:p-8 rounded-2xl shadow-xl h-[90%] overflow-x-scroll max-w-xl w-full relative border border-border"
            >
              <button
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentAnnouncement(null);
                  resetForm();
                }}
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-heading text-primary mb-6">
                {currentAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4   ">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    required
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="target" className="block text-sm font-medium text-foreground mb-1">
                    Target Audience
                  </label>
                  <select
                    id="target"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="instructors">Instructors</option>
                    <option value="specific-course">Specific Course</option>
                  </select>
                </div>
                {formData.target === 'specific-course' && (
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-foreground mb-1">
                      Select Course
                    </label>
                    <select
                      id="course"
                      name="course"
                      value={formData.course} // This should be the course ID
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-foreground">
                    Active
                  </label>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3 rounded-md shadow-md hover:bg-opacity-90 transition-colors"
                >
                  {currentAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-3xl font-heading text-foreground mb-6 text-center">Current Announcements</h2>
      {status === 'loading' && <p className="text-center text-muted-foreground">Loading announcements...</p>}
      {status === 'failed' && <p className="text-center text-destructive">Error: {error}</p>}
      {status === 'succeeded' && filteredAnnouncements.length === 0 && (
        <p className="text-center text-muted-foreground">No announcements yet. Add one to get started!</p>
      )}
      {status === 'succeeded' && showMyAnnouncementsOnly && filteredAnnouncements.length === 0 && (
        <p className="text-center text-muted-foreground">You have not created any announcements yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAnnouncements.map((announcement) => {
            const announcementAuthorId = announcement.author?._id || announcement.author;
            const isMyAnnouncement = user?._id && announcementAuthorId === user._id;

            return (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                className="bg-card rounded-lg shadow-md p-6 border border-border relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-2 h-full ${announcement.isActive ? 'bg-primary' : 'bg-muted'}`}></div>
                <h3 className="text-xl font-heading text-card-foreground mb-2 pl-3">{announcement.title}</h3>
                <p className="text-muted-foreground mb-4 pl-3">{announcement.content}</p>
                <div className="flex items-center text-sm text-muted-foreground mb-2 pl-3">
                  <User size={16} className="mr-2 text-primary" />
                  <span>
                    Author: {
                      announcement.author ?
                        (announcement.author.fullName || announcement.author.username || announcement.author.email || 'Unknown')
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-2 pl-3">
                  <BookOpen size={16} className="mr-2 text-primary" />
                  <span>
                    Target: {announcement.target}
                    {/* Correctly access course title from the populated course object */}
                    {announcement.target === 'specific-course' &&
                      ` (${announcement.course?.title || 'Unknown Course'})`}
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-4 pl-3">
                  <Calendar size={16} className="mr-2 text-primary" />
                  <span>
                    Dates: {new Date(announcement.startDate).toLocaleDateString()}
                    {announcement.endDate && ` - ${new Date(announcement.endDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex justify-end gap-2 pl-3">
                  {isMyAnnouncement && ( // Conditionally render edit button
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-accent-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      <Edit size={20} />
                    </motion.button>
                  )}
                  {isMyAnnouncement && ( // Conditionally render delete button
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-destructive hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                      onClick={() => handleDeleteAnnouncement(announcement._id, announcementAuthorId)}
                    >
                      <Trash size={20} />
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

export default AnnouncementManager;
