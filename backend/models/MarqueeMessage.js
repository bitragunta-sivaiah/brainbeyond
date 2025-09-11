import mongoose from 'mongoose';

const marqueeMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  link: String,
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  priority: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

export default mongoose.model('MarqueeMessage', marqueeMessageSchema);