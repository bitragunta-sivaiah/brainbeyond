// CourseForm.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCourse, updateCourse } from '../store/redux/courseContentSlice';
import { fetchAllUsers } from '../store/redux/authSlice';
import { uploadSingleFile } from '../store/redux/uploadSlice';
import { X, Upload, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const CourseForm = ({ course, onClose }) => {
  const dispatch = useDispatch();
  const { users } = useSelector(state => state.auth);
  const { singleFileStatus, singleFileError } = useSelector(state => state.upload);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    thumbnail: '',
    previewVideo: '',
    category: 'Web Development',
    customCategoryName: '',
    instructors: [],
    prerequisites: [],
    level: 'beginner',
    language: 'English',
    price: 0,
    discountedPrice: 0,
    isFree: false,
    isPublished: false,
    isSubscriptionBased: false,
    tags: [],
  });

  const [prereqInput, setPrereqInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [isPreviewVideoUploading, setIsPreviewVideoUploading] = useState(false);

  // Memoize the user list and filter for instructors
  const instructors = useMemo(() => {
    return users.filter(user => user.role === 'instructor');
  }, [users]);

  // Fetch users only once when the component mounts
  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  // Correctly update form data when editing an existing course
  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        // Ensure instructors are an array of IDs
        instructors: course.instructors.map(i => i._id || i),
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isFree') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        price: checked ? 0 : prev.price,
        discountedPrice: checked ? 0 : prev.discountedPrice,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handlePrereqAdd = (e) => {
    if (e.key === 'Enter' && prereqInput.trim() !== '') {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prereqInput.trim()],
      }));
      setPrereqInput('');
    }
  };

  const handlePrereqRemove = (prereqToRemove) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(p => p !== prereqToRemove),
    }));
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const handleInstructorChange = (e) => {
    const { options } = e.target;
    const selectedInstructors = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedInstructors.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, instructors: selectedInstructors }));
  };

  // Use useCallback to memoize this function, preventing unnecessary re-creation
  const handleFileUpload = useCallback(async (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const isThumbnail = fieldName === 'thumbnail';
      const isVideo = fieldName === 'previewVideo';

      if (isThumbnail) setIsThumbnailUploading(true);
      if (isVideo) setIsPreviewVideoUploading(true);

      try {
        const result = await dispatch(uploadSingleFile(file)).unwrap();
        if (result) {
          setFormData(prev => ({
            ...prev,
            [fieldName]: result.url,
          }));
        }
      } catch (error) {
        console.error('File upload failed:', error);
      } finally {
        if (isThumbnail) setIsThumbnailUploading(false);
        if (isVideo) setIsPreviewVideoUploading(false);
      }
    }
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the customCategoryName if the category is 'Other'
    const courseDataToSend = formData.category === 'Other'
      ? { ...formData, category: formData.customCategoryName }
      : formData;

    if (course) {
      dispatch(updateCourse({ id: course._id, courseData: courseDataToSend }));
    } else {
      dispatch(createCourse(courseDataToSend));
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-card text-card-foreground rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-2xl font-bold font-heading">{course ? 'Edit Course' : 'Create New Course'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xl font-semibold mb-2">Basic Information</h4>
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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Short Description (Max 160 chars)</label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors min-h-[50px]"
                required
                maxLength={160}
              />
            </div>
          </div>

          <hr className="md:col-span-2 my-6 border-t border-border" />

          {/* Media and Content */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xl font-semibold mb-2">Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors flex-grow"
                    placeholder="Or paste a URL"
                  />
                  <input type="file" onChange={(e) => handleFileUpload(e, 'thumbnail')} className="hidden" id="thumbnail-upload" />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    <Upload size={16} />
                  </label>
                </div>
                {isThumbnailUploading && <p className="text-xs text-muted-foreground mt-1">Uploading thumbnail...</p>}
                {singleFileError && !isThumbnailUploading && <p className="text-xs text-destructive mt-1">{singleFileError}</p>}
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-24 h-auto rounded-lg object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preview Video URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="previewVideo"
                    value={formData.previewVideo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors flex-grow"
                    placeholder="Or paste a URL"
                  />
                  <input type="file" onChange={(e) => handleFileUpload(e, 'previewVideo')} className="hidden" id="preview-video-upload" />
                  <label htmlFor="preview-video-upload" className="cursor-pointer p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    <Upload size={16} />
                  </label>
                </div>
                {isPreviewVideoUploading && <p className="text-xs text-muted-foreground mt-1">Uploading video...</p>}
                {singleFileError && !isPreviewVideoUploading && <p className="text-xs text-destructive mt-1">{singleFileError}</p>}
                {formData.previewVideo && (
                  <div className="mt-2">
                    <video src={formData.previewVideo} controls className="w-full rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="md:col-span-2 my-6 border-t border-border" />

          {/* Category & Instructors */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xl font-semibold mb-2">Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors">
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
                {formData.category === 'Other' && (
                  <input
                    type="text"
                    name="customCategoryName"
                    value={formData.customCategoryName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors mt-2"
                    placeholder="Enter custom category name"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instructors</label>
                <select
                  name="instructors"
                  multiple
                  value={formData.instructors}
                  onChange={handleInstructorChange}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors min-h-[100px]"
                  required
                >
                  {instructors.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <select name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="md:col-span-2 my-6 border-t border-border" />

          {/* Prerequisites & Tags */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prerequisites</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={prereqInput}
                  onChange={(e) => setPrereqInput(e.target.value)}
                  onKeyDown={handlePrereqAdd}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors flex-grow"
                  placeholder="Type and press Enter to add"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.prerequisites.map((prereq, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted-foreground text-muted whitespace-nowrap">
                    {prereq}
                    <button type="button" onClick={() => handlePrereqRemove(prereq)} className="ml-1 -mr-1 p-1 rounded-full hover:bg-muted-foreground/80 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors flex-grow"
                  placeholder="Type and press Enter to add"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted-foreground text-muted whitespace-nowrap">
                    {tag}
                    <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 -mr-1 p-1 rounded-full hover:bg-muted-foreground/80 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <hr className="md:col-span-2 my-6 border-t border-border" />

          {/* Price & Status */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xl font-semibold mb-2">Pricing & Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  required
                  min="0"
                  disabled={formData.isFree}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discounted Price</label>
                <input
                  type="number"
                  name="discountedPrice"
                  value={formData.discountedPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                  disabled={formData.isFree}
                />
              </div>
              <div className="flex flex-col gap-2 mt-2 md:mt-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                  />
                  <label className="ml-2 text-sm font-medium">Free Course</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                  />
                  <label className="ml-2 text-sm font-medium">Publish Now</label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isSubscriptionBased"
                checked={formData.isSubscriptionBased}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
              />
              <label className="text-sm font-medium">Subscription Based</label>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 mt-6">
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
              disabled={isThumbnailUploading || isPreviewVideoUploading}
            >
              {(isThumbnailUploading || isPreviewVideoUploading) ? 'Uploading...' : (course ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CourseForm;