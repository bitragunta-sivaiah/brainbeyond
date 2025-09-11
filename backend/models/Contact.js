import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  // Name of the person submitting the form
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters.'],
    maxlength: [100, 'Name cannot exceed 100 characters.'],
  },
  // Email address of the person
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address.'],
  },
  // Subject of the message
  subject: {
    type: String,
    required: [true, 'Subject is required.'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters.'],
    maxlength: [200, 'Subject cannot exceed 200 characters.'],
  },
  // The message body
  message: {
    type: String,
    required: [true, 'Message is required.'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters.'],
    maxlength: [2000, 'Message cannot exceed 2000 characters.'],
  },
  // Status of the inquiry (e.g., pending, in-progress, resolved)
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'spam'],
    default: 'pending',
  },
  // An optional field to reference the user if they are logged in
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Not all contact messages will come from a registered user
  },
  // Internal notes for the support team
  internalNotes: [{
    note: {
      type: String,
      trim: true,
    },
    notedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User who added the note (e.g., an admin or customer care rep)
    },
    notedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Create and export the model
export default mongoose.model('Contact', contactSchema);