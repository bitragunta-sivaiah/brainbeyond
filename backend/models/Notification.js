import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  navigateLink: String,  // route or URL to navigate when notification is clicked
  type: {
    type: String,
    enum: ['system', 'course', 'payment', 'support', 'event', 'announcement'],
    default: 'system'
  },
  relatedItem: {
    itemType: String,
    itemId: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);