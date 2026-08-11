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

    // Discount Details
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
        min: 0,
        default: 0
    },
    couponCode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },

    // Schedule
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },

    // Limits
    minOrderAmount: {
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
    budget: {
        type: Number,
        min: 0,
        default: 0
    },

    // Targeting (Optional - Advanced)
    targetProducts: {
        type: String,
        enum: ['all', 'selected', 'categories'],
        default: 'all'
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    categoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    customerTiers: {
        type: String,
        enum: ['all', 'platinum', 'gold', 'silver', 'bronze', 'new_customers', 'inactive_customers'],
        default: 'all'
    },

    // Optional: Add priority for campaign stacking
    priority: {
        type: Number,
        min: 0,
        max: 10,
        default: 5,
        description: 'Higher priority campaigns apply first (1-10)'
    },

    // Optional: Add campaign image/banner
    imageUrl: {
        type: String,
        trim: true
    },

    // Performance Tracking
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

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Middleware to convert string arrays to ObjectId arrays before saving
campaignSchema.pre('save', function (next) {
    // Convert productIds
    if (this.productIds && Array.isArray(this.productIds)) {
        this.productIds = this.productIds
            .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
            .map(id => new mongoose.Types.ObjectId(id));
    }

    // Convert categoryIds
    if (this.categoryIds && Array.isArray(this.categoryIds)) {
        this.categoryIds = this.categoryIds
            .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
            .map(id => new mongoose.Types.ObjectId(id));
    }

    next();
});

// Middleware for findOneAndUpdate and updateMany
campaignSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();

    // Convert productIds in update
    if (update.$set && update.$set.productIds && Array.isArray(update.$set.productIds)) {
        update.$set.productIds = update.$set.productIds
            .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
            .map(id => new mongoose.Types.ObjectId(id));
    }

    // Convert categoryIds in update
    if (update.$set && update.$set.categoryIds && Array.isArray(update.$set.categoryIds)) {
        update.$set.categoryIds = update.$set.categoryIds
            .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
            .map(id => new mongoose.Types.ObjectId(id));
    }

    next();
});

// Indexes
campaignSchema.index({ merchantId: 1, status: 1 });
campaignSchema.index({ merchantId: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ couponCode: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;