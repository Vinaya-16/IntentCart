import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
    returnId: {
        type: String,
        unique: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
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
    reason: {
        type: String,
        enum: ['damaged', 'wrong_size', 'wrong_item', 'color_mismatch', 'defective', 'changed_mind', 'other'],
        required: true
    },
    reasonDescription: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'quality_inspection', 'refund_processed', 'completed'],
        default: 'pending'
    },
    refundMethod: {
        type: String,
        enum: ['original_payment', 'wallet_credit', 'replacement'],
        default: 'original_payment'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    pickupAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    pickupScheduledAt: {
        type: Date
    },
    pickedUpAt: {
        type: Date
    },
    qualityCheckNotes: {
        type: String,
        trim: true
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    refundProcessedAt: {
        type: Date
    },
    images: [{
        type: String
    }],
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

returnSchema.pre('save', function (next) {
    if (!this.returnId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.returnId = `RET-${timestamp}${random}`;
    }
    next();
});

returnSchema.index({ orderId: 1 });
returnSchema.index({ customerId: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ returnId: 1 });

const Return = mongoose.model('Return', returnSchema);
export default Return;