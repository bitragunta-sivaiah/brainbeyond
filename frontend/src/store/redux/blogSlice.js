import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/api";
import { toast } from "react-hot-toast";

// Initial state for the blog slice
const initialState = {
  blogs: [],
  blog: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// --- Async Thunks ---

// Create a new blog post
export const createBlogPost = createAsyncThunk(
  "blog/create",
  async (blogData, thunkAPI) => {
    try {
      const { user } = thunkAPI.getState().auth;
    
      const response = await API.post("/blogs", blogData);
      toast.success("Blog post created successfully!");
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all published blog posts
export const getBlogs = createAsyncThunk(
  "blog/getAll",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/blogs");
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get a single blog post by slug
export const getSingleBlog = createAsyncThunk(
  "blog/getSingle",
  async (slug, thunkAPI) => {
    try {
      const response = await API.get(`/blogs/${slug}`);
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update a blog post
export const updateBlogPost = createAsyncThunk(
  "blog/update",
  async ({ blogId, blogData }, thunkAPI) => {
    try {
      const { user } = thunkAPI.getState().auth;
    
      const response = await API.put(`/blogs/${blogId}`, blogData);
      toast.success("Blog post updated successfully!");
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a blog post
export const deleteBlogPost = createAsyncThunk(
  "blog/delete",
  async (blogId, thunkAPI) => {
    try {
     
    
      await API.delete(`/blogs/${blogId}`);
      toast.success("Blog post deleted successfully!");
      return blogId;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add a new comment
export const addComment = createAsyncThunk(
  "blog/addComment",
  async ({ blogId, content }, thunkAPI) => {
    try {
      
    
      const response = await API.post(`/blogs/${blogId}/comments`, { content });
      toast.success("Comment added!");
      return { comment: response.data, blogId };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a comment
export const deleteComment = createAsyncThunk(
  "blog/deleteComment",
  async ({ blogId, commentId }, thunkAPI) => {
    try {
       
    
      await API.delete(`/blogs/${blogId}/comments/${commentId}`);
      toast.success("Comment deleted!");
      return { blogId, commentId };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add a reply to a comment
export const addReply = createAsyncThunk(
  "blog/addReply",
  async ({ blogId, commentId, content }, thunkAPI) => {
    try {
      
    
      const response = await API.post(`/blogs/${blogId}/comments/${commentId}/replies`, { content });
      toast.success("Reply added!");
      return { reply: response.data, blogId, commentId };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a reply
export const deleteReply = createAsyncThunk(
  "blog/deleteReply",
  async ({ blogId, commentId, replyId }, thunkAPI) => {
    try {
 
    
      await API.delete(`/blogs/${blogId}/comments/${commentId}/replies/${replyId}`);
      toast.success("Reply deleted!");
      return { blogId, commentId, replyId };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Like a blog post
export const likePost = createAsyncThunk(
  "blog/like",
  async (blogId, thunkAPI) => {
    try {
      const { user } = thunkAPI.getState().auth;
    
      const response = await API.put(`/blogs/${blogId}/like`, {});
      toast.success(response.data.message);
      return { blogId, userId: user._id };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Unlike a blog post
export const unlikePost = createAsyncThunk(
  "blog/unlike",
  async (blogId, thunkAPI) => {
    try {
      const { user } = thunkAPI.getState().auth;
    
      const response = await API.put(`/blogs/${blogId}/unlike`, {});
      toast.success(response.data.message);
      return { blogId, userId: user._id };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- Blog Slice ---

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // General Thunks (Loading, Success, Error)
      .addCase(createBlogPost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBlogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSingleBlog.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBlogPost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBlogPost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addComment.pending, (state) => {
        // Comment/Reply actions don't reset the main loading state
      })
      .addCase(addReply.pending, (state) => {
        // Comment/Reply actions don't reset the main loading state
      })
      .addCase(likePost.pending, (state) => {
        // Comment/Reply actions don't reset the main loading state
      })
      .addCase(unlikePost.pending, (state) => {
        // Comment/Reply actions don't reset the main loading state
      })

      // Create Blog
      .addCase(createBlogPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.blogs.push(action.payload);
      })
      // Get Blogs
      .addCase(getBlogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.blogs = action.payload;
      })
      // Get Single Blog
      .addCase(getSingleBlog.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.blog = action.payload;
      })
      // Update Blog
      .addCase(updateBlogPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.blog = action.payload;
        state.blogs = state.blogs.map((blog) =>
          blog._id === action.payload._id ? action.payload : blog
        );
      })
      // Delete Blog
      .addCase(deleteBlogPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.blogs = state.blogs.filter((blog) => blog._id !== action.payload);
        state.blog = null;
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          state.blog.comments.push(action.payload.comment);
        }
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          const comment = state.blog.comments.find(c => c._id === action.payload.commentId);
          if(comment) {
            comment.isDeleted = true;
          }
        }
      })
      // Add Reply
      .addCase(addReply.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          const comment = state.blog.comments.find(
            (c) => c._id === action.payload.commentId
          );
          if (comment) {
            comment.replies.push(action.payload.reply);
          }
        }
      })
      // Delete Reply
      .addCase(deleteReply.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          const comment = state.blog.comments.find(
            (c) => c._id === action.payload.commentId
          );
          if (comment) {
            comment.replies = comment.replies.filter(r => r._id !== action.payload.replyId);
          }
        }
      })
      // Like Post
      .addCase(likePost.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          state.blog.meta.likes.push(action.payload.userId);
        }
      })
      // Unlike Post
      .addCase(unlikePost.fulfilled, (state, action) => {
        if (state.blog && state.blog._id === action.payload.blogId) {
          state.blog.meta.likes = state.blog.meta.likes.filter(
            (id) => id !== action.payload.userId
          );
        }
      })

      // Error handling for all thunks
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
        }
      );
  },
});

export const { reset } = blogSlice.actions;
export default blogSlice.reducer;