import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: String,
    enum: ['all', 'students', 'instructors', 'specific-course'],
    default: 'all'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

export default mongoose.model('Announcement', announcementSchema);