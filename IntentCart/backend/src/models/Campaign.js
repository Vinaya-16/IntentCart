import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true,
        maxlength: [100, 'Campaign name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['discount', 'coupon', 'free_shipping', 'loyalty_reward', 'bogo', 'flash_sale'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
        default: 'draft'
    },
    // Discount/Coupon Details
    discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'free_shipping'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        min: 0,
        default: 0
    },
    maxDiscountAmount: {
        type: Number,
        min: 0
    },
    couponCode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    // Targeting
    targetSegments: [{
        type: String,
        enum: ['all', 'top_tier', 'middle_tier', 'bottom_tier', 'new_customers', 'inactive_customers']
    }],
    targetCustomerIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Schedule
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    // Budget & Limits
    budget: {
        type: Number,
        min: 0,
        default: 0
    },
    maxUses: {
        type: Number,
        min: 0,
        default: 0 // 0 = unlimited
    },
    maxUsesPerCustomer: {
        type: Number,
        min: 0,
        default: 1
    },
    minOrderAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    // Performance
    totalUses: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    totalConversions: {
        type: Number,
        default: 0
    },
    // Products/Categories targeting
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    categoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
campaignSchema.index({ merchantId: 1, status: 1 });
campaignSchema.index({ merchantId: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ couponCode: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;