import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    // Identity
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
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // Core Event Type 
    eventType: {
        type: String,
        enum: [
            'product_viewed',
            'add_to_cart',
            'cart_viewed',
            'checkout_started',
            'wishlist_viewed',
            'payment_failed',

            'purchase_completed',
            'cart_restored',

            'cart_abandoned',
            'checkout_abandoned',
            'product_abandoned',
            'wishlist_abandoned',
            'recovery_email_sent'
        ],
        required: true,
        index: true
    },

    // Product Data
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],

    // Cart Data 
    cartItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        quantity: Number,
        price: Number
    }],
    cartTotal: {
        type: Number,
        default: 0
    },

    // Abandonment Analysis
    abandonmentReason: {
        type: String,
        enum: [
            'cart_aged',
            'checkout_complex',
            'wishlist_abandoned',
            'high_interest_no_purchase',
            'high_price',
            'shipping_costs',
            'payment_issue',
            'just_browsing',
            'account_creation',
            'technical_issue',
            'comparing_products',
            'waiting_for_discount',
            'other'
        ]
    },

    // Recovery Lifecycle Status
    recoveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'opened', 'clicked', 'converted', 'failed', 'expired'],
        default: 'pending'
    },

    // Timestamps (Only the ones used by the dashboard)
    recoveredAt: Date,      // When the user finally bought it
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// PERFORMANCE INDEXES
eventSchema.index({ sessionId: 1, createdAt: -1 });
eventSchema.index({ customerId: 1, createdAt: -1 });
eventSchema.index({ eventType: 1, createdAt: -1 });
eventSchema.index({ recoveryStatus: 1 });
eventSchema.index({ createdAt: -1 });

eventSchema.pre('save', function (next) {
    // Only update updatedAt if it's not a new document
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

eventSchema.statics.getAbandonmentStats = async function (sessionId) {
    const events = await this.find({ sessionId }).sort({ createdAt: -1 });

    const stats = {
        hasAddToCart: false,
        hasCheckoutStart: false,
        hasPurchaseComplete: false,
        hasPaymentFailed: false,
        productViewCount: 0,
        cartValueHistory: [],
        lastActivity: null
    };

    events.forEach(event => {
        if (event.eventType === 'add_to_cart') stats.hasAddToCart = true;
        if (event.eventType === 'checkout_started') stats.hasCheckoutStart = true;
        if (event.eventType === 'purchase_completed') stats.hasPurchaseComplete = true;
        if (event.eventType === 'payment_failed') stats.hasPaymentFailed = true;
        if (event.eventType === 'product_viewed') stats.productViewCount++;
        if (event.eventType === 'cart_viewed' || event.eventType === 'checkout_viewed') {
            stats.cartValueHistory.push({
                total: event.cartTotal || 0,
                timestamp: event.createdAt
            });
        }
        if (!stats.lastActivity || event.createdAt > stats.lastActivity) {
            stats.lastActivity = event.createdAt;
        }
    });

    return stats;
};

const Event = mongoose.model('Event', eventSchema);
export default Event;