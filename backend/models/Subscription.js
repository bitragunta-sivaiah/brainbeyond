import mongoose from 'mongoose';

// -----------------------------------------------------------------------------
//  Subscription Plan Schema
// -----------------------------------------------------------------------------
const subscriptionSchema = new mongoose.Schema({
  // Core Information
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  tagline: String, // Optional short selling point

  // Pricing & Billing
  pricing: {
    basePrice: {
      type: Number,
     
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: {
        values: ['USD', 'INR', 'EUR'],
        message: 'Invalid currency type',
      },
    },
    billingCycle: {
      type: String,
      enum: {
        values: ['monthly', 'quarterly', 'yearly', 'lifetime'],
        message: '{VALUE} is not a supported billing cycle',
      },
     
    },
    discountedPrice: {
      type: Number,
      min: 0,
     
    },
  },

  // Features & Access
  planType: {
    type: String,
    enum: {
      values: ['free', 'basic', 'standard', 'premium', 'pro'],
      message: '{VALUE} is not a valid plan type',
    },
    
    default: 'basic',
  },
  // Features as an embedded array
  features: [String  ],
  // Courses
  courses: {
    isAllIncluded: {
      type: Boolean,
      default: false,
    },
    includedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
  },

  // Metadata & Status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'archived'],
      message: 'Invalid status',
    },
    default: 'active',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// A virtual field to calculate the final price (discounted or base)
subscriptionSchema.virtual('finalPrice').get(function() {
  return this.pricing.discountedPrice || this.pricing.basePrice;
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;