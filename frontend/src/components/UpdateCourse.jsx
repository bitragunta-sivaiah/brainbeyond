import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourseBySlug, updateCourse } from "../store/redux/courseContentSlice";
import {
  uploadSingleFile,
  deleteFile,
} from "../store/redux/uploadSlice";
import { fetchAllUsers } from "../store/redux/authSlice"; // Import for admin functionality
import {
  X,
  Plus,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UpdateCourse = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentCourse, loading, error } = useSelector((state) => state.courseContent);
  const { singleFile, singleFileStatus, deleteStatus } = useSelector(
    (state) => state.upload
  );
  // Get users and current logged-in user from authSlice
  const { users, user } = useSelector((state) => state.auth);

  const [thumbnailData, setThumbnailData] = useState(null);
  const [previewVideoData, setPreviewVideoData] = useState(null);
  const [currentFileUploadType, setCurrentFileUploadType] = useState(null);
  const [instructors, setInstructors] = useState([]);

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
    instructor: "",
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
    if (courseId) {
      dispatch(fetchCourseBySlug(courseId));
    }
  }, [dispatch, courseId]);

  useEffect(() => {
    if (user?.role === "admin") {
      dispatch(fetchAllUsers());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user?.role === "admin" && users) {
      const filteredInstructors = users.filter((u) => u.role === "instructor");
      setInstructors(filteredInstructors);
    } else if (user?.role === "instructor") {
      setInstructors([user]);
      // setFormData((prev) => ({ ...prev, instructor: user._id }));
    }
  }, [user, users]);

  useEffect(() => {
    if (currentCourse) {
      setFormData({
        title: currentCourse.title || "",
        shortDescription: currentCourse.shortDescription || "",
        description: currentCourse.description || "",
        thumbnail: currentCourse.thumbnail || "",
        previewVideo: currentCourse.previewVideo || "",
        category: currentCourse.category || "",
        customCategoryName:
          currentCourse.category === "Other" ? currentCourse.customCategoryName || "" : "",
        prerequisites: currentCourse.prerequisites || [],
        level: currentCourse.level || "beginner",
        language: currentCourse.language || "English",
        duration: currentCourse.duration || 0,
        price: currentCourse.price || 0,
        discountedPrice: currentCourse.discountedPrice || 0,
        isFree: currentCourse.isFree || false,
        isPublished: currentCourse.isPublished || false,
        tags: currentCourse.tags || [],
        instructor: currentCourse.instructor || "",
      });
      setThumbnailData(currentCourse.thumbnail ? { publicId: currentCourse.thumbnailPublicId, fileUrl: currentCourse.thumbnail } : null);
      setPreviewVideoData(currentCourse.previewVideo ? { publicId: currentCourse.previewVideoPublicId, fileUrl: currentCourse.previewVideo } : null);
      setThumbnailSource(currentCourse.thumbnail && currentCourse.thumbnail.startsWith("http") ? "url" : "upload");
      setPreviewVideoSource(currentCourse.previewVideo && currentCourse.previewVideo.startsWith("http") ? "url" : "upload");
    }
  }, [currentCourse]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const courseData = {
      ...formData,
      duration: Number(formData.duration),
      price: Number(formData.price),
      discountedPrice: Number(formData.discountedPrice),
      customCategoryName: formData.category === "Other" ? formData.customCategoryName : undefined,
    };
    await dispatch(updateCourse({ id: currentCourse._id, courseData }));
    navigate("/instructor/courses-content");
  };

  const UploadingLoader = () => (
    <div className="flex items-center justify-center p-4 bg-accent text-accent-foreground rounded-lg font-body">
      <Loader2 className="animate-spin mr-2" size={20} />
      <span>Uploading...</span>
    </div>
  );

  if (loading || !currentCourse) {
    return (
      <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-4xl mx-auto min-h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="mr-2" />
          <p className="font-body">{error}</p>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate("/instructor/courses")}
            className="bg-secondary text-secondary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-6 sm:p-10 font-body">
      <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h2 className="text-2xl font-heading text-card-foreground">
            Edit Course
          </h2>
          <button
            onClick={() => navigate("/instructor/courses")}
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                      className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                        onClick={() => handleFileDelete(thumbnailData?.publicId, "thumbnail")}
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
                      className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                    className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
              )}
              {user?.role === "admin" ? (
                <div className="space-y-2">
                  <label htmlFor="instructor" className="block text-sm font-body text-card-foreground">
                    Instructor
                  </label>
                  <select
                    id="instructor"
                    name="instructor"
                    value={formData.instructors}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  >
                    <option value="" disabled>Select an instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                      
                        {instructor.username}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="instructor" className="block text-sm font-body text-card-foreground">
                    Instructor
                  </label>
                  <input
                    type="text"
                    id="instructor"
                    name="instructor"
                    value={user?.username || ''}
                    className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-not-allowed"
                    disabled
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="w-full px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  className="flex-1 px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                <AnimatePresence>
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
                </AnimatePresence>
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
                  className="flex-1 px-4 py-2  border border-border  rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                <AnimatePresence>
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
                </AnimatePresence>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-primary/80 transition-colors transform hover:scale-105 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCourse;