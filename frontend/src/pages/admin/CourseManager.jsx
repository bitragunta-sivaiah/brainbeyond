import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createCourse,
    fetchAllCourses,
    updateCourse,
    deleteCourse,
    resetCourseStatus,
} from "../../store/redux/courseSlice";
import {
    uploadSingleFile,
    deleteFile,
    clearUploadState,
} from "../../store/redux/uploadSlice";
import { fetchAllUsers } from "../../store/redux/authSlice";
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
    FileText,
    File as FileIcon,
    Users,
    DollarSign,
    Star,
    BookOpen,
    Clock,
    Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper component for displaying the courses in a table
const CourseTable = ({ courses, openModal, handleDelete, getStatusPill, formatPrice }) => (
    <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left table-auto">
            <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold tracking-wide">
                <tr>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Instructors</th>
                    <th className="px-6 py-3">Category & Level</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {courses.map((course) => (
                    <motion.tr
                        key={course._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-card hover:bg-secondary transition-colors duration-200"
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                                <img
                                    src={course.thumbnail || "https://placehold.co/64x64/e9ecef/495057?text=No+Img"}
                                    alt={course.title}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-border"
                                />
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-semibold font-heading text-foreground">{course.title}</h4>
                                    <p className="text-xs text-muted-foreground font-body max-w-xs truncate">
                                        {course.shortDescription || course.description}
                                    </p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users size={16} />
                                <span className="font-medium">
                                    {course.instructors
                                        .map(i => {
                                            const name = `${i.profileInfo?.firstName || ''} ${i.profileInfo?.lastName || ''}`.trim();
                                            return name || i.username || i.email || 'Unknown';
                                        })
                                        .join(', ')}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} />
                                <span className="capitalize">{course.category}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Star size={16} />
                                <span className="capitalize">{course.level}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className="text-foreground">{course.price > 0 ? formatPrice(course.price) : 'Free'}</span>
                            {course.discountedPrice > 0 && (
                                <p className="text-xs text-destructive line-through">{formatPrice(course.discountedPrice)}</p>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-wrap gap-2">
                                {getStatusPill(course.isPublished, "Published")}
                                {course.isFeatured && getStatusPill(course.isFeatured, "Featured")}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openModal(course)}
                                    className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                                    aria-label="Edit course"
                                >
                                    <Edit size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDelete(course.slug)}
                                    className="p-2 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors"
                                    aria-label="Delete course"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </td>
                    </motion.tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CourseManager = () => {
    const dispatch = useDispatch();
    const { courses, status: courseStatus, error: courseError } = useSelector((state) => state.course);
    const { users: allUsers } = useSelector((state) => state.auth);
    const { singleFile, singleFileStatus, deleteStatus } = useSelector((state) => state.upload);

    const instructors = allUsers.filter((user) => user.role === "instructor");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [isAiGeneration, setIsAiGeneration] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        shortDescription: "",
        thumbnail: "",
        previewVideo: "",
        category: "",
        customCategoryName: "",
        instructors: [],
        prerequisites: [],
        level: "beginner",
        language: "English",
        duration: 0,
        price: 0,
        discountedPrice: 0,
        isFree: false,
        isPublished: false,
        isFeatured: false,
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
        dispatch(fetchAllCourses());
        dispatch(fetchAllUsers());
    }, [dispatch]);

    useEffect(() => {
        if (courseStatus === "succeeded") {
            dispatch(resetCourseStatus());
        }
    }, [courseStatus, dispatch]);

    useEffect(() => {
        if (singleFileStatus === "succeeded" && singleFile) {
            if (singleFile.fileUrl.includes("video")) {
                setFormData((prev) => ({ ...prev, previewVideo: singleFile.fileUrl }));
            } else {
                setFormData((prev) => ({ ...prev, thumbnail: singleFile.fileUrl }));
            }
        }
    }, [singleFile, singleFileStatus]);

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            dispatch(uploadSingleFile(file));
        }
    };

    const handleFileDelete = async (url, field) => {
        if (!url) return;
        try {
            const publicId = url.split("/").pop().split(".")[0];
            await dispatch(deleteFile(publicId)).unwrap();
            setFormData((prev) => ({ ...prev, [field]: "" }));
            dispatch(clearUploadState());
        } catch (error) {
            console.error("Failed to delete file:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            shortDescription: "",
            thumbnail: "",
            previewVideo: "",
            category: "",
            customCategoryName: "",
            instructors: [],
            prerequisites: [],
            level: "beginner",
            language: "English",
            duration: 0,
            price: 0,
            discountedPrice: 0,
            isFree: false,
            isPublished: false,
            isFeatured: false,
            tags: [],
        });
        setPrerequisiteInput("");
        setTagInput("");
        setThumbnailSource("url");
        setPreviewVideoSource("url");
        setCurrentCourse(null);
        setIsEditMode(false);
        setIsAiGeneration(true);
    };

    const openModal = (course = null) => {
        if (course) {
            setIsEditMode(true);
            setCurrentCourse(course);
            setFormData({
                title: course.title || "",
                description: course.description || "",
                shortDescription: course.shortDescription || "",
                thumbnail: course.thumbnail || "",
                previewVideo: course.previewVideo || "",
                category: course.category || "",
                customCategoryName: course.category === "Other" ? course.customCategoryName || "" : "",
                instructors: course.instructors.map((i) => i._id),
                prerequisites: course.prerequisites || [],
                level: course.level || "beginner",
                language: course.language || "English",
                duration: course.duration || 0,
                price: course.price || 0,
                discountedPrice: course.discountedPrice || 0,
                isFree: course.isFree || false,
                isPublished: course.isPublished || false,
                isFeatured: course.isFeatured || false,
                tags: course.tags || [],
            });
            setThumbnailSource(course.thumbnail && course.thumbnail.startsWith("http") ? "url" : "upload");
            setPreviewVideoSource(course.previewVideo && course.previewVideo.startsWith("http") ? "url" : "upload");
            setIsAiGeneration(false);
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

        const baseCourseData = {
            title: formData.title,
            instructors: formData.instructors,
            thumbnail: formData.thumbnail,
            previewVideo: formData.previewVideo,
            isFeatured: formData.isFeatured,
            isPublished: formData.isPublished,
            price: Number(formData.price),
            discountedPrice: Number(formData.discountedPrice),
            isFree: formData.isFree,
        };

        if (isAiGeneration) {
            dispatch(createCourse({ ...baseCourseData, useAiGeneration: true }));
        } else {
            const manualCourseData = {
                ...baseCourseData,
                description: formData.description,
                shortDescription: formData.shortDescription,
                category: formData.category,
                customCategoryName: formData.category === "Other" ? formData.customCategoryName : undefined,
                prerequisites: formData.prerequisites,
                level: formData.level,
                language: formData.language,
                tags: formData.tags,
                useAiGeneration: false,
            };
            if (isEditMode) {
                dispatch(updateCourse({ slug: currentCourse.slug, updatedData: manualCourseData }));
            } else {
                dispatch(createCourse(manualCourseData));
            }
        }

        closeModal();
    };

    const handleDelete = (slug) => {
        if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
            dispatch(deleteCourse(slug));
        }
    };

    const UploadingLoader = () => (
        <div className="flex items-center justify-center p-4 bg-primary/10 text-primary rounded-lg font-body">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span>Uploading...</span>
        </div>
    );

    const getResourceIcon = (resourceType) => {
        switch (resourceType) {
            case 'pdf':
            case 'doc':
            case 'zip':
                return <FileText size={16} />;
            case 'image':
                return <ImageIcon size={16} />;
            case 'video':
                return <VideoIcon size={16} />;
            default:
                return <FileIcon size={16} />;
        }
    };

    const getLessonIcon = (lessonType) => {
        switch (lessonType) {
            case 'video':
                return <VideoIcon className="text-primary" size={18} />;
            case 'article':
                return <FileText className="text-accent-foreground" size={18} />;
            case 'codingProblem':
                return <FileIcon className="text-secondary-foreground" size={18} />;
            case 'quiz':
                return <FileIcon className="text-destructive" size={18} />;
            default:
                return <FileIcon className="text-muted-foreground" size={18} />;
        }
    };

    const getStatusPill = (status, text) => (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                status
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
        >
            {text}
        </span>
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
    };

    return (
        <div className="p-4 sm:p-8 bg-background text-foreground min-h-screen font-body">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-4 sm:mb-0">
                    Course Manager
                </h1>
                <button
                    onClick={() => openModal()}
                    className="bg-primary text-primary-foreground font-heading font-bold px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-all duration-300 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>New Course</span>
                </button>
            </div>
            
            <div className="bg-card p-4   rounded-xl shadow">
                {courseStatus === "loading" && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin text-primary" size={48} />
                    </div>
                )}
                {courseStatus === "failed" && (
                    <div className="flex items-center justify-center p-4 bg-destructive/10 text-destructive rounded-lg">
                        <AlertCircle className="mr-2" />
                        <p className="font-body">{courseError}</p>
                    </div>
                )}
                {courseStatus !== "loading" && courses.length === 0 && (
                    <p className="text-center text-muted-foreground font-body p-8">
                        No courses found. Add a new course to get started!
                    </p>
                )}
                {courses.length > 0 && (
                    <CourseTable
                        courses={courses}
                        openModal={openModal}
                        handleDelete={handleDelete}
                        getStatusPill={getStatusPill}
                        formatPrice={formatPrice}
                    />
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto custom-scrollbar"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-heading font-bold">
                                    {isEditMode ? "Edit Course" : "Create New Course"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!isEditMode && (
                                    <div className="flex items-center gap-2 p-4 bg-secondary rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="isAiGeneration"
                                            name="isAiGeneration"
                                            checked={isAiGeneration}
                                            onChange={(e) => setIsAiGeneration(e.target.checked)}
                                            className="h-4 w-4 text-primary rounded focus:ring-primary accent-primary"
                                        />
                                        <label htmlFor="isAiGeneration" className="text-sm font-body font-medium text-foreground">
                                            Use AI to generate course details
                                        </label>
                                        <span className="text-sm text-muted-foreground ml-auto font-body">
                                            (Auto-generates description, tags, etc.)
                                        </span>
                                    </div>
                                )}
                                
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-heading font-semibold mb-4 border-b border-border pb-2">
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground font-body">Title</label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="instructors" className="block text-sm font-medium text-muted-foreground font-body">
                                                Instructors
                                            </label>
                                            <select
                                                id="instructors"
                                                name="instructors"
                                                value={formData.instructors}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        instructors: Array.from(
                                                            e.target.selectedOptions,
                                                            (option) => option.value
                                                        ),
                                                    }))
                                                }
                                                className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                multiple
                                                required
                                            >
                                                {instructors.map((instructor) => (
                                                    <option key={instructor._id} value={instructor._id}>
                                                        {`${instructor?.profileInfo?.firstName || ''} ${instructor?.profileInfo?.lastName || ''}`.trim() || instructor.username || instructor.email || 'Unknown Instructor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Media & Content */}
                                <div>
                                    <h3 className="mb-4 border-b border-border pb-2 text-lg font-heading font-semibold">Media</h3>
                                    <div className="space-y-4">
                                        {/* Thumbnail Input */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium font-body text-muted-foreground">
                                                Thumbnail
                                            </label>
                                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setThumbnailSource("url")}
                                                    className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-colors border ${
                                                        thumbnailSource === "url"
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-muted text-muted-foreground hover:bg-secondary border-border"
                                                    }`}
                                                >
                                                    <LinkIcon size={16} /> URL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setThumbnailSource("upload")}
                                                    className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-colors border ${
                                                        thumbnailSource === "upload"
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-muted text-muted-foreground hover:bg-secondary border-border"
                                                    }`}
                                                >
                                                    <ImageIcon size={16} /> Upload
                                                </button>
                                            </div>

                                            {thumbnailSource === "url" && (
                                                <>
                                                    <input
                                                        type="url"
                                                        name="thumbnail"
                                                        value={formData.thumbnail}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter thumbnail URL"
                                                        className="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground transition-colors focus:border-primary focus:ring-primary"
                                                        required
                                                    />
                                                    {formData.thumbnail && (
                                                        <div className="mt-4">
                                                            <img
                                                                src={formData.thumbnail}
                                                                alt="Thumbnail preview"
                                                                className="h-auto w-full max-w-sm rounded-lg object-cover shadow-lg"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {thumbnailSource === "upload" && (
                                                <div>
                                                    {singleFileStatus === "loading" ? (
                                                        <UploadingLoader />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            {formData.thumbnail ? (
                                                                <div className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-secondary p-4">
                                                                    <img
                                                                        src={formData.thumbnail}
                                                                        alt="Thumbnail preview"
                                                                        className="h-16 w-24 rounded-lg object-cover"
                                                                    />
                                                                    <span className="flex-1 truncate text-sm font-body">
                                                                        {formData.thumbnail.split("/").pop()}
                                                                    </span>
                                                                    <motion.button
                                                                        type="button"
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleFileDelete(formData.thumbnail, "thumbnail")}
                                                                        className="text-destructive hover:text-destructive/80"
                                                                        disabled={deleteStatus === "loading"}
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </motion.button>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleFileUpload}
                                                                    className="file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 block w-full cursor-pointer text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Preview Video Input */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium font-body text-muted-foreground">
                                                Preview Video
                                            </label>
                                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewVideoSource("url")}
                                                    className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-colors border ${
                                                        previewVideoSource === "url"
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-muted text-muted-foreground hover:bg-secondary border-border"
                                                    }`}
                                                >
                                                    <LinkIcon size={16} /> URL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewVideoSource("upload")}
                                                    className={`flex items-center justify-center gap-2 rounded-lg py-2 transition-colors border ${
                                                        previewVideoSource === "upload"
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-muted text-muted-foreground hover:bg-secondary border-border"
                                                    }`}
                                                >
                                                    <VideoIcon size={16} /> Upload
                                                </button>
                                            </div>

                                            {previewVideoSource === "url" && (
                                                <>
                                                    <input
                                                        type="url"
                                                        name="previewVideo"
                                                        value={formData.previewVideo}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter video URL"
                                                        className="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground transition-colors focus:border-primary focus:ring-primary"
                                                    />
                                                    {formData.previewVideo && (
                                                        <div className="mt-4">
                                                            <video
                                                                src={formData.previewVideo}
                                                                controls
                                                                className="h-auto w-full max-w-sm rounded-lg shadow-lg"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {previewVideoSource === "upload" && (
                                                <div>
                                                    {singleFileStatus === "loading" ? (
                                                        <UploadingLoader />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            {formData.previewVideo ? (
                                                                <div className="mt-4 flex flex-col items-start gap-4 rounded-lg border border-border bg-secondary p-4">
                                                                    <video
                                                                        src={formData.previewVideo}
                                                                        controls
                                                                        className="h-auto w-full max-w-sm rounded-lg"
                                                                    />
                                                                    <div className="flex w-full items-center gap-4">
                                                                        <span className="flex-1 truncate text-sm font-body">
                                                                            {formData.previewVideo.split("/").pop()}
                                                                        </span>
                                                                        <motion.button
                                                                            type="button"
                                                                            whileHover={{ scale: 1.1 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleFileDelete(formData.previewVideo, "previewVideo")}
                                                                            className="text-destructive hover:text-destructive/80"
                                                                            disabled={deleteStatus === "loading"}
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </motion.button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    accept="video/*"
                                                                    onChange={handleFileUpload}
                                                                    className="file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 block w-full cursor-pointer text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Course Details (Conditional Rendering) */}
                                <div>
                                    <h3 className="text-lg font-heading font-semibold mb-4 border-b border-border pb-2">
                                        Course Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Manual fields, hidden if AI generation is enabled */}
                                        {!isAiGeneration && (
                                            <>
                                                <div className="space-y-2 col-span-full">
                                                    <label htmlFor="shortDescription" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Short Description (Max 160 chars)
                                                    </label>
                                                    <textarea
                                                        id="shortDescription"
                                                        name="shortDescription"
                                                        value={formData.shortDescription}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                        maxLength="160"
                                                        rows="1"
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <label htmlFor="description" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Full Description
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                        rows="4"
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="category" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Category
                                                    </label>
                                                    <select
                                                        id="category"
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                        required
                                                    >
                                                        <option value="" disabled>Select a category</option>
                                                        {categories.map((cat) => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {formData.category === "Other" && (
                                                    <div className="space-y-2">
                                                        <label htmlFor="customCategoryName" className="block text-sm font-medium text-muted-foreground font-body">
                                                            Custom Category Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="customCategoryName"
                                                            name="customCategoryName"
                                                            value={formData.customCategoryName}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <label htmlFor="level" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Level
                                                    </label>
                                                    <select
                                                        id="level"
                                                        name="level"
                                                        value={formData.level}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                    >
                                                        <option value="beginner">Beginner</option>
                                                        <option value="intermediate">Intermediate</option>
                                                        <option value="advanced">Advanced</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="language" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Language
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="language"
                                                        name="language"
                                                        value={formData.language}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="duration" className="block text-sm font-medium text-muted-foreground font-body">
                                                        Duration (in hours)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="duration"
                                                        name="duration"
                                                        value={formData.duration}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <label className="block text-sm font-medium text-muted-foreground font-body">
                                                        Prerequisites
                                                    </label>
                                                    <div className="flex gap-2 mt-1">
                                                        <input
                                                            type="text"
                                                            value={prerequisiteInput}
                                                            onChange={(e) => setPrerequisiteInput(e.target.value)}
                                                            className="flex-1 px-4 py-2 border rounded-lg border-border bg-input text-foreground"
                                                            placeholder="Add a prerequisite..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handlePrerequisiteAdd}
                                                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    </div>
                                                    <ul className="mt-2 flex flex-wrap gap-2">
                                                        {formData.prerequisites.map((prereq, index) => (
                                                            <li key={index} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1 text-sm font-body">
                                                                {prereq}
                                                                <button type="button" onClick={() => handlePrerequisiteRemove(index)} className="text-muted-foreground hover:text-foreground">
                                                                    <X size={16} />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <label className="block text-sm font-medium text-muted-foreground font-body">
                                                        Tags
                                                    </label>
                                                    <div className="flex gap-2 mt-1">
                                                        <input
                                                            type="text"
                                                            value={tagInput}
                                                            onChange={(e) => setTagInput(e.target.value)}
                                                            className="flex-1 px-4 py-2 border rounded-lg border-border bg-input text-foreground"
                                                            placeholder="Add a tag..."
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleTagAdd}
                                                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    </div>
                                                    <ul className="mt-2 flex flex-wrap gap-2">
                                                        {formData.tags.map((tag, index) => (
                                                            <li key={index} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1 text-sm font-body">
                                                                {tag}
                                                                <button type="button" onClick={() => handleTagRemove(index)} className="text-muted-foreground hover:text-foreground">
                                                                    <X size={16} />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-2">
                                            <label htmlFor="price" className="block text-sm font-medium text-muted-foreground font-body">
                                                Price
                                            </label>
                                            <input
                                                type="number"
                                                id="price"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="discountedPrice" className="block text-sm font-medium text-muted-foreground font-body">
                                                Discounted Price
                                            </label>
                                            <input
                                                type="number"
                                                id="discountedPrice"
                                                name="discountedPrice"
                                                value={formData.discountedPrice}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border rounded-lg border-border bg-input text-foreground focus:ring-primary focus:border-primary transition-colors"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isFree"
                                                name="isFree"
                                                checked={formData.isFree}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary rounded focus:ring-primary accent-primary"
                                            />
                                            <label htmlFor="isFree" className="text-sm font-medium text-muted-foreground font-body">
                                                Is Free
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isPublished"
                                                name="isPublished"
                                                checked={formData.isPublished}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary rounded focus:ring-primary accent-primary"
                                            />
                                            <label htmlFor="isPublished" className="text-sm font-medium text-muted-foreground font-body">
                                                Is Published
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isFeatured"
                                                name="isFeatured"
                                                checked={formData.isFeatured}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary rounded focus:ring-primary accent-primary"
                                            />
                                            <label htmlFor="isFeatured" className="text-sm font-medium text-muted-foreground font-body">
                                                Is Featured
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2 rounded-lg text-foreground border border-border hover:bg-secondary transition-colors font-heading"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading"
                                        disabled={courseStatus === 'loading'}
                                    >
                                        {courseStatus === 'loading' ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : isEditMode ? (
                                            "Save Changes"
                                        ) : (
                                            "Create Course"
                                        )}
                                    </button>
                                </div>
                            </form>
                            {isEditMode && currentCourse && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-heading font-semibold mb-4 border-b border-border pb-2">
                                        Course Content
                                    </h3>
                                    {currentCourse.chapters && currentCourse.chapters.length > 0 ? (
                                        <div className="space-y-4">
                                            {currentCourse.chapters.map((chapter) => (
                                                <div key={chapter._id} className="bg-secondary rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-base font-heading font-bold text-foreground">{chapter.title}</h4>
                                                        <span className="text-xs text-muted-foreground font-body">
                                                            {chapter.lessons.length} lessons
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1 font-body">{chapter.description}</p>
                                                    {chapter.lessons && chapter.lessons.length > 0 && (
                                                        <ul className="mt-4 space-y-2">
                                                            {chapter.lessons.map((lesson) => (
                                                                <li key={lesson._id} className="flex items-center gap-3 p-3 bg-card rounded-md border border-border">
                                                                    {getLessonIcon(lesson.type)}
                                                                    <span className="font-medium text-sm text-foreground font-body">
                                                                        {lesson.title}
                                                                    </span>
                                                                    {lesson.resources && lesson.resources.length > 0 && (
                                                                        <div className="ml-auto flex items-center gap-2">
                                                                            <span className="text-xs text-muted-foreground font-body">Resources:</span>
                                                                            {lesson.resources.map((resource, resIndex) => (
                                                                                <a
                                                                                    key={resIndex}
                                                                                    href={resource.url.startsWith('/') ? '#' : resource.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center text-primary hover:underline transition-colors"
                                                                                    onClick={(e) => {
                                                                                        if (resource.url.startsWith('/')) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {getResourceIcon(resource.type)}
                                                                                    <span className="sr-only font-body">{resource.title}</span>
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground p-4 font-body">No chapters found for this course.</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseManager;