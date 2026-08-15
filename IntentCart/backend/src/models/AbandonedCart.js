// models/AbandonedCart.js
import mongoose from 'mongoose';

const abandonedItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
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
});

const abandonedCartSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer ID is required'],
        index: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Merchant ID is required'],
        index: true
    },
    items: [abandonedItemSchema],
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
    },
    // Track the removal context
    removalType: {
        type: String,
        enum: ['single_item', 'clear_all'],
        required: true
    },
    removedItemsCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['abandoned', 'recovery_attempted', 'recovered'],
        default: 'abandoned'
    },
    recoveryAttempts: {
        type: Number,
        default: 0
    },
    lastRecoveryAttempt: {
        type: Date
    },
    recoveredAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better query performance
abandonedCartSchema.index({ merchantId: 1, status: 1 });
abandonedCartSchema.index({ merchantId: 1, createdAt: -1 });
abandonedCartSchema.index({ status: 1, createdAt: 1 });

// Virtual for total items count
abandonedCartSchema.virtual('itemsCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Ensure virtuals are included in JSON output
abandonedCartSchema.set('toJSON', { virtuals: true });
abandonedCartSchema.set('toObject', { virtuals: true });

const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);
export default AbandonedCart;