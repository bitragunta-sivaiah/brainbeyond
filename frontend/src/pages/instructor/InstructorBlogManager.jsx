import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createBlogPost,
  getBlogs,
  getSingleBlog,
  updateBlogPost,
  deleteBlogPost,
  reset,
} from "../../store/redux/blogSlice";
import {
  uploadSingleFile,
  deleteFile,
  clearSingleFileUpload,
} from "../../store/redux/uploadSlice";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Image,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const InstructorBlogManager = () => {
  const dispatch = useDispatch();
  const { blogs, blog, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.blog
  );
  const { singleFile, singleFileStatus } = useSelector(
    (state) => state.upload
  );
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: { url: "", altText: "" },
    category: "",
    customCategoryName: "",
    tags: "",
    socialShareLinks: {
      youtube: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
      other: "",
    },
    isPublished: false,
  });
  const [currentBlogId, setCurrentBlogId] = useState(null);
  const [imageTab, setImageTab] = useState("upload");
  const [imageLink, setImageLink] = useState("");

  // Fetch blogs only for the current instructor
  useEffect(() => {
    if (user?._id) {
      dispatch(getBlogs({ authorId: user._id }));
    }
    return () => {
      dispatch(reset());
    };
  }, [dispatch, user]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  useEffect(() => {
    if (singleFileStatus === "succeeded" && singleFile) {
      setFormData((prev) => ({
        ...prev,
        featuredImage: { ...prev.featuredImage, url: singleFile.url },
      }));
    }
  }, [singleFileStatus, singleFile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("socialShareLinks.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialShareLinks: {
          ...prev.socialShareLinks,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadSingleFile(file));
    }
  };

  const handleImageLinkChange = (e) => {
    setImageLink(e.target.value);
    setFormData((prev) => ({
      ...prev,
      featuredImage: { ...prev.featuredImage, url: e.target.value },
    }));
  };

  const handleFileDelete = async () => {
    if (singleFile && singleFile.publicId) {
      await dispatch(deleteFile(singleFile.publicId));
      dispatch(clearSingleFileUpload());
    }
    setFormData((prev) => ({
      ...prev,
      featuredImage: { url: "", altText: "" },
    }));
    setImageLink("");
  };

  const openModal = (type, blogId = null) => {
    setModalType(type);
    setIsModalOpen(true);
    setCurrentBlogId(blogId);

    if (type === "edit" && blogId) {
      const blogToEdit = blogs.find((b) => b._id === blogId);
      if (blogToEdit) {
        setFormData({
          title: blogToEdit.title,
          content: blogToEdit.content,
          excerpt: blogToEdit.excerpt,
          featuredImage: blogToEdit.featuredImage || { url: "", altText: "" },
          category: blogToEdit.category,
          customCategoryName: blogToEdit.customCategoryName || "",
          tags: blogToEdit.tags.join(", "),
          socialShareLinks: blogToEdit.socialShareLinks || {},
          isPublished: blogToEdit.isPublished,
        });
        setImageLink(blogToEdit.featuredImage?.url || "");
      }
    } else if (type === "view" && blogId) {
      dispatch(getSingleBlog(blogId));
    } else {
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        featuredImage: { url: "", altText: "" },
        category: "",
        customCategoryName: "",
        tags: "",
        socialShareLinks: {},
        isPublished: false,
      });
      setImageLink("");
      dispatch(clearSingleFileUpload());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      featuredImage: { url: "", altText: "" },
      category: "",
      customCategoryName: "",
      tags: "",
      socialShareLinks: {},
      isPublished: false,
    });
    setImageLink("");
    dispatch(clearSingleFileUpload());
    setCurrentBlogId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const blogData = {
      ...formData,
      tags: formData.tags.split(",").map((tag) => tag.trim()),
    };

    if (modalType === "create") {
      dispatch(createBlogPost({ ...blogData, author: user._id }))
        .unwrap()
        .then(() => {
          closeModal();
          dispatch(getBlogs({ authorId: user._id }));
        })
        .catch(() => {});
    } else if (modalType === "edit") {
      dispatch(updateBlogPost({ blogId: currentBlogId, blogData }))
        .unwrap()
        .then(() => {
          closeModal();
          dispatch(getBlogs({ authorId: user._id }));
        })
        .catch(() => {});
    }
  };

  const handleDelete = (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      dispatch(deleteBlogPost(blogId))
        .unwrap()
        .then(() => {
          dispatch(getBlogs({ authorId: user._id }));
        })
        .catch(() => {});
    }
  };

  const BlogList = () => (
    <div className="space-y-4">
      {blogs.length > 0 ? (
        blogs.map((b) => (
          <motion.div
            key={b._id}
            className="bg-card p-6 rounded-lg shadow-md flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h3 className="text-xl font-heading text-card-foreground">
                {b.title}
              </h3>
              <p className="text-muted-foreground text-sm font-body">
                Created on {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openModal("view", b.slug)}
                className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                title="View"
              >
                <LinkIcon size={18} />
              </button>
              <button
                onClick={() => openModal("edit", b._id)}
                className="bg-secondary text-secondary-foreground p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(b._id)}
                className="bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/80 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-muted-foreground mt-8">
          <p>No blog posts found. Create one to get started!</p>
        </div>
      )}
    </div>
  );

  const ModalContent = () => {
    if (modalType === "view") {
      return (
        <div className="max-h-[80vh] overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
          {blog && !isLoading && (
            <div>
              <img
                src={blog.featuredImage?.url}
                alt={blog.featuredImage?.altText || blog.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h2 className="text-3xl font-heading text-card-foreground mb-2">
                {blog.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4 font-body">
                By {blog.author?.name} on{" "}
                {new Date(blog.createdAt).toLocaleDateString()}
              </p>
              <div
                className="prose dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="p-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
            >
              <option value="">Select a category</option>
              {[
                "Web Development",
                "Data Science",
                "Mobile Development",
                "Design",
                "Marketing",
                "Other",
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {formData.category === "Other" && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Custom Category Name
              </label>
              <input
                type="text"
                name="customCategoryName"
                value={formData.customCategoryName}
                onChange={handleInputChange}
                required
                className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Excerpt
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            required
            maxLength={300}
            className="w-full h-20 bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            className="w-full h-32 bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Featured Image
          </label>
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setImageTab("upload")}
              className={`flex-1 flex items-center justify-center p-3 rounded-lg font-semibold transition-colors ${
                imageTab === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Image size={20} className="mr-2" /> Upload
            </button>
            <button
              type="button"
              onClick={() => setImageTab("link")}
              className={`flex-1 flex items-center justify-center p-3 rounded-lg font-semibold transition-colors ${
                imageTab === "link"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <LinkIcon size={20} className="mr-2" /> Paste Link
            </button>
          </div>

          {imageTab === "upload" ? (
            <div className="relative border-2 border-border border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleImageFileChange}
                accept="image/*"
              />
              {singleFileStatus === "loading" ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <p className="mt-2 text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Drag and drop an image here, or click to select a file.
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={imageLink}
              onChange={handleImageLinkChange}
              placeholder="Paste image URL here..."
              className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
            />
          )}

          {(formData.featuredImage?.url || imageLink) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 relative"
            >
              <img
                src={formData.featuredImage?.url || imageLink}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleFileDelete}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full shadow-md"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                {formData.featuredImage?.url || imageLink}
              </p>
            </motion.div>
          )}
          <label className="block text-sm font-medium text-muted-foreground mt-2">
            Image Alt Text
          </label>
          <input
            type="text"
            name="featuredImage.altText"
            value={formData.featuredImage?.altText || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                featuredImage: { ...prev.featuredImage, altText: e.target.value },
              }))
            }
            className="w-full bg-input border-border border p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
          />
        </div>

        <div>
          <h3 className="text-lg font-heading text-card-foreground mb-2">
            Social Share Links
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              "youtube",
              "linkedin",
              "twitter",
              "facebook",
              "instagram",
              "other",
            ].map((platform) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-muted-foreground capitalize">
                  {platform}
                </label>
                <input
                  type="text"
                  name={`socialShareLinks.${platform}`}
                  value={formData.socialShareLinks[platform] || ""}
                  onChange={handleInputChange}
                  placeholder={`https://...`}
                  className="w-full bg-input border-border border p-3 rounded-lg mt-1    focus:outline-none focus:ring-2 focus:ring-primary text-card-foreground"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary bg-input border-border border  rounded focus:ring-primary"
          />
          <label
            htmlFor="isPublished"
            className="text-sm font-medium text-muted-foreground"
          >
            Publish this post
          </label>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-secondary text-secondary-foreground p-3 rounded-lg hover:bg-muted transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-primary text-primary-foreground p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-semibold flex items-center"
            disabled={isLoading || singleFileStatus === "loading"}
          >
            {(isLoading || singleFileStatus === "loading") && (
              <Loader2 className="animate-spin mr-2" size={20} />
            )}
            {modalType === "create" ? "Create Blog Post" : "Update Blog Post"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-8 bg-background min-h-screen font-body">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-display text-foreground">My Blog Posts</h1>
        <button
          onClick={() => openModal("create")}
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center font-semibold"
        >
          <Plus className="mr-2" size={20} /> New Blog
        </button>
      </div>
      <BlogList />

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-lg shadow-xl max-w-3xl w-full relative max-h-[90vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-2xl font-heading text-card-foreground">
                  {modalType === "create" && "Create New Blog"}
                  {modalType === "edit" && "Edit Blog Post"}
                  {modalType === "view" && "View Blog Post"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto">
                <ModalContent />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorBlogManager;