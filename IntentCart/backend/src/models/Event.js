import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
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
    eventType: {
        type: String,
        enum: [
            // Product related
            'product_viewed',
            'product_search',
            'product_abandoned',
            
            // Cart related
            'cart_viewed',
            'add_to_cart',
            'remove_from_cart',
            'cart_abandoned',
            'cart_restored',
            
            // Checkout related
            'checkout_started',
            'checkout_viewed',
            'checkout_abandoned',
            
            // Payment related
            'payment_failed',
            'payment_success',
            
            // Purchase related
            'purchase_completed',
            
            // Wishlist related
            'wishlist_viewed',
            'wishlist_added',
            'wishlist_removed',
            'wishlist_abandoned',
            
            // Category related
            'category_viewed',
            'homepage_viewed',
            
            // Recovery related
            'recovery_email_sent',
            'recovery_email_opened',
            'recovery_email_clicked',
            'recovery_converted',
            
            // Page tracking
            'page_view',
            
            // Tab visibility
            'tab_hidden',
            'tab_visible',
            
            // User related
            'user_login',
            'user_logout',
            
            // Order related
            'order_success_viewed',
            
            // Generic
            'other'
        ],
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
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
    recoveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'opened', 'clicked', 'converted', 'failed', 'expired'],
        default: 'pending'
    },
    recoverySentAt: Date,
    recoveryOpenedAt: Date,
    recoveryClickedAt: Date,
    recoveredAt: Date,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    userAgent: String,
    ipAddress: String,
    referrer: String,
    url: String,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
eventSchema.index({ sessionId: 1, createdAt: -1 });
eventSchema.index({ customerId: 1, createdAt: -1 });
eventSchema.index({ eventType: 1, createdAt: -1 });
eventSchema.index({ recoveryStatus: 1 });
eventSchema.index({ createdAt: -1 });

// Pre-save middleware
eventSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get abandonment stats
eventSchema.statics.getAbandonmentStats = async function(sessionId) {
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