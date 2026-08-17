import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal - this.discount;
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;