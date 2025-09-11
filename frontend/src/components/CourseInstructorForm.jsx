import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCourse, updateCourse } from '../store/redux/courseContentSlice';
import { uploadSingleFile } from '../store/redux/uploadSlice';
import { X, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const CourseForm = ({ course, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { singleFileError } = useSelector(state => state.upload);

  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    thumbnail: '',
    previewVideo: '',
    category: 'Web Development',
    customCategoryName: '', // Initialize as empty string
    instructors: [],
    prerequisites: [],
    level: 'beginner',
    language: 'English',
    price: 0,
    discountedPrice: 0,
    isFree: false,
    isPublished: false,
    isIncludedInSubscription: false,
    tags: [],
  });

  // State for form validation errors
  const [errors, setErrors] = useState({});

  const [prereqInput, setPrereqInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [isPreviewVideoUploading, setIsPreviewVideoUploading] = useState(false);

  // Effect to populate form when 'course' prop changes (for editing)
  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        // Ensure instructors is an array of IDs
        instructors: course.instructors ? course.instructors.map(inst => inst._id || inst) : [],
        // Ensure customCategoryName is a string, even if null/undefined from backend
        customCategoryName: course.customCategoryName || '',
        isIncludedInSubscription: course.isIncludedInSubscription || false,
      });
    }
  }, [course]);

  // Effect to automatically set the current user as an instructor for new courses
  useEffect(() => {
    if (!course && user?._id) {
      setFormData(prev => ({
        ...prev,
        instructors: [user._id],
      }));
    } else if (course && user?._id && course.instructors.length === 0) {
      setFormData(prev => ({
        ...prev,
        instructors: [user._id],
      }));
    }
  }, [user, course]);


  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required.';
    if (!formData.thumbnail.trim()) newErrors.thumbnail = 'Thumbnail URL is required.';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative.';
    if (formData.discountedPrice < 0) newErrors.discountedPrice = 'Discounted price cannot be negative.';
   
    if (!formData.category.trim()) newErrors.category = 'Category is required.';
    // Check for customCategoryName only if category is 'Other' and it's too short after trimming
    if (formData.category === 'Other' && formData.customCategoryName.trim().length < 2) {
      newErrors.customCategoryName = 'Custom category name must be at least 2 characters.';
    }
    if (!formData.instructors || formData.instructors.length === 0) {
      newErrors.instructors = 'At least one instructor is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      const updatedFormData = { ...prev };

      if (name === 'isFree') {
        updatedFormData.isFree = checked;
        if (checked) {
          updatedFormData.price = 0;
          updatedFormData.discountedPrice = 0;
        }
      } else {
        updatedFormData[name] = type === 'checkbox' ? checked : value;
      }

      // Clear error for the field being changed
      if (errors[name]) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[name];
          return newErrors;
        });
      }

      return updatedFormData;
    });
  };

  const handlePrereqAdd = (e) => {
    if (e.key === 'Enter' && prereqInput.trim() !== '') {
      e.preventDefault();
      const newPrereq = prereqInput.trim();
      setFormData(prev => ({
        ...prev,
        prerequisites: [...new Set([...prev.prerequisites, newPrereq])],
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
      const newTag = tagInput.trim().toLowerCase();
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, newTag])],
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
     

    const courseDataToSend = { ...formData };

    // Process customCategoryName based on category selection
    if (formData.category === 'Other') {
        courseDataToSend.category = formData.customCategoryName.trim(); // Use trimmed custom category
    } else {
      // If category is not 'Other', ensure customCategoryName is not sent or is an empty string
      delete courseDataToSend.customCategoryName;
    }

    // IMPORTANT: Log the data being sent to the backend for detailed debugging
    console.log('Submitting Course Data:', courseDataToSend);

    if (course) {
      // This is the correct line that relies on the course._id prop
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
            <div className="flex flex-col">
              <label htmlFor="title" className="text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 'Advanced JavaScript'"
              />
              {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="shortDescription" className="text-sm font-medium mb-1">Short Description</label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="input"
                placeholder="A brief summary of the course"
              />
              {errors.shortDescription && <p className="text-destructive text-sm mt-1">{errors.shortDescription}</p>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="description" className="text-sm font-medium mb-1">Full Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea"
                rows="4"
                placeholder="A detailed description of the course content and goals"
              ></textarea>
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
            </div>
            {/* Thumbnail and Preview Video Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="thumbnail" className="text-sm font-medium mb-1">Thumbnail</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="thumbnail"
                    name="thumbnail"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'thumbnail')}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail"
                    className="button-outline flex items-center justify-center gap-2 cursor-pointer w-full"
                  >
                    {isThumbnailUploading ? 'Uploading...' : <><Upload size={16} /> Choose Image</>}
                  </label>
                </div>
                {formData.thumbnail && (
                  <div className="mt-2 text-sm text-green-600 truncate">
                    Uploaded: <a href={formData.thumbnail} target="_blank" rel="noopener noreferrer" className="underline">{formData.thumbnail}</a>
                  </div>
                )}
                {singleFileError && <p className="text-destructive text-sm mt-1">{singleFileError}</p>}
                {errors.thumbnail && <p className="text-destructive text-sm mt-1">{errors.thumbnail}</p>}
              </div>
              <div className="flex flex-col">
                <label htmlFor="previewVideo" className="text-sm font-medium mb-1">Preview Video</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="previewVideo"
                    name="previewVideo"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'previewVideo')}
                    className="hidden"
                  />
                  <label
                    htmlFor="previewVideo"
                    className="button-outline flex items-center justify-center gap-2 cursor-pointer w-full"
                  >
                    {isPreviewVideoUploading ? 'Uploading...' : <><Upload size={16} /> Choose Video</>}
                  </label>
                </div>
                {formData.previewVideo && (
                  <div className="mt-2 text-sm text-green-600 truncate">
                    Uploaded: <a href={formData.previewVideo} target="_blank" rel="noopener noreferrer" className="underline">{formData.previewVideo}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Categorization and Pricing */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold mb-2">Details & Pricing</h4>
            <div className="flex flex-col">
              <label htmlFor="category" className="text-sm font-medium mb-1">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Game Development">Game Development</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category}</p>}
            </div>
            {formData.category === 'Other' && (
              <div className="flex flex-col">
                <label htmlFor="customCategoryName" className="text-sm font-medium mb-1">Custom Category Name</label>
                <input
                  type="text"
                  id="customCategoryName"
                  name="customCategoryName"
                  value={formData.customCategoryName}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., 'Blockchain'"
                />
                {errors.customCategoryName && <p className="text-destructive text-sm mt-1">{errors.customCategoryName}</p>}
              </div>
            )}
            <div className="flex flex-col">
              <label htmlFor="level" className="text-sm font-medium mb-1">Level</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="input"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="language" className="text-sm font-medium mb-1">Language</label>
              <input
                type="text"
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 'English', 'Spanish'"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFree"
                name="isFree"
                checked={formData.isFree}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="isFree" className="text-sm font-medium">This is a free course</label>
            </div>
            {!formData.isFree && (
              <>
                <div className="flex flex-col">
                  <label htmlFor="price" className="text-sm font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="input"
                  />
                  {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
                </div>
                <div className="flex flex-col">
                  <label htmlFor="discountedPrice" className="text-sm font-medium mb-1">Discounted Price ($)</label>
                  <input
                    type="number"
                    id="discountedPrice"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleChange}
                    className="input"
                  />
                  {errors.discountedPrice && <p className="text-destructive text-sm mt-1">{errors.discountedPrice}</p>}
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="isPublished" className="text-sm font-medium">Publish this course</label>
            </div>
          </div>
          {/* Prerequisites and Tags */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold mb-2">Prerequisites & Tags</h4>
            <div className="flex flex-col">
              <label htmlFor="prerequisites" className="text-sm font-medium mb-1">Prerequisites</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={prereqInput}
                  onChange={(e) => setPrereqInput(e.target.value)}
                  onKeyDown={handlePrereqAdd}
                  className="input flex-grow"
                  placeholder="Type a prerequisite and press Enter"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.prerequisites.map((prereq, index) => (
                  <span key={index} className="badge">
                    {prereq}
                    <button type="button" onClick={() => handlePrereqRemove(prereq)} className="ml-1 text-xs">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="tags" className="text-sm font-medium mb-1">Tags</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  className="input flex-grow"
                  placeholder="Type a tag and press Enter"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="badge">
                    {tag}
                    <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 text-xs">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isIncludedInSubscription"
                name="isIncludedInSubscription"
                checked={formData.isIncludedInSubscription}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="isIncludedInSubscription" className="text-sm font-medium">Included in subscription plan</label>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
            >
              {course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CourseForm;