import mongoose from 'mongoose';

const recoveryAnalyticsSchema = new mongoose.Schema({
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: [
            'cart_abandoned',
            'checkout_abandoned',
            'recovery_email_sent',
            'recovery_email_opened',
            'recovery_email_clicked',
            'recovery_sms_sent',
            'recovery_push_sent',
            'recovery_converted',
            'recovery_expired'
        ],
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    cartItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        quantity: Number,
        price: Number,
        variant: String
    }],
    cartTotal: {
        type: Number,
        default: 0
    },
    abandonmentReason: {
        type: String,
        enum: ['shipping_costs', 'just_browsing', 'account_creation', 'payment_issue', 'high_price', 'technical_issue', 'other'],
        default: 'other'
    },
    exitPage: String,
    deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'other'],
        default: 'desktop'
    },
    city: String,
    country: String,
    pageViews: {
        type: Number,
        default: 0
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    intentScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    recoveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'opened', 'clicked', 'converted', 'expired'],
        default: 'pending'
    },
    recoveryMethod: {
        type: String,
        enum: ['email', 'sms', 'push', 'none'],
        default: 'none'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance
recoveryAnalyticsSchema.index({ merchantId: 1, createdAt: -1 });
recoveryAnalyticsSchema.index({ merchantId: 1, eventType: 1, createdAt: -1 });
recoveryAnalyticsSchema.index({ merchantId: 1, recoveryStatus: 1 });
recoveryAnalyticsSchema.index({ sessionId: 1 });
recoveryAnalyticsSchema.index({ customerId: 1 });

const RecoveryAnalytics = mongoose.model('RecoveryAnalytics', recoveryAnalyticsSchema);
export default RecoveryAnalytics;