// src/components/AdsAndAnnouncementsManager.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAds,
  createAd,
  updateAd,
  deleteAd,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../store/redux/dataSlice';
import { uploadSingleFile, deleteFile } from '../../store/redux/uploadSlice';
import { fetchAllCourses } from '../../store/redux/courseSlice';
import {
  Plus,
  Trash2,
  Pen,
  X,
  Image as ImageIcon,
  ExternalLink,
  Info,
  CalendarDays,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl p-6 bg-card rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
          <h3 className="mb-4 text-2xl font-semibold text-foreground">{title}</h3>
          <div className="overflow-y-auto max-h-[80vh]">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Reusable Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="flex justify-end mt-6 space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 font-medium text-foreground bg-muted rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="px-4 py-2 font-medium text-destructive-foreground bg-destructive rounded-md hover:opacity-90 transition-opacity"
          >
            Delete
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

const AdsAndAnnouncementsManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { ads, announcements, status } = useSelector((state) => state.data);
  const { singleFileStatus } = useSelector((state) => state.upload);
  const { courses } = useSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState('ads');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isAdImageUploading, setIsAdImageUploading] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    image: '',
    link: '',
    position: 'homepage-top',
    isActive: true,
    startDate: '',
    endDate: '',
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    author: user?._id,
    target: 'all',
    course: '',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    dispatch(fetchAds());
    dispatch(fetchAnnouncements());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // Handle Form Changes
  const handleAdFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdForm({ ...adForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAnnouncementFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAnnouncementForm({ ...announcementForm, [name]: type === 'checkbox' ? checked : value });
  };

  // Handle Image Upload - CORRECTED LOGIC
  const handleAdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsAdImageUploading(true);
      const result = await dispatch(uploadSingleFile(file)).unwrap();
      // Check if the result and its nested 'data' property exist
      if (result && result.fileUrl) {
        setAdForm((prev) => ({ ...prev, image: result.fileUrl }));
      } else {
        toast.error("Failed to get image URL from upload response.");
      }
      setIsAdImageUploading(false);
    }
  };

  // Open/Close Ad Modal
  const openAdModal = (type, item = null) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setCurrentItem(item);
      setAdForm({
        title: item.title,
        image: item.image,
        link: item.link,
        position: item.position,
        isActive: item.isActive,
        startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
        endDate: item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setAdForm({
        title: '',
        image: '',
        link: '',
        position: 'homepage-top',
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
    setIsAdModalOpen(true);
  };

  const closeAdModal = () => {
    setIsAdModalOpen(false);
    setCurrentItem(null);
  };

  // Handle Ad Form Submission
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (modalType === 'create') {
      await dispatch(createAd(adForm));
    } else {
      await dispatch(updateAd({ id: currentItem._id, updatedAd: adForm }));
    }
    closeAdModal();
  };

  // Open/Close Announcement Modal
  const openAnnouncementModal = (type, item = null) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setCurrentItem(item);
      setAnnouncementForm({
        title: item.title,
        content: item.content,
        author: item.author?._id,
        target: item.target,
        course: item.course?._id || '',
        isActive: item.isActive,
        startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
        endDate: item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setAnnouncementForm({
        title: '',
        content: '',
        author: user?._id,
        target: 'all',
        course: '',
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  const closeAnnouncementModal = () => {
    setIsAnnouncementModalOpen(false);
    setCurrentItem(null);
  };

  // Handle Announcement Form Submission
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (modalType === 'create') {
      await dispatch(createAnnouncement(announcementForm));
    } else {
      await dispatch(updateAnnouncement({ id: currentItem._id, updatedAnnouncement: announcementForm }));
    }
    closeAnnouncementModal();
  };

  // Handle Deletion
  const handleDeleteItem = (item, type) => {
    setItemToDelete({ ...item, type });
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete.type === 'ad') {
      const publicId = itemToDelete.image.split('/').pop().split('.')[0];
      await dispatch(deleteFile(publicId));
      await dispatch(deleteAd(itemToDelete._id));
    } else {
      await dispatch(deleteAnnouncement(itemToDelete._id));
    }
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="p-8 bg-background min-h-screen font-body">
      <h1 className="mb-8 text-4xl font-heading text-foreground">Ads & Announcements Manager</h1>

      {/* Tab Navigation */}
      <div className="flex mb-8 space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setActiveTab('ads')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'ads'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-secondary'
          }`}
        >
          Ads
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setActiveTab('announcements')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'announcements'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-secondary'
          }`}
        >
          Announcements
        </motion.button>
      </div>

      <hr className="my-8 border-border" />

      {/* Ads Management Section */}
      <AnimatePresence mode="wait">
        {activeTab === 'ads' && (
          <motion.div
            key="ads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-heading text-foreground">Active Ads 📣</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAdModal('create')}
                className="flex items-center px-4 py-2 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90"
              >
                <Plus size={20} className="mr-2" /> New Ad
              </motion.button>
            </div>

            {status === 'loading' && <p className="text-center text-muted-foreground">Loading ads...</p>}
            {status === 'failed' && <p className="text-center text-destructive">Failed to load ads. Please try again.</p>}

            {status === 'succeeded' && ads.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => (
                  <motion.div
                    key={ad._id}
                    className="p-6 transition-transform transform bg-card rounded-xl shadow-md border border-border"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative mb-4 overflow-hidden rounded-lg aspect-video">
                      <img src={ad.image} alt={ad.title} className="object-cover w-full h-full" />
                      <div className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
                        {ad.position}
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-heading text-foreground">{ad.title}</h3>
                    <div className="flex items-center mb-2 text-sm text-muted-foreground">
                      <CalendarDays size={16} className="mr-2" />
                      <span>
                        {ad.startDate ? format(new Date(ad.startDate), 'MMM dd, yyyy') : 'No Start Date'}
                        {' - '}
                        {ad.endDate ? format(new Date(ad.endDate), 'MMM dd, yyyy') : 'No End Date'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="flex items-center mr-4">
                          <Info size={16} className="mr-1" /> {ad.impressions || 0} Impressions
                        </span>
                        <span className="flex items-center">
                          <ExternalLink size={16} className="mr-1" /> {ad.clicks || 0} Clicks
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openAdModal('edit', ad)}
                          className="p-2 text-primary hover:text-primary/70"
                        >
                          <Pen size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteItem(ad, 'ad')}
                          className="p-2 text-destructive hover:text-destructive/70"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              status === 'succeeded' && <p className="text-center text-muted-foreground">No ads found. Create one to get started! 🚀</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="my-8 border-border" />

      {/* Announcements Management Section */}
      <AnimatePresence mode="wait">
        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-heading text-foreground">Announcements 📢</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAnnouncementModal('create')}
                className="flex items-center px-4 py-2 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90"
              >
                <Plus size={20} className="mr-2" /> New Announcement
              </motion.button>
            </div>

            {status === 'loading' && <p className="text-center text-muted-foreground">Loading announcements...</p>}
            {status === 'failed' && <p className="text-center text-destructive">Failed to load announcements. Please try again.</p>}

            {status === 'succeeded' && announcements.length > 0 ? (
              <div className="  rounded-xl">
                <table className="w-full table-auto text-left rounded-xl overflow-hidden bg-card border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Title</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Target</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Author</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Active</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Dates</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((announcement) => (
                      <tr key={announcement._id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium text-foreground">{announcement.title}</td>
                        <td className="px-6 py-4 capitalize text-muted-foreground">{announcement.target.replace('-', ' ')}</td>
                        <td className="px-6 py-4 text-muted-foreground">{announcement.author?.username || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              announcement.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                            }`}
                          >
                            {announcement.isActive ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {announcement.startDate && format(new Date(announcement.startDate), 'MMM dd, yyyy')}
                          {announcement.endDate && ` - ${format(new Date(announcement.endDate), 'MMM dd, yyyy')}`}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openAnnouncementModal('edit', announcement)}
                              className="p-2 text-primary hover:text-primary/70"
                            >
                              <Pen size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteItem(announcement, 'announcement')}
                              className="p-2 text-destructive hover:text-destructive/70"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              status === 'succeeded' && <p className="text-center text-muted-foreground">No announcements found. Create one to notify your users! 📢</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Creation/Edit Modal */}
      <Modal isOpen={isAdModalOpen} onClose={closeAdModal} title={modalType === 'create' ? 'Create New Ad' : 'Edit Ad'}>
        <form onSubmit={handleAdSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                name="title"
                value={adForm.title}
                onChange={handleAdFormChange}
                required
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Link URL</label>
              <input
                type="url"
                name="link"
                value={adForm.link}
                onChange={handleAdFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium text-muted-foreground">Ad Image</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                onChange={handleAdImageUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {isAdImageUploading && <p className="text-sm text-primary">Uploading...</p>}
            </div>
            {adForm.image && (
              <div className="mt-4 overflow-hidden border rounded-md aspect-video border-border">
                <img src={adForm.image} alt="Ad Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Position</label>
              <select
                name="position"
                value={adForm.position}
                onChange={handleAdFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="homepage-top">Homepage Top</option>
                <option value="homepage-side">Homepage Side</option>
                <option value="course-side">Course Side</option>
                <option value="article-bottom">Article Bottom</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input
                id="adIsActive"
                type="checkbox"
                name="isActive"
                checked={adForm.isActive}
                onChange={handleAdFormChange}
                className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
              />
              <label htmlFor="adIsActive" className="ml-2 font-medium text-muted-foreground">
                Is Active
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={adForm.startDate}
                onChange={handleAdFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                name="endDate"
                value={adForm.endDate}
                onChange={handleAdFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={closeAdModal}
              className="px-6 py-3 font-medium text-foreground bg-muted rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors"
              disabled={singleFileStatus === 'loading'}
            >
              {modalType === 'create' ? 'Create Ad' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Announcement Creation/Edit Modal */}
      <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={closeAnnouncementModal}
        title={modalType === 'create' ? 'Create New Announcement' : 'Edit Announcement'}
      >
        <form onSubmit={handleAnnouncementSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              name="title"
              value={announcementForm.title}
              onChange={handleAnnouncementFormChange}
              required
              className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-muted-foreground">Content</label>
            <textarea
              name="content"
              value={announcementForm.content}
              onChange={handleAnnouncementFormChange}
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Target Audience</label>
              <select
                name="target"
                value={announcementForm.target}
                onChange={handleAnnouncementFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="instructors">Instructors</option>
                <option value="specific-course">Specific Course</option>
              </select>
            </div>
            {announcementForm.target === 'specific-course' && (
              <div>
                <label className="block mb-2 font-medium text-muted-foreground">Select Course</label>
                <select
                  name="course"
                  value={announcementForm.course}
                  onChange={handleAnnouncementFormChange}
                  required
                  className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="">-- Select a Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={announcementForm.startDate}
                onChange={handleAnnouncementFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                name="endDate"
                value={announcementForm.endDate}
                onChange={handleAnnouncementFormChange}
                className="w-full px-4 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={closeAnnouncementModal}
              className="px-6 py-3 font-medium text-foreground bg-muted rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 font-medium text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors"
            >
              {modalType === 'create' ? 'Create Announcement' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title={`Delete ${itemToDelete?.type === 'ad' ? 'Ad' : 'Announcement'}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
      />
    </div>
  );
};

export default AdsAndAnnouncementsManager;