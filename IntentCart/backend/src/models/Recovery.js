import mongoose from 'mongoose';

const recoverySchema = new mongoose.Schema({
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
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    abandonmentReason: {
        type: String,
        required: true
    },
    recoveryMethod: {
        type: String,
        enum: ['email', 'sms', 'push', 'in_app'],
        default: 'email'
    },
    recoveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'opened', 'clicked', 'converted', 'failed', 'expired'],
        default: 'pending'
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailOpened: {
        type: Boolean,
        default: false
    },
    emailClicked: {
        type: Boolean,
        default: false
    },
    converted: {
        type: Boolean,
        default: false
    },
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    convertedAt: Date,
    cartItems: [{
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        price: Number
    }],
    cartTotal: Number,
    recoveryValue: {
        type: Number,
        default: 0
    },
    emailContent: String,
    emailSubject: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
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

// Indexes
recoverySchema.index({ sessionId: 1, createdAt: -1 });
recoverySchema.index({ customerId: 1, recoveryStatus: 1 });
recoverySchema.index({ recoveryStatus: 1, createdAt: 1 });

recoverySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get recovery stats
recoverySchema.statics.getRecoveryStats = async function(period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const match = {
        createdAt: { $gte: startDate }
    };

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                sent: { 
                    $sum: { $cond: [{ $eq: ['$recoveryStatus', 'sent'] }, 1, 0] }
                },
                opened: { 
                    $sum: { $cond: [{ $eq: ['$recoveryStatus', 'opened'] }, 1, 0] }
                },
                clicked: { 
                    $sum: { $cond: [{ $eq: ['$recoveryStatus', 'clicked'] }, 1, 0] }
                },
                converted: { 
                    $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, 1, 0] }
                },
                totalRevenue: { 
                    $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, '$recoveryValue', 0] }
                },
                avgRecoveryTime: { 
                    $avg: { 
                        $subtract: ['$convertedAt', '$createdAt'] 
                    }
                }
            }
        }
    ]);

    const result = stats[0] || {};
    return {
        totalAttempts: result.totalAttempts || 0,
        sent: result.sent || 0,
        opened: result.opened || 0,
        clicked: result.clicked || 0,
        converted: result.converted || 0,
        totalRevenue: result.totalRevenue || 0,
        avgRecoveryTime: result.avgRecoveryTime || 0,
        recoveryRate: result.totalAttempts > 0 
            ? ((result.converted || 0) / result.totalAttempts) * 100 
            : 0
    };
};

const Recovery = mongoose.model('Recovery', recoverySchema);
export default Recovery;