import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: String,
  isOnline: {
    type: Boolean,
    default: false
  },
  onlineLink: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  image: String,
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  maxAttendees: Number,
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

export default mongoose.model('Event', eventSchema);