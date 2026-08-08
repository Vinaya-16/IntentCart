import mongoose from 'mongoose';

const campaignLogSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
        index: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['created', 'sent', 'viewed', 'clicked', 'converted', 'expired', 'cancelled', 'updated', 'paused', 'resumed', 'activated', 'scheduled', 'completed'],
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    couponCode: {
        type: String,
        trim: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    orderAmount: {
        type: Number,
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

campaignLogSchema.index({ campaignId: 1, eventType: 1 });
campaignLogSchema.index({ merchantId: 1, createdAt: -1 });

const CampaignLog = mongoose.model('CampaignLog', campaignLogSchema);
export default CampaignLog;