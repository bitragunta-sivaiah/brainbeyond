import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [{
    itemType: {
      type: String,
      enum: ['Course', 'Subscription','collab_subscriptionplan'], // Use PascalCase for consistency with model names
      required: [true, 'Item type is required'],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item ID is required'],
      refPath: 'items.itemType',
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
    },
    price: {
      type: Number, // CHANGED: Replaced Decimal128 with Number
      required: [true, 'Item price is required'],
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  }],
  pricing: {
    subtotal: {
      type: Number, // CHANGED: Replaced Decimal128 with Number
      required: [true, 'Subtotal is required'],
      min: 0,
    },
    tax: {
      type: Number, // CHANGED: Replaced Decimal128 with Number
      default: 0,
      min: 0,
    },
    discount: {
      type: Number, // CHANGED: Replaced Decimal128 with Number
      default: 0,
      min: 0,
    },
    total: {
      type: Number, // CHANGED: Replaced Decimal128 with Number
      required: [true, 'Total is required'],
      min: 0,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
  },
  payment: {
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    transactionId: String, // Renamed for clarity
  },
  orderStatus: { // Renamed for clarity
    type: String,
    enum: {
      values: ['pending', 'processing', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid order status',
    },
    default: 'pending',
  },
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
});

export default mongoose.model('Order', orderSchema);