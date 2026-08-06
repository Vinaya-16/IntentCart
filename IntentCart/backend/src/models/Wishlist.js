import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    index: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure unique product in wishlist
wishlistSchema.index({ customerId: 1, 'products.productId': 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;