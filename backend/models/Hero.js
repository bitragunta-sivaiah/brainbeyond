// Proposed enhancement to models/Hero.js

import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema({
  // Existing fields
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
  },
  ctaText: {
    type: String,
    trim: true,
  },
  ctaLink: {
    type: String,
    trim: true,
  },
  specialHighlight:{type : String},
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // New field to support role-based hero pages
  role: {
    type: String,
    enum: ['admin', 'student', 'instructor', 'customercare', 'all'], // 'all' for public or default hero page
    default: 'all',
  },
});

const Hero = mongoose.model('Hero', heroSchema);

export default Hero;