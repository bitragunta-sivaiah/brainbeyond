import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url: { 
    type: String,
    required: true 
  },
  type: { 
    type: String,
    required: true
  },
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { _id: false });

const groupChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['member', 'instructor', 'admin'],
      default: 'member',
    },
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // --- FIX: Correctly defined as a simple ObjectId ---
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export default mongoose.model('GroupChat', groupChatSchema);