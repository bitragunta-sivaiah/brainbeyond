// ChapterForm.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createChapter, updateChapter } from '../store/redux/courseContentSlice';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast'; // Import toast for consistent feedback

const ChapterForm = ({ chapter, courseId, onClose }) => {
  const dispatch = useDispatch();
  
  // Set initial state based on whether a chapter is being edited or created
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isFree: false,
  });

  // Use an effect hook to update the form data if the `chapter` prop changes
  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || '',
        description: chapter.description || '',
        isFree: chapter.isFree || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        isFree: false,
      });
    }
  }, [chapter]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Chapter title is required.");
      return;
    }

    try {
      if (chapter) {
        await dispatch(updateChapter({ id: chapter._id, chapterData: formData })).unwrap();
        toast.success("Chapter updated successfully!");
      } else {
        await dispatch(createChapter({ courseId, chapterData: formData })).unwrap();
        toast.success("Chapter created successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Failed to submit chapter:", error);
      toast.error(error.message || `Failed to ${chapter ? 'update' : 'create'} chapter.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-card text-card-foreground rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-2xl font-bold font-heading">{chapter ? 'Edit Chapter' : 'Create New Chapter'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors min-h-[100px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleChange}
              className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
            />
            <label className="text-sm font-medium">Free Chapter</label>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              {chapter ? 'Update Chapter' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ChapterForm;
