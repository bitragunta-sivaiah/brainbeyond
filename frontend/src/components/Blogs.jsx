 

 import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBlogs, getSingleBlog, reset } from "../store/redux/blogSlice";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

// Utility hook to simplify Redux state access
const useRedux = () => {
  const dispatch = useDispatch();
  const { blogs, blog, isLoading, isError, message } = useSelector(
    (state) => state.blog
  );
  return { dispatch, blogs, blog, isLoading, isError, message };
};

const BlogCard = ({ blog }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-xl bg-card shadow-lg transition-transform hover:scale-[1.02]"
    >
      <Link to={`/blogs/${blog.slug}`}>
        <img
          src={blog.featuredImage?.url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470&auto=format&fit=crop"}
          alt={blog.featuredImage?.altText || blog.title}
          className="h-60 w-full object-cover"
        />
        <div className="p-6">
          <h3 className="text-2xl font-heading font-semibold text-card-foreground">
            {blog.title}
          </h3>
          <p className="mt-2 text-muted-foreground line-clamp-3 font-body">
            {blog.excerpt}
          </p>
          <div className="mt-4 flex items-center justify-between text-sm text-primary-foreground">
            <span className="rounded-full bg-primary px-3 py-1 font-medium">
              {blog.category}
            </span>
            <span className="text-muted-foreground">
              {new Date(blog.publishedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Blogs = () => {
  const { dispatch, blogs, isLoading, isError, message } = useRedux();

  useEffect(() => {
    // Dispatch the action to fetch only published blogs
    // Assuming the `getBlogs` action can accept a filter parameter.
    // E.g., `dispatch(getBlogs({ isPublished: true }));`
    // Or you might have a dedicated action like `dispatch(getPublishedBlogs());`
    dispatch(getBlogs());
    return () => dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      console.error(message);
    }
  }, [isError, message]);

  // Filter the blogs locally to ensure only published ones are shown.
  // This is a safety net in case the API doesn't filter correctly.
  const publishedBlogs = blogs.filter(blog => blog.isPublished);

  return (
    <div className="min-h-screen bg-background p-8 font-body">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-10 text-center text-5xl font-display font-bold text-foreground">
          Our Latest Blog Posts
        </h1>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {publishedBlogs.length > 0 ? (
                publishedBlogs.map((blog) => (
                  <motion.div
                    key={blog._id}
                    variants={{
                      hidden: { opacity: 0, y: 50 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <BlogCard blog={blog} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground">
                  <p>No blog posts available at the moment.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const SingleBlog = () => {
  const { slug } = useParams();
  const { dispatch, blog, isLoading, isError, message } = useRedux();

  useEffect(() => {
    if (slug) {
      // The single blog action should fetch by slug regardless of published status
      dispatch(getSingleBlog(slug));
    }
    return () => dispatch(reset());
  }, [dispatch, slug]);

  useEffect(() => {
    if (isError) {
      console.error(message);
    }
  }, [isError, message]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Ensure the blog is not only found but also published before rendering
  if (isError || !blog || !blog.isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center text-muted-foreground">
        <p>
          Blog post not found or is not currently published.
          <br />
          <Link to="/blogs" className="text-primary hover:underline">
            Go back to all blogs
          </Link>
        </p>
      </div>
    );
  }

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
          src={blog.featuredImage?.url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470&auto=format&fit=crop"}
          alt={blog.featuredImage?.altText || blog.title}
          className="h-96 w-full rounded-xl object-cover shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <article className="mt-8">
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              {blog.category}
            </span>
            <span className="ml-4">
              Published on {new Date(blog.publishedAt).toLocaleDateString()}
            </span>
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
      </div>
    </motion.div>
  );
};

export { Blogs, SingleBlog };

export default Blogs