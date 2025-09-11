import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  link: String,
  position: {
    type: String,
    required: true,
    enum: ['homepage-top', 'homepage-side', 'course-side', 'article-bottom']
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
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

export default mongoose.model('Ad', adSchema);