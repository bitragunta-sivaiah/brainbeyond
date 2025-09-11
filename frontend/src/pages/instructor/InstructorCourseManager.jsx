import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../store/redux/courseContentSlice";
import {
  uploadSingleFile,
  deleteFile,
  clearUploadState,
} from "../../store/redux/uploadSlice";
import {
  X,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InstructorCourseManager = () => {
  const dispatch = useDispatch();
  const { courses, loading, error } = useSelector((state) => state.courseContent);
  const { user: currentUser } = useSelector((state) => state.auth);

  const { singleFile, singleFileStatus, deleteStatus } = useSelector((state) => state.upload);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const [thumbnailData, setThumbnailData] = useState(null);
  const [previewVideoData, setPreviewVideoData] = useState(null);
  const [currentFileUploadType, setCurrentFileUploadType] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    thumbnail: "",
    previewVideo: "",
    category: "",
    customCategoryName: "",
    prerequisites: [],
    level: "beginner",
    language: "English",
    duration: 0,
    price: 0,
    discountedPrice: 0,
    isFree: false,
    isPublished: false,
    tags: [],
  });

  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [thumbnailSource, setThumbnailSource] = useState("url");
  const [previewVideoSource, setPreviewVideoSource] = useState("url");

  const categories = [
    "Web Development",
    "Data Science",
    "Mobile Development",
    "Design",
    "Marketing",
    "Other",
  ];

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (singleFileStatus === "succeeded" && singleFile && currentFileUploadType) {
      if (currentFileUploadType === "thumbnail") {
        setFormData((prev) => ({ ...prev, thumbnail: singleFile.fileUrl }));
        setThumbnailData({ publicId: singleFile.publicId, fileUrl: singleFile.fileUrl });
      } else if (currentFileUploadType === "previewVideo") {
        setFormData((prev) => ({ ...prev, previewVideo: singleFile.fileUrl }));
        setPreviewVideoData({ publicId: singleFile.publicId, fileUrl: singleFile.fileUrl });
      }
      setCurrentFileUploadType(null);
    }
  }, [singleFile, singleFileStatus, currentFileUploadType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePrerequisiteAdd = (e) => {
    e.preventDefault();
    if (prerequisiteInput.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()],
      }));
      setPrerequisiteInput("");
    }
  };

  const handlePrerequisiteRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index),
    }));
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadSingleFile(file));
      setCurrentFileUploadType(fileType);
    }
  };

  const handleFileDelete = (publicId, fieldType) => {
    if (!publicId) return;
    dispatch(deleteFile(publicId));

    if (fieldType === "thumbnail") {
      setFormData((prev) => ({ ...prev, thumbnail: "" }));
      setThumbnailData(null);
    } else if (fieldType === "previewVideo") {
      setFormData((prev) => ({ ...prev, previewVideo: "" }));
      setPreviewVideoData(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      description: "",
      thumbnail: "",
      previewVideo: "",
      category: "",
      customCategoryName: "",
      prerequisites: [],
      level: "beginner",
      language: "English",
      duration: 0,
      price: 0,
      discountedPrice: 0,
      isFree: false,
      isPublished: false,
      tags: [],
    });
    setPrerequisiteInput("");
    setTagInput("");
    setThumbnailSource("url");
    setPreviewVideoSource("url");
    setThumbnailData(null);
    setPreviewVideoData(null);
    setCurrentCourse(null);
    setIsEditMode(false);
  };

  const openModal = (course = null) => {
    if (course) {
      setIsEditMode(true);
      setCurrentCourse(course);
      setFormData({
        title: course.title,
        shortDescription: course.shortDescription,
        description: course.description,
        thumbnail: course.thumbnail,
        previewVideo: course.previewVideo,
        category: course.category,
        customCategoryName:
          course.category === "Other" ? course.customCategoryName || "" : "",
        prerequisites: course.prerequisites,
        level: course.level,
        language: course.language,
        duration: course.duration,
        price: course.price,
        discountedPrice: course.discountedPrice || 0,
        isFree: course.isFree,
        isPublished: course.isPublished,
        tags: course.tags,
      });
      setThumbnailData(course.thumbnail ? { publicId: course.thumbnailPublicId, fileUrl: course.thumbnail } : null);
      setPreviewVideoData(course.previewVideo ? { publicId: course.previewVideoPublicId, fileUrl: course.previewVideo } : null);
      setThumbnailSource(course.thumbnail && course.thumbnail.startsWith("http") ? "url" : "upload");
      setPreviewVideoSource(course.previewVideo && course.previewVideo.startsWith("http") ? "url" : "upload");
    } else {
      setIsEditMode(false);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    dispatch(clearUploadState());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const courseData = {
      ...formData,
      duration: Number(formData.duration),
      price: Number(formData.price),
      discountedPrice: Number(formData.discountedPrice),
      customCategoryName: formData.category === "Other" ? formData.customCategoryName : undefined,
      instructor: currentUser._id,
    };

    if (isEditMode) {
      dispatch(updateCourse({ id: currentCourse._id, courseData }));
    } else {
      dispatch(createCourse(courseData));
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      dispatch(deleteCourse(id));
    }
  };

  const UploadingLoader = () => (
    <div className="flex items-center justify-center p-4 bg-accent text-accent-foreground rounded-lg font-body">
      <Loader2 className="animate-spin mr-2" size={20} />
      <span>Uploading...</span>
    </div>
  );

  return (
    <div className="bg-background text-foreground min-h-screen p-6 sm:p-10 font-body">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading text-foreground">
          Manage Your Courses
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary-foreground hover:text-primary text-primary-foreground font-semibold py-2 px-4 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add New Course</span>
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-md p-6">
        {loading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="mr-2" />
            <p className="font-medium font-body">{error}</p>
          </div>
        )}
        {!loading && courses.length === 0 && (
          <p className="text-center text-muted-foreground font-medium font-body py-10">
            You haven't created any courses yet. Start by adding a new one!
          </p>
        )}
        {!loading && courses.length > 0 && (
          <ul className="space-y-4">
            {courses.map((course) => (
              <motion.li
                key={course._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <img
                    src={course.thumbnail || "https://placehold.co/80x80"}
                    alt={course.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/80x80";
                    }}
                  />
                  <div className="flex-grow">
                    <h3 className="text-lg font-heading text-foreground">
                      {course.title}
                    </h3>
                    <p className="text-sm font-body text-muted-foreground">
                      {course.category} | {course.isPublished ? "Published" : "Draft"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openModal(course)}
                    className="p-3 bg-secondary text-secondary-foreground rounded-full hover:bg-muted transition-colors"
                    aria-label="Edit course"
                  >
                    <Edit size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(course._id)}
                    className="p-3 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors"
                    aria-label="Delete course"
                  >
                    <Trash2 size={20} />
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-popover/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-card p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-4xl max-h-[95vh] overflow-y-auto transform"
            >
              <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-heading text-card-foreground">
                  {isEditMode ? "Edit Course" : "Create New Course"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-heading text-card-foreground border-b border-border pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-body text-card-foreground">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="shortDescription" className="block text-sm font-body text-card-foreground">
                        Short Description (Max 160 chars)
                      </label>
                      <textarea
                        id="shortDescription"
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        maxLength="160"
                        rows="1"
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-body text-card-foreground">
                      Full Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      rows="4"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-heading text-card-foreground border-b border-border pb-2">
                    Media & Content
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-body text-card-foreground">
                        Thumbnail
                      </label>
                      <div className="flex mt-2 space-x-2">
                        <button
                          type="button"
                          onClick={() => setThumbnailSource("url")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-body ${
                            thumbnailSource === "url"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          <LinkIcon size={16} /> URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnailSource("upload")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-body ${
                            thumbnailSource === "upload"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          <ImageIcon size={16} /> Upload
                        </button>
                      </div>
                      <div className="mt-4">
                        {thumbnailSource === "url" ? (
                          <input
                            type="url"
                            name="thumbnail"
                            value={formData.thumbnail}
                            onChange={handleInputChange}
                            placeholder="Enter thumbnail URL"
                            className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          />
                        ) : (
                          <>
                            {singleFileStatus === "loading" && currentFileUploadType === "thumbnail" ? (
                              <UploadingLoader />
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "thumbnail")}
                                className="file:bg-primary file:text-primary-foreground file:hover:bg-primary/80 file:cursor-pointer file:rounded-full file:border-0 file:px-4 file:py-2 block w-full text-sm text-muted-foreground"
                              />
                            )}
                          </>
                        )}
                        {(formData.thumbnail || thumbnailData) && (
                          <div className="mt-4 flex items-center gap-4 p-3 bg-muted rounded-lg">
                            <img
                              src={formData.thumbnail || (thumbnailData && thumbnailData.fileUrl)}
                              alt="Thumbnail preview"
                              className="w-24 h-16 object-cover rounded-md"
                            />
                            <div className="flex-grow truncate text-sm font-body">
                              {formData.thumbnail ? "URL" : "Uploaded Image"}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFileDelete(thumbnailData.publicId, "thumbnail")}
                              className="text-destructive hover:text-destructive/80"
                              disabled={deleteStatus === "loading"}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-body text-card-foreground">
                        Preview Video
                      </label>
                      <div className="flex mt-2 space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewVideoSource("url")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-body ${
                            previewVideoSource === "url"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          <LinkIcon size={16} /> URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewVideoSource("upload")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-body ${
                            previewVideoSource === "upload"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          <VideoIcon size={16} /> Upload
                        </button>
                      </div>
                      <div className="mt-4">
                        {previewVideoSource === "url" ? (
                          <input
                            type="url"
                            name="previewVideo"
                            value={formData.previewVideo}
                            onChange={handleInputChange}
                            placeholder="Enter video URL"
                            className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          />
                        ) : (
                          <>
                            {singleFileStatus === "loading" && currentFileUploadType === "previewVideo" ? (
                              <UploadingLoader />
                            ) : (
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleFileUpload(e, "previewVideo")}
                                className="file:bg-primary file:text-primary-foreground file:hover:bg-primary/80 file:cursor-pointer file:rounded-full file:border-0 file:px-4 file:py-2 block w-full text-sm text-muted-foreground"
                              />
                            )}
                          </>
                        )}
                        {(formData.previewVideo || previewVideoData) && (
                          <div className="mt-4 flex flex-col items-start gap-3 p-3 bg-muted rounded-lg">
                            <video
                              src={formData.previewVideo || (previewVideoData && previewVideoData.fileUrl)}
                              controls
                              className="w-full h-auto max-h-48 object-cover rounded-md"
                            />
                            <div className="flex w-full items-center gap-4">
                              <span className="flex-1 truncate text-sm font-body">
                                {formData.previewVideo ? "URL" : "Uploaded Video"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleFileDelete(previewVideoData?.publicId, "previewVideo")}
                                className="text-destructive hover:text-destructive/80"
                                disabled={deleteStatus === "loading"}
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-heading text-card-foreground border-b border-border pb-2">
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="category" className="block text-sm font-body text-card-foreground">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.category === "Other" && (
                      <div className="space-y-2">
                        <label htmlFor="customCategoryName" className="block text-sm font-body text-card-foreground">
                          Custom Category
                        </label>
                        <input
                          type="text"
                          id="customCategoryName"
                          name="customCategoryName"
                          value={formData.customCategoryName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label htmlFor="level" className="block text-sm font-body text-card-foreground">
                        Level
                      </label>
                      <select
                        id="level"
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="language" className="block text-sm font-body text-card-foreground">
                        Language
                      </label>
                      <input
                        type="text"
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="duration" className="block text-sm font-body text-card-foreground">
                        Duration (in hours)
                      </label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="price" className="block text-sm font-body text-card-foreground">
                        Price
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="discountedPrice" className="block text-sm font-body text-card-foreground">
                        Discounted Price
                      </label>
                      <input
                        type="number"
                        id="discountedPrice"
                        name="discountedPrice"
                        value={formData.discountedPrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded text-primary focus:ring-primary border-border"
                      />
                      <label htmlFor="isPublished" className="text-sm font-body text-card-foreground">
                        Published
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isFree"
                        name="isFree"
                        checked={formData.isFree}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded text-primary focus:ring-primary border-border"
                      />
                      <label htmlFor="isFree" className="text-sm font-body text-card-foreground">
                        Free Course
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-heading text-card-foreground border-b border-border pb-2">
                    Prerequisites & Tags
                  </h3>
                  <div>
                    <label className="block text-sm font-body text-card-foreground">
                      Prerequisites
                    </label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={prerequisiteInput}
                        onChange={(e) => setPrerequisiteInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="e.g., Basic JavaScript knowledge"
                      />
                      <button
                        type="button"
                        onClick={handlePrerequisiteAdd}
                        className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {formData.prerequisites.map((prereq, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-body text-secondary-foreground"
                        >
                          {prereq}
                          <button
                            type="button"
                            onClick={() => handlePrerequisiteRemove(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X size={16} />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-body text-card-foreground">
                      Tags
                    </label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-input rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="e.g., #webdev"
                      />
                      <button
                        type="button"
                        onClick={handleTagAdd}
                        className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-body text-secondary-foreground"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X size={16} />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-primary/80 transition-colors transform hover:scale-105 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>{isEditMode ? "Save Changes" : "Create Course"}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorCourseManager;