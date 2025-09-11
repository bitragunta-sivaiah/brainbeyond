import express from 'express';
import slugify from 'slugify';
import BlogPost from '../models/Blog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Create a new blog post
 * @route   POST /api/blogs
 * @access  Private (Admin, Instructor)
 */
router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      featuredImage,
      category,
      customCategoryName,
      tags,
      relatedCourses,
      socialShareLinks // Added socialShareLinks
    } = req.body;

    if (!title || !content || !excerpt) {
      return res.status(400).json({ message: 'Title, content, and excerpt are required.' });
    }

    // Handle custom category logic
    let finalCategory = category;
    if (category === 'Other') {
      if (!customCategoryName) {
        return res.status(400).json({ message: 'Custom category name is required when category is "Other".' });
      }
      finalCategory = customCategoryName;
    }

    // Generate a unique slug
    const slug = slugify(title, { lower: true, strict: true, locale: 'en' });
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return res.status(400).json({ message: 'A blog post with this title already exists. Please choose a different title.' });
    }

    const newBlogPost = new BlogPost({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      author: req.user._id,
      category: finalCategory, // Store the final category name
      tags,
      relatedCourses,
      socialShareLinks, // Included socialShareLinks
    });

    const createdBlogPost = await newBlogPost.save();
    res.status(201).json(createdBlogPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Get all published blog posts
 * @route   GET /api/blogs
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const blogs = await BlogPost.find( )
      .sort({ publishedAt: -1 })
      .populate('author', 'profileInfo.firstName profileInfo.lastName profileInfo.avatar role username');

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Get a single blog post by slug with comments and likes
 * @route   GET /api/blogs/:slug
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
  try {
    const blogPost = await BlogPost.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'profileInfo.firstName profileInfo.lastName profileInfo.avatar')
      .populate({
        path: 'comments.user',
        select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar role username',
      })
      .populate({
        path: 'comments.replies.user',
        select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar role username',
      });
    
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found or not published.' });
    }

    // Increment view count
    blogPost.meta.views = blogPost.meta.views + 1;
    await blogPost.save();

    res.status(200).json(blogPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Update a blog post
 * @route   PUT /api/blogs/:id
 * @access  Private (Author or Admin)
 */
router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const isAuthor = blogPost.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this blog post.' });
    }

    const {
      title,
      content,
      excerpt,
      featuredImage,
      category,
      customCategoryName,
      tags,
      relatedCourses,
      isPublished,
      socialShareLinks // Added socialShareLinks
    } = req.body;

    if (title) blogPost.title = title;
    if (content) blogPost.content = content;
    if (excerpt) blogPost.excerpt = excerpt;
    if (featuredImage) blogPost.featuredImage = featuredImage;
    if (tags) blogPost.tags = tags;
    if (relatedCourses) blogPost.relatedCourses = relatedCourses;
    
    // Handle category update logic
    if (category) {
      if (category === 'Other') {
        if (!customCategoryName) {
          return res.status(400).json({ message: 'Custom category name is required when category is "Other".' });
        }
        blogPost.category = customCategoryName;
      } else {
        blogPost.category = category;
      }
    }

    // Update socialShareLinks if provided
    if (socialShareLinks) {
      blogPost.socialShareLinks = socialShareLinks;
    }

    if (title && blogPost.title !== title) {
      blogPost.slug = slugify(title, { lower: true, strict: true, locale: 'en' });
    }

    if (isPublished !== undefined && isPublished !== blogPost.isPublished) {
      blogPost.isPublished = isPublished;
      if (isPublished && !blogPost.publishedAt) {
        blogPost.publishedAt = Date.now();
      }
    }

    const updatedBlogPost = await blogPost.save();
    res.status(200).json(updatedBlogPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Delete a blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private (Author or Admin)
 */
router.delete('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const isAuthor = blogPost.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this blog post.' });
    }

    await blogPost.deleteOne();
    res.status(200).json({ message: 'Blog post removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =================================================================
// Routes for Comments, Replies, and Likes
// =================================================================

/**
 * @desc    Create a new comment on a blog post
 * @route   POST /api/blogs/:id/comments
 * @access  Private
 */
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const newComment = {
      user: req.user._id,
      content,
    };

    blogPost.comments.push(newComment);
    await blogPost.save();
    
    // To return the populated comment, we find it again
    const savedPost = await BlogPost.findById(req.params.id).populate('comments.user', 'profileInfo.firstName profileInfo.lastName profileInfo.avatar');
    const addedComment = savedPost.comments[savedPost.comments.length - 1];

    res.status(201).json(addedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Update an existing comment
 * @route   PUT /api/blogs/:id/comments/:commentId
 * @access  Private (Comment author or Admin)
 */
router.put('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const comment = blogPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this comment.' });
    }

    comment.content = content || comment.content;
    comment.updatedAt = Date.now(); // Manually set updatedAt as embedded schemas don't have it by default

    await blogPost.save();
    res.status(200).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Delete a comment (soft delete)
 * @route   DELETE /api/blogs/:id/comments/:commentId
 * @access  Private (Comment author or Admin)
 */
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const comment = blogPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment.' });
    }

    comment.isDeleted = true; // Soft delete
    await blogPost.save();
    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Add a reply to a comment
 * @route   POST /api/blogs/:id/comments/:commentId/replies
 * @access  Private
 */
router.post('/:id/comments/:commentId/replies', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const comment = blogPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const newReply = {
      user: req.user._id,
      content,
      createdAt: Date.now(),
    };

    comment.replies.push(newReply);
    await blogPost.save();
    
    // To return the populated reply, we find it again
    const savedPost = await BlogPost.findById(req.params.id).populate({
      path: 'comments.replies.user',
      select: 'profileInfo.firstName profileInfo.lastName profileInfo.avatar',
    });
    const updatedComment = savedPost.comments.id(req.params.commentId);
    const addedReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.status(201).json(addedReply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Delete a reply
 * @route   DELETE /api/blogs/:id/comments/:commentId/replies/:replyId
 * @access  Private (Reply author or Admin)
 */
router.delete('/:id/comments/:commentId/replies/:replyId', protect, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const comment = blogPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found.' });
    }

    const isAuthor = reply.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this reply.' });
    }

    comment.replies.pull({ _id: req.params.replyId });
    await blogPost.save();
    res.status(200).json({ message: 'Reply deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


/**
 * @desc    Like a blog post
 * @route   PUT /api/blogs/:id/like
 * @access  Private
 */
router.put('/:id/like', protect, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    // Check if the user has already liked the post
    const hasLiked = blogPost.meta.likes.includes(req.user._id);
    if (hasLiked) {
      return res.status(400).json({ message: 'You have already liked this post.' });
    }

    // Add user's ID to the likes array
    blogPost.meta.likes.push(req.user._id);
    await blogPost.save();
    
    res.status(200).json({ message: 'Post liked successfully.', likesCount: blogPost.meta.likes.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @desc    Unlike a blog post
 * @route   PUT /api/blogs/:id/unlike
 * @access  Private
 */
router.put('/:id/unlike', protect, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    // Check if the user has already liked the post
    const hasLiked = blogPost.meta.likes.includes(req.user._id);
    if (!hasLiked) {
      return res.status(400).json({ message: 'You have not liked this post.' });
    }

    // Remove user's ID from the likes array
    blogPost.meta.likes.pull(req.user._id);
    await blogPost.save();
    
    res.status(200).json({ message: 'Post unliked successfully.', likesCount: blogPost.meta.likes.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;