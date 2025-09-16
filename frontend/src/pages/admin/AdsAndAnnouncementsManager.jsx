// src/components/AdsAndAnnouncementsManager.jsx

import React, {useState, useEffect, useCallback }from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAds, createAd, updateAd, deleteAd,
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} from '../../store/redux/dataSlice';
import { uploadSingleFile, deleteFile } from '../../store/redux/uploadSlice';
import { fetchAllCourses } from '../../store/redux/courseSlice';
import { Plus, Trash2, Pen, X, Loader2, Image as ImageIcon, ExternalLink, Info, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="relative w-full max-w-2xl bg-card rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Reusable Confirmation Dialog Component ---
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex justify-end mt-6 space-x-4">
        <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 font-medium text-foreground bg-muted rounded-md hover:bg-secondary transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isDeleting} className="flex items-center justify-center w-28 px-4 py-2 font-medium text-destructive-foreground bg-destructive rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
        </button>
      </div>
    </Modal>
  );
};

// --- Main Manager Component ---
const AdsAndAnnouncementsManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { ads, announcements, status: dataStatus, error: dataError } = useSelector((state) => state.data);
  const { status: uploadStatus } = useSelector((state) => state.upload);
  const { courses } = useSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState('ads');
  
  const [modalState, setModalState] = useState({ isOpen: false, type: 'ad', mode: 'create', data: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, item: null, isDeleting: false });
  const [formData, setFormData] = useState({});

  const initialAdForm = { title: '', image: '', publicId: '', link: '', position: 'homepage-top', isActive: true, startDate: '', endDate: '' };
  const initialAnnouncementForm = { title: '', content: '', author: user?._id, target: 'all', course: '', isActive: true, startDate: '', endDate: '' };

  useEffect(() => {
    if (dataStatus === 'idle') {
      dispatch(fetchAds());
      dispatch(fetchAnnouncements());
      dispatch(fetchAllCourses());
    }
  }, [dispatch, dataStatus]);

  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleAdImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await dispatch(uploadSingleFile(file)).unwrap();
      if (result?.fileUrl && result?.publicId) {
        setFormData(prev => ({ ...prev, image: result.fileUrl, publicId: result.publicId }));
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Upload response was invalid.");
      }
    } catch (error) {
      toast.error(error.message || "Image upload failed.");
    }
  };

  const openModal = useCallback((type, mode, item = null) => {
    setModalState({ isOpen: true, type, mode, data: item });
    if (type === 'ad') {
      setFormData(item ? {
        ...item,
        startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
        endDate: item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : '',
      } : initialAdForm);
    } else { // announcement
      setFormData(item ? {
        ...item,
        course: item.course?._id || '',
        author: item.author?._id,
        startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
        endDate: item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : '',
      } : { ...initialAnnouncementForm, author: user?._id });
    }
  }, [user?._id]);

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'ad', mode: 'create', data: null });
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, mode, data } = modalState;

    const action = mode === 'create'
      ? (type === 'ad' ? createAd : createAnnouncement)
      : (type === 'ad' ? updateAd : updateAnnouncement);

    const payload = mode === 'create'
      ? formData
      : { id: data._id, [type === 'ad' ? 'updatedAd' : 'updatedAnnouncement']: formData };

    const promise = dispatch(action(payload)).unwrap();
    toast.promise(promise, {
      loading: `${mode === 'create' ? 'Creating' : 'Updating'}...`,
      success: `${type === 'ad' ? 'Ad' : 'Announcement'} saved successfully!`,
      error: (err) => err.message || `Failed to save ${type}.`,
    });

    try {
      await promise;
      closeModal();
    } catch (error) {
      // Error is handled by toast
    }
  };

  const openConfirmDialog = (item, type) => {
    setConfirmState({ isOpen: true, item: { ...item, type }, isDeleting: false });
  };

  const closeConfirmDialog = () => {
    setConfirmState({ isOpen: false, item: null, isDeleting: false });
  };

  const confirmDelete = async () => {
    if (!confirmState.item) return;
    setConfirmState(prev => ({ ...prev, isDeleting: true }));

    const { _id, type, publicId } = confirmState.item;

    try {
      if (type === 'ad' && publicId) {
        // Only attempt to delete file if publicId exists
        await dispatch(deleteFile(publicId)).unwrap();
      }
      
      const deleteAction = type === 'ad' ? deleteAd(_id) : deleteAnnouncement(_id);
      await dispatch(deleteAction).unwrap();

      toast.success(`${type === 'ad' ? 'Ad' : 'Announcement'} deleted successfully.`);
      closeConfirmDialog();
    } catch (error) {
      toast.error(error.message || `Failed to delete ${type}.`);
      setConfirmState(prev => ({ ...prev, isDeleting: false }));
    }
  };
  
  const renderContent = () => {
    if (dataStatus === 'loading') {
      return <div className="flex justify-center items-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }
    if (dataStatus === 'failed') {
      return <p className="text-center text-destructive p-12">Error: {dataError}</p>;
    }

    if (activeTab === 'ads') {
      return ads.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <motion.div
              key={ad._id}
              className="bg-card rounded-xl shadow-md border border-border overflow-hidden flex flex-col"
              layout
            >
              <div className="relative">
                <img src={ad.image} alt={ad.title} className="object-cover w-full h-40" />
                <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${ad.isActive ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {ad.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">{ad.position}</span>
                <h3 className="my-2 text-lg font-bold text-foreground">{ad.title}</h3>
                <div className="text-xs text-muted-foreground mt-auto space-y-2">
                    <div className="flex items-center"><CalendarDays size={14} className="mr-2" />{format(new Date(ad.startDate), 'MMM dd, yyyy')} - {ad.endDate ? format(new Date(ad.endDate), 'MMM dd, yyyy') : 'Ongoing'}</div>
                    <div className="flex items-center"><Info size={14} className="mr-2" />{ad.impressions || 0} Impressions</div>
                    <div className="flex items-center"><ExternalLink size={14} className="mr-2" />{ad.clicks || 0} Clicks</div>
                </div>
              </div>
              <div className="flex items-center justify-end p-2 bg-muted/50 space-x-1">
                <button onClick={() => openModal('ad', 'edit', ad)} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors"><Pen size={16} /></button>
                <button onClick={() => openConfirmDialog(ad, 'ad')} className="p-2 text-muted-foreground hover:text-destructive rounded-full transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : <div className="text-center text-muted-foreground py-12">No ads found. Create one to get started! 🚀</div>;
    }

    if (activeTab === 'announcements') {
      return announcements.length > 0 ? (
        <div className="rounded-lg overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Title</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Target</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Dates</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {announcements.map((ann) => (
                <tr key={ann._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{ann.title}</td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">{ann.target === 'specific-course' ? ann.course?.title || 'Specific Course' : ann.target}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ann.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {ann.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(ann.startDate), 'MMM dd, yyyy')} - {ann.endDate ? format(new Date(ann.endDate), 'MMM dd, yyyy') : 'Ongoing'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => openModal('announcement', 'edit', ann)} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors"><Pen size={16} /></button>
                      <button onClick={() => openConfirmDialog(ann, 'announcement')} className="p-2 text-muted-foreground hover:text-destructive rounded-full transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center text-muted-foreground py-12">No announcements found. 📢</div>;
    }
    return null;
  };


  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Ads & Announcements</h1>

      <div className="flex mb-6 border-b border-border">
        <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'ads' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>Ads</button>
        <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'announcements' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>Announcements</button>
      </div>

      <div className="min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground capitalize">{activeTab}</h2>
          <button onClick={() => openModal(activeTab.slice(0, -1), 'create')} className="flex items-center px-4 py-2 font-medium text-sm text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors">
            <Plus size={18} className="mr-2" /> New {activeTab === 'ads' ? 'Ad' : 'Announcement'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={`${modalState.mode === 'create' ? 'Create' : 'Edit'} ${modalState.type === 'ad' ? 'Ad' : 'Announcement'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- CONDITIONAL FORM FIELDS --- */}
          {modalState.type === 'ad' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                <input required type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Link URL (Optional)</label>
                <input type="url" name="link" value={formData.link || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Ad Image</label>
                <input required={formData.image ? false : true} type="file" name="imageFile" accept="image/*" onChange={handleAdImageUpload} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                {uploadStatus === 'loading' && <p className="text-sm text-primary mt-2">Uploading...</p>}
                {formData.image && <img src={formData.image} alt="Preview" className="mt-4 rounded-md border border-border w-full h-auto max-h-48 object-contain" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Position</label>
                  <select name="position" value={formData.position || 'homepage-top'} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none">
                    <option value="homepage-top">Homepage Top</option>
                    <option value="homepage-side">Homepage Side</option>
                    <option value="course-side">Course Side</option>
                    <option value="article-bottom">Article Bottom</option>
                    <option value="enroll-course">Enroll Course</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input id="adIsActive" type="checkbox" name="isActive" checked={formData.isActive || false} onChange={handleFormChange} className="w-4 h-4 text-primary rounded border-border focus:ring-primary" />
                    <label htmlFor="adIsActive" className="font-medium text-muted-foreground">Active</label>
                  </div>
                </div>
              </div>
            </>
          )}

          {modalState.type === 'announcement' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                <input required type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Content</label>
                <textarea required name="content" value={formData.content || ''} onChange={handleFormChange} rows="4" className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Target Audience</label>
                  <select name="target" value={formData.target || 'all'} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none">
                    <option value="all">All Users</option>
                    <option value="students">Students</option>
                    <option value="instructors">Instructors</option>
                    <option value="specific-course">Specific Course</option>
                  </select>
                </div>
                {formData.target === 'specific-course' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Select Course</label>
                    <select required name="course" value={formData.course || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none">
                      <option value="">-- Select --</option>
                      {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* --- COMMON FORM FIELDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
              <input required type="date" name="startDate" value={formData.startDate || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">End Date (Optional)</label>
              <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md bg-input text-foreground border-border focus:ring-1 focus:ring-ring focus:outline-none" />
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-4 border-t border-border">
            <button type="button" onClick={closeModal} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-md hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={uploadStatus === 'loading'} className="flex items-center justify-center w-40 px-4 py-2 font-semibold text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {uploadStatus === 'loading' ? <Loader2 size={20} className="animate-spin" /> : (modalState.mode === 'create' ? 'Create' : 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title={`Delete ${confirmState.item?.type === 'ad' ? 'Ad' : 'Announcement'}`}
        message={`Are you sure you want to permanently delete this ${confirmState.item?.type}? This action cannot be undone.`}
        isDeleting={confirmState.isDeleting}
      />
    </div>
  );
};

export default AdsAndAnnouncementsManager;