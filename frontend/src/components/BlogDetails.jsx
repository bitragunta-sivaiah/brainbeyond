import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getSingleBlog,
  reset,
  addComment,
  deleteComment,
  addReply,
  deleteReply,
  likePost,
  unlikePost,
} from "../store/redux/blogSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  CheckCircle,
  Verified,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Utility hook to simplify Redux state access
const useRedux = () => {
  const dispatch = useDispatch();
  const { blog, isLoading, isError, message } = useSelector(
    (state) => state.blog
  );
  const { user } = useSelector((state) => state.auth); // Assuming auth slice provides user
  return { dispatch, blog, isLoading, isError, message, user };
};

const BlogDetails = () => {
  const { slug } = useParams();
  const { dispatch, blog, isLoading, isError, message, user } = useRedux();

  const [commentContent, setCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState({}); // Stores reply content per commentId

  useEffect(() => {
    if (slug) {
      dispatch(getSingleBlog(slug));
    }
    // Clean up state on unmount
    return () => dispatch(reset());
  }, [dispatch, slug]);

  useEffect(() => {
    if (isError) {
      toast.error(message || "An error occurred while fetching the blog.");
    }
  }, [isError, message]);

  // Handlers for interactions
  const handleLikePost = () => {
    if (!user) {
      toast.error("Please log in to like this post.");
      return;
    }
    if (blog?.meta?.likes?.includes(user._id)) {
      dispatch(unlikePost(blog._id));
    } else {
      dispatch(likePost(blog._id));
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to comment.");
      return;
    }
    if (commentContent.trim() && blog?._id) {
      dispatch(addComment({ blogId: blog._id, content: commentContent.trim() }))
        .unwrap()
        .then(() => setCommentContent(""))
        .catch(() => {});
    } else {
      toast.error("Comment cannot be empty.");
    }
  };

  const handleDeleteComment = (commentId) => {
    if (!user) {
      toast.error("You are not authorized to delete this comment.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this comment?")) {
      dispatch(deleteComment({ blogId: blog._id, commentId }))
        .unwrap()
        .catch(() => {});
    }
  };

  const handleAddReply = (e, commentId) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to reply.");
      return;
    }
    const content = replyContent[commentId]?.trim();
    if (content && blog?._id) {
      dispatch(addReply({ blogId: blog._id, commentId, content }))
        .unwrap()
        .then(() => setReplyContent((prev) => ({ ...prev, [commentId]: "" })))
        .catch(() => {});
    } else {
      toast.error("Reply cannot be empty.");
    }
  };

  const handleDeleteReply = (commentId, replyId) => {
    if (!user) {
      toast.error("You are not authorized to delete this reply.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this reply?")) {
      dispatch(deleteReply({ blogId: blog._id, commentId, replyId }))
        .unwrap()
        .catch(() => {});
    }
  };

  // Corrected function to check for admin/instructor role based on your response data structure
  const isVerifiedAuthor = (author) => {
    return author?.role === "admin" || author?.role === "instructor";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !blog || !blog.isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center text-muted-foreground">
        <p className="text-lg">
          Blog post not found or is not currently published.
          <br />
          <Link to="/blogs" className="mt-4 inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to all blogs
          </Link>
        </p>
      </div>
    );
  }

  const userHasLiked = user && blog?.meta?.likes?.includes(user._id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background font-body text-card-foreground"
    >
      <div className="mx-auto max-w-4xl p-8">
        <Link
          to="/blogs"
          className="mb-6 inline-flex items-center text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all blogs
        </Link>

        <motion.img
          src={blog.featuredImage?.url || "https://placehold.co/1200x600/e0e0e0/333333?text=Blog+Featured+Image"}
          alt={blog.featuredImage?.altText || blog.title}
          className="h-96 w-full rounded-xl object-cover shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <article className="mt-8">
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
                {blog.category}
              </span>
              <span>Published on {new Date(blog.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLikePost}
                className={`flex items-center space-x-1 rounded-full px-3 py-1 transition-colors ${
                  userHasLiked
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Heart size={18} fill={userHasLiked ? "currentColor" : "none"} />
                <span>{blog.meta?.likes?.length || 0}</span>
              </button>
              <div className="flex items-center space-x-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                <MessageCircle size={18} />
                <span>{blog.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground md:text-5xl">
            {blog.title}
          </h1>
          <p className="mt-4 text-xl font-medium text-muted-foreground">{blog.excerpt}</p>

          <hr className="my-8 border-border" />

          <div
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* --- Comments Section --- */}
        <section className="mt-12 rounded-lg bg-card p-6 shadow-md">
          <h2 className="mb-6 text-3xl font-heading font-bold text-card-foreground">Comments</h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8 flex items-center space-x-3">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-grow rounded-md border border-border bg-input px-4 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <motion.button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={20} className="mr-2" /> Post
              </motion.button>
            </form>
          ) : (
            <p className="mb-8 text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Log in</Link> to leave a comment.
            </p>
          )}

          {/* List of Comments */}
          <div className="space-y-6">
            <AnimatePresence>
              {blog.comments && blog.comments.length > 0 ? (
                [...blog.comments].reverse().map((comment) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-lg p-4 ${comment.isDeleted ? 'bg-muted opacity-60' : 'bg-muted'}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img src={comment.user.profileInfo?.avatar} alt="" className="w-10 h-10 object-cover rounded-full"/>
                        <span className="font-semibold text-card-foreground">
                          {comment.user?.fullName || "Anonymous"}
                        </span>
                        {isVerifiedAuthor(comment.user) && (
                          <Verified size={16} className="text-accent-foreground" title="Verified Author" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user && (user._id === comment.user?._id || user.role === 'admin' || user.role === 'instructor') && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete Comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {comment.isDeleted ? "This comment has been deleted." : comment.content}
                    </p>

                    {/* Replies Section */}
                    <div className="mt-4 ml-4 space-y-4 border-l-2 border-border pl-4">
                      <AnimatePresence>
                        {comment.replies && comment.replies.length > 0 && (
                          [...comment.replies].reverse().map((reply) => (
                            <motion.div
                              key={reply._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="rounded-md bg-secondary p-3"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-secondary-foreground">
                                    {reply.user?.fullName || "Anonymous"}
                                  </span>
                                  {isVerifiedAuthor(reply.user) && (
                                    <Verified size={14} className="text-accent-foreground" title="Verified Author" />
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {user && (user._id === reply.user?._id || user.role === 'admin' || user.role === 'instructor') && (
                                  <button
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    className="text-destructive hover:text-destructive/80"
                                    title="Delete Reply"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                              <p className="text-secondary-foreground">{reply.content}</p>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>

                      {/* Add Reply Form */}
                      {user && !comment.isDeleted && (
                        <form onSubmit={(e) => handleAddReply(e, comment._id)} className="mt-3 flex items-center space-x-2">
                          <input
                            type="text"
                            value={replyContent[comment._id] || ""}
                            onChange={(e) =>
                              setReplyContent((prev) => ({
                                ...prev,
                                [comment._id]: e.target.value,
                              }))
                            }
                            placeholder="Add a reply..."
                            className="flex-grow rounded-md border border-border bg-input px-3 py-1.5 text-sm text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                          />
                          <motion.button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Send size={16} />
                          </motion.button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default BlogDetails;