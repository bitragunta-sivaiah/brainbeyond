import mongoose from 'mongoose';

// Reusing the robust comment schema
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const blogPostSchema = new mongoose.Schema({
  // Core Content & SEO
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    required: true,
    maxLength: 300,
  },
  featuredImage: {
    url: String,
    altText: String,
  },

  // Author & Publishing
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,

  // =======================================================
  // NEW: Social Share Links Section
  // =======================================================
  socialShareLinks: {
    youtube: String,
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    other:String
  },
  // =======================================================
  
  category: {
    type: String,
    enum: {
      values: ['Web Development', 'Data Science', 'Mobile Development', 'Design', 'Marketing', 'Other'],
      message: '{VALUE} is not a valid category.',
    },
    required: [true, 'Course category is required.'],
  },
  customCategoryName: {
    type: String,
    trim: true,
    minlength: [2, 'Custom category name must be at least 2 characters.'],
    maxlength: [100, 'Custom category name cannot exceed 100 characters.'],
    required: function() {
      return this.category === 'Other';
    },
  },
  tags: [String],

  // Integration with LMS Content
  relatedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  
  // User Engagement & Analytics
  meta: {
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    readTime: Number,
  },
  comments: [commentSchema],

}, {
  timestamps: true,
});

export default mongoose.model('BlogPost', blogPostSchema);