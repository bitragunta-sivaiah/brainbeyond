import mongoose from 'mongoose';

// Define the Mongoose Schema for the Coupon
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required.'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Code must be at least 3 characters.'],
    maxlength: [50, 'Code cannot exceed 50 characters.'],
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters.'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters.'],
  },
  discountType: {
    type: String,
    enum: {
      values: ['percentage', 'fixed'],
      message: '{VALUE} is not a valid discount type.',
    },
    required: [true, 'Discount type is required.'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required.'],
    min: [0, 'Discount value cannot be negative.'],
  },
  minOrderValue: {
    type: Number,
    min: [0, 'Minimum order value cannot be negative.'],
    default: 0,
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative.'],
    // Only applicable for percentage discounts
    required: function() {
      return this.discountType === 'percentage';
    },
  },
  startDate: {
    type: Date,
   
  },
  endDate: {
    type: Date,
     
  },
  maxUses: {
    type: Number,
    min: [1, 'Maximum uses must be at least 1.'],
    default: null, // null means unlimited uses
  },
  uses: {
    type: Number,
    default: 0,
    min: 0,
  },
  usersUsed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  applicableTo: {
    type: String,
    enum: {
      values: ['all', 'courses', 'subscriptions'],
      message: '{VALUE} is not a valid applicability type.',
    },
    default: 'all',
  },
  specificItems: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'applicableTo',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  // Adding the ability to make coupons single-use per user
  isSingleUsePerUser: {
    type: Boolean,
    default: false,
  },
  // To track who created the coupon
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Adding a method to check if the coupon is currently valid
  isValid: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// A pre-save hook to check the coupon's validity status
couponSchema.pre('save', function(next) {
  const now = new Date();
  const isTimeValid = now >= this.startDate && now <= this.endDate;
  const isUseCountValid = this.maxUses === null || this.uses < this.maxUses;
  this.isActive = isTimeValid && isUseCountValid;
  // If the coupon becomes inactive, you might also want to set isValid to false
  if (!this.isActive) {
    this.isValid = false;
  }
  next();
});

// Export the Coupon model
export default mongoose.model('Coupon', couponSchema);
