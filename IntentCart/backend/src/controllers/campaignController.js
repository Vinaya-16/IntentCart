import Campaign from '../models/Campaign.js';
import CampaignLog from '../models/CampaignLog.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Notification from '../models/Notifications.js';

// ==================== CAMPAIGN MANAGEMENT ====================

// @desc    Create campaign
// @route   POST /api/merchant/campaigns
// @access  Private (Merchant)
export const createCampaign = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const campaignData = req.body;

        // Generate unique coupon code if type is coupon
        if (campaignData.type === 'coupon' && !campaignData.couponCode) {
            campaignData.couponCode = generateCouponCode();
        }

        const campaign = await Campaign.create({
            ...campaignData,
            merchantId,
            createdBy: merchantId
        });

        // Create log with 'created' event
        await CampaignLog.create({
            campaignId: campaign._id,
            merchantId,
            eventType: 'created',
            metadata: { campaignName: campaign.name }
        });

        res.status(201).json({
            success: true,
            message: 'Campaign created successfully',
            campaign
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all campaigns
// @route   GET /api/merchant/campaigns
// @access  Private (Merchant)
export const getCampaigns = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { status, type, page = 1, limit = 20 } = req.query;

        const query = { merchantId };
        if (status) query.status = status;
        if (type) query.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const campaigns = await Campaign.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Campaign.countDocuments(query);

        res.status(200).json({
            success: true,
            count: campaigns.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            campaigns
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get campaign by ID
// @route   GET /api/merchant/campaigns/:id
// @access  Private (Merchant)
export const getCampaignById = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;

        const campaign = await Campaign.findOne({ _id: id, merchantId });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Get campaign logs
        const logs = await CampaignLog.find({ campaignId: id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('customerId', 'name email');

        res.status(200).json({
            success: true,
            campaign,
            logs
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update campaign
// @route   PUT /api/merchant/campaigns/:id
// @access  Private (Merchant)
export const updateCampaign = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;
        const updates = req.body;

        const campaign = await Campaign.findOne({ _id: id, merchantId });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Don't allow updating if campaign is active
        if (campaign.status === 'active' && updates.status && updates.status !== 'active') {
            // Allow pausing
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        // Create log
        await CampaignLog.create({
            campaignId: updatedCampaign._id,
            merchantId,
            eventType: 'updated',
            metadata: {
                campaignName: updatedCampaign.name,
                updatedFields: Object.keys(updates)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Campaign updated successfully',
            campaign: updatedCampaign
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update campaign status
// @route   PUT /api/merchant/campaigns/:id/status
// @access  Private (Merchant)
export const updateCampaignStatus = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const campaign = await Campaign.findOne({ _id: id, merchantId });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        const oldStatus = campaign.status;
        campaign.status = status;
        await campaign.save();

        // Map status changes to appropriate event types
        let eventType = 'updated';
        if (status === 'active' && oldStatus !== 'active') {
            eventType = 'activated';
        } else if (status === 'paused') {
            eventType = 'paused';
        } else if (status === 'scheduled' && oldStatus === 'draft') {
            eventType = 'scheduled';
        } else if (status === 'completed') {
            eventType = 'completed';
        } else if (status === 'cancelled') {
            eventType = 'cancelled';
        } else if (status === 'active' && oldStatus === 'paused') {
            eventType = 'resumed';
        }

        // Create log
        await CampaignLog.create({
            campaignId: campaign._id,
            merchantId,
            eventType: eventType,
            metadata: {
                oldStatus,
                newStatus: status,
                campaignName: campaign.name
            }
        });

        res.status(200).json({
            success: true,
            message: 'Campaign status updated',
            campaign
        });
    } catch (error) {
        console.error('Error updating campaign status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete campaign
// @route   DELETE /api/merchant/campaigns/:id
// @access  Private (Merchant)
export const deleteCampaign = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;

        const campaign = await Campaign.findOne({ _id: id, merchantId });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        if (campaign.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete an active campaign. Please pause or complete it first.'
            });
        }

        await campaign.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Campaign deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Validate coupon code
// @route   POST /api/merchant/campaigns/validate-coupon
// @access  Private (Customer)
export const validateCoupon = async (req, res) => {
    try {
        const { couponCode, customerId, orderAmount } = req.body;

        const campaign = await Campaign.findOne({
            couponCode: couponCode.toUpperCase(),
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

        // Check max uses
        if (campaign.maxUses > 0 && campaign.totalUses >= campaign.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has reached its maximum usage limit'
            });
        }

        // Check min order amount
        if (orderAmount && campaign.minOrderAmount > 0 && orderAmount < campaign.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${campaign.minOrderAmount} required`,
                minOrderAmount: campaign.minOrderAmount
            });
        }

        // Check if customer has already used this coupon
        if (campaign.maxUsesPerCustomer > 0 && customerId) {
            const uses = await CampaignLog.countDocuments({
                campaignId: campaign._id,
                customerId: customerId,
                eventType: 'converted'
            });
            if (uses >= campaign.maxUsesPerCustomer) {
                return res.status(400).json({
                    success: false,
                    message: `You have already used this coupon ${uses} time(s)`
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (campaign.discountType === 'percentage') {
            discountAmount = (orderAmount || 0) * (campaign.discountValue / 100);
            if (campaign.maxDiscountAmount > 0 && discountAmount > campaign.maxDiscountAmount) {
                discountAmount = campaign.maxDiscountAmount;
            }
        } else if (campaign.discountType === 'fixed') {
            discountAmount = campaign.discountValue;
        }

        res.status(200).json({
            success: true,
            coupon: {
                code: campaign.couponCode,
                type: campaign.type,
                discountType: campaign.discountType,
                discountValue: campaign.discountValue,
                discountAmount: Math.round(discountAmount),
                maxDiscountAmount: campaign.maxDiscountAmount,
                minOrderAmount: campaign.minOrderAmount,
                description: campaign.description,
                name: campaign.name
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Apply coupon to order
// @route   POST /api/merchant/campaigns/apply-coupon
// @access  Private (Customer)
export const applyCoupon = async (req, res) => {
    try {
        const { couponCode, customerId, orderId, orderAmount } = req.body;

        const campaign = await Campaign.findOne({
            couponCode: couponCode.toUpperCase(),
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

        // Update campaign stats
        campaign.totalUses += 1;
        campaign.totalRevenue += orderAmount || 0;
        campaign.totalConversions += 1;
        await campaign.save();

        // Create log
        await CampaignLog.create({
            campaignId: campaign._id,
            merchantId: campaign.merchantId,
            eventType: 'converted',
            customerId: customerId,
            orderId: orderId,
            couponCode: campaign.couponCode,
            discountAmount: campaign.discountValue,
            orderAmount: orderAmount
        });

        // Create notification for merchant
        await Notification.create({
            title: 'Coupon Used!',
            message: `Coupon "${campaign.couponCode}" was used on an order worth ₹${orderAmount}`,
            type: 'success',
            category: 'Orders',
            panel: 'merchant',
            merchantId: campaign.merchantId,
            isGlobal: false,
            metadata: { campaignId: campaign._id, orderId }
        });

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            discount: campaign.discountValue
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get campaign stats
// @route   GET /api/merchant/campaigns/stats
// @access  Private (Merchant)
export const getCampaignStats = async (req, res) => {
    try {
        const merchantId = req.user._id;

        const activeCampaigns = await Campaign.countDocuments({
            merchantId,
            status: 'active'
        });

        const totalConversions = await Campaign.aggregate([
            { $match: { merchantId } },
            { $group: { _id: null, total: { $sum: '$totalConversions' } } }
        ]);

        const totalRevenue = await Campaign.aggregate([
            { $match: { merchantId } },
            { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
        ]);

        // Get campaign type distribution
        const typeDistribution = await Campaign.aggregate([
            { $match: { merchantId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Get channel performance
        const channelPerformance = await CampaignLog.aggregate([
            { $match: { merchantId } },
            { $group: { _id: '$eventType', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                activeCampaigns,
                totalConversions: totalConversions[0]?.total || 0,
                totalRevenue: totalRevenue[0]?.total || 0,
                typeDistribution,
                channelPerformance
            }
        });
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to generate coupon code
const generateCouponCode = () => {
    const prefix = 'CAMP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
};