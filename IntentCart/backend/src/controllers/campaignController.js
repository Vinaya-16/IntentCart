import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import CampaignLog from '../models/CampaignLog.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Notification from '../models/Notifications.js';
import Product from '../models/Product.js';


// Helper: Convert string array to ObjectId array
const convertToObjectIdArray = (ids) => {
    if (!ids || !Array.isArray(ids)) return [];
    return ids
        .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
        .map(id => new mongoose.Types.ObjectId(id));
};

// Helper: Clean array - remove invalid entries and convert to ObjectId
const cleanIdArray = (ids) => {
    if (!ids || !Array.isArray(ids)) return [];
    // If it's already ObjectIds, return as is
    if (ids.length > 0 && ids[0] instanceof mongoose.Types.ObjectId) {
        return ids;
    }
    // If it's strings, convert to ObjectId
    return convertToObjectIdArray(ids);
};

// Auto-generate metadata based on campaign data
const generateMetadata = (campaignData) => {
    const metadata = campaignData.metadata || {};

    // If metadata already has a section, keep it (user manually set it)
    if (metadata.section) {
        return metadata;
    }

    // Auto-assign section based on campaign type and name
    const name = campaignData.name?.toLowerCase() || '';
    const type = campaignData.type;

    // Check for Sale Highlights
    if (
        name.includes('polo') ||
        name.includes('levis') ||
        name.includes('fahrenheit') ||
        name.includes('sale') ||
        type === 'bogo' ||
        (type === 'discount' && campaignData.discountValue >= 40)
    ) {
        return {
            ...metadata,
            section: 'sale_highlights',
            title: campaignData.name,
            subtitle: formatSubtitle(campaignData),
            offer: formatOffer(campaignData),
            discount: formatDiscountDisplay(campaignData),
            bg: getRandomColor()
        };
    }

    // Check for Deal Corner
    if (
        name.includes('allen') ||
        name.includes('elle') ||
        name.includes('elli') ||
        name.includes('ginger') ||
        name.includes('fastrack') ||
        name.includes('code') ||
        type === 'coupon'
    ) {
        return {
            ...metadata,
            section: 'deal_corner',
            brand: extractBrandName(campaignData.name),
            offer: formatOffer(campaignData)
        };
    }

    // Check for Promo Banner
    if (
        name.includes('eoss') ||
        name.includes('promo') ||
        name.includes('flash') ||
        type === 'flash_sale'
    ) {
        return {
            ...metadata,
            section: 'promo_banner',
            extraDiscount: campaignData.metadata?.extraDiscount || '10%'
        };
    }

    // Default: general section
    return {
        ...metadata,
        section: 'general'
    };
};

// Helper: Format subtitle
const formatSubtitle = (campaign) => {
    if (campaign.metadata?.subtitle) return campaign.metadata.subtitle;
    if (campaign.type === 'bogo') return 'Buy 1 Get 1';
    if (campaign.type === 'flash_sale') return 'Limited Time Offer';
    return 'Special Offer';
};

// Helper: Format offer
const formatOffer = (campaign) => {
    if (campaign.metadata?.offer) return campaign.metadata.offer;
    if (campaign.type === 'bogo') return 'Buy 1 Get 1 Free';
    if (campaign.type === 'flash_sale') return 'Flash Sale';
    if (campaign.type === 'free_shipping') return 'Free Shipping';
    if (campaign.discountType === 'percentage') {
        return `${campaign.discountValue}% Off`;
    }
    if (campaign.discountType === 'fixed') {
        return `Rs.${campaign.discountValue} Off`;
    }
    return 'Special Offer';
};

// Helper: Format discount display
const formatDiscountDisplay = (campaign) => {
    if (campaign.metadata?.discount) return campaign.metadata.discount;
    if (campaign.discountType === 'percentage') {
        return `${campaign.discountValue}% Off`;
    }
    if (campaign.discountType === 'fixed') {
        return `Rs.${campaign.discountValue} Off`;
    }
    if (campaign.type === 'bogo') return 'Free';
    if (campaign.type === 'free_shipping') return 'Free Shipping';
    return 'Special Offer';
};

// Helper: Extract brand name
const extractBrandName = (name) => {
    const brands = ['Allen', 'ELLE', 'Elli', 'Code', 'Ginger', 'Fastrack', 'Polo', 'Levis'];
    for (const brand of brands) {
        if (name.toLowerCase().includes(brand.toLowerCase())) {
            return brand;
        }
    }
    return name;
};

// Helper: Get random color
const getRandomColor = () => {
    const colors = [
        'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-900',
        'bg-purple-500', 'bg-blue-500', 'bg-teal-500',
        'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to generate coupon code
const generateCouponCode = () => {
    const prefix = 'CAMP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
};

// Helper function to get product categories
const getProductCategories = async (productId) => {
    try {
        const product = await Product.findById(productId).select('categories');
        return product?.categories || [];
    } catch (error) {
        return [];
    }
};

// ==================== CAMPAIGN MANAGEMENT ====================

// @desc    Create campaign
// @route   POST /api/merchant/campaigns
// @access  Private (Merchant)
export const createCampaign = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const campaignData = req.body;

        // Clean ObjectId arrays
        campaignData.productIds = cleanIdArray(campaignData.productIds);
        campaignData.categoryIds = cleanIdArray(campaignData.categoryIds);

        // Generate unique coupon code if type is coupon
        if (campaignData.type === 'coupon' && !campaignData.couponCode) {
            campaignData.couponCode = generateCouponCode();
        }

        // Auto-generate metadata if not provided or if section is missing
        if (!campaignData.metadata || !campaignData.metadata.section) {
            campaignData.metadata = generateMetadata(campaignData);
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
            metadata: {
                campaignName: campaign.name,
                section: campaign.metadata?.section || 'general'
            }
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

        // Validate ID format
        if (!id || typeof id !== 'string' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid campaign ID format'
            });
        }

        const campaign = await Campaign.findOne({ _id: id, merchantId });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Clean ObjectId arrays
        if (updates.productIds) {
            updates.productIds = cleanIdArray(updates.productIds);
        }
        if (updates.categoryIds) {
            updates.categoryIds = cleanIdArray(updates.categoryIds);
        }

        // Auto-generate metadata if section is not explicitly set
        if (!updates.metadata || !updates.metadata.section) {
            const mergedData = { ...campaign.toObject(), ...updates };
            updates.metadata = generateMetadata(mergedData);
        }

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.merchantId;
        delete updates.createdBy;
        delete updates.totalUses;
        delete updates.totalRevenue;
        delete updates.totalConversions;
        delete updates.createdAt;
        delete updates.updatedAt;

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
                section: updatedCampaign.metadata?.section || 'general',
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
                message: `Minimum order amount of Rs.${campaign.minOrderAmount} required`,
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
            message: `Coupon "${campaign.couponCode}" was used on an order worth Rs.${orderAmount}`,
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


// @desc    Check if product is eligible for campaign
// @access  Private
const isProductEligible = (campaign, productId, productCategoryIds) => {
    // Check targeting type
    switch (campaign.targetProducts) {
        case 'all':
            return true;
        case 'selected':
            return campaign.productIds && campaign.productIds.some(id => id.toString() === productId.toString());
        case 'categories':
            // Check if product belongs to any targeted category
            if (!campaign.categoryIds || campaign.categoryIds.length === 0) return false;
            if (!productCategoryIds || productCategoryIds.length === 0) return false;
            return productCategoryIds.some(catId =>
                campaign.categoryIds.some(campaignCatId =>
                    campaignCatId.toString() === catId.toString()
                )
            );
        default:
            return false;
    }
};

// @desc    Check if customer is eligible for campaign based on tier
// @access  Private
const isCustomerTierEligible = async (customerId, campaign) => {
    if (!campaign.customerTiers || campaign.customerTiers === 'all') return true;

    // Get customer tier
    const customer = await User.findById(customerId).select('tier');
    if (!customer) return false;

    const tierLevelMap = {
        'bronze': 1,
        'silver': 2,
        'gold': 3,
        'platinum': 4
    };

    const customerTierLevel = tierLevelMap[customer.tier?.toLowerCase()] || 0;
    const requiredTierLevel = tierLevelMap[campaign.customerTiers.toLowerCase()] || 0;

    return customerTierLevel >= requiredTierLevel;
};

// @desc    Get discount value for customer tier (simplified)
// @access  Private
const getTierDiscount = (campaign, customerTier) => {
    // Just return the base discount - no tier-specific discounts in simplified model
    return {
        discountValue: campaign.discountValue,
        maxDiscountAmount: campaign.maxDiscountAmount
    };
};

// ==================== ENHANCED CAMPAIGN VALIDATION ====================

// @desc    Validate campaign for specific customer and products
// @route   POST /api/merchant/campaigns/validate
// @access  Private (Customer)
export const validateCampaignForCustomer = async (req, res) => {
    try {
        const { campaignId, customerId, productIds, orderAmount } = req.body;

        const campaign = await Campaign.findOne({
            _id: campaignId,
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found or inactive'
            });
        }

        // Check customer eligibility
        const isEligible = await isCustomerTierEligible(customerId, campaign);
        if (!isEligible) {
            return res.status(400).json({
                success: false,
                message: 'Customer is not eligible for this campaign'
            });
        }

        // Check product eligibility
        let eligibleProducts = [];
        if (productIds && productIds.length > 0) {
            for (const productId of productIds) {
                const productCategoryIds = await getProductCategories(productId);
                if (isProductEligible(campaign, productId, productCategoryIds)) {
                    eligibleProducts.push(productId);
                }
            }
        }

        // Check if any products are eligible
        if (productIds && productIds.length > 0 && eligibleProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No eligible products found in this campaign'
            });
        }

        // Get customer tier
        const customer = await User.findById(customerId).select('tier');
        const customerTier = customer?.tier || 'bronze';

        // Get tier-specific discount
        const discount = getTierDiscount(campaign, customerTier);

        // Calculate discount
        let discountAmount = 0;
        if (campaign.discountType === 'percentage') {
            discountAmount = (orderAmount || 0) * (discount.discountValue / 100);
            if (discount.maxDiscountAmount > 0 && discountAmount > discount.maxDiscountAmount) {
                discountAmount = discount.maxDiscountAmount;
            }
        } else if (campaign.discountType === 'fixed') {
            discountAmount = discount.discountValue;
        }

        res.status(200).json({
            success: true,
            campaign: {
                id: campaign._id,
                name: campaign.name,
                type: campaign.type,
                discountType: campaign.discountType,
                discountValue: discount.discountValue,
                discountAmount: Math.round(discountAmount),
                maxDiscountAmount: discount.maxDiscountAmount,
                minOrderAmount: campaign.minOrderAmount,
                customerTier,
                eligibleProducts,
                couponCode: campaign.couponCode,
                description: campaign.description
            }
        });
    } catch (error) {
        console.error('Error validating campaign for customer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get eligible campaigns for customer
// @route   GET /api/merchant/campaigns/eligible
// @access  Private (Customer)
export const getEligibleCampaigns = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { productIds } = req.query;

        // Get customer tier
        const customer = await User.findById(customerId).select('tier');
        const customerTier = customer?.tier || 'bronze';

        // Get all active campaigns
        const campaigns = await Campaign.find({
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        // Filter eligible campaigns
        const eligibleCampaigns = [];
        for (const campaign of campaigns) {
            // Check tier eligibility
            const tierEligible = await isCustomerTierEligible(customerId, campaign);
            if (!tierEligible) continue;

            // Check product eligibility if products are specified
            if (productIds) {
                const productIdList = productIds.split(',');
                let hasEligibleProduct = false;
                for (const productId of productIdList) {
                    const productCategoryIds = await getProductCategories(productId);
                    if (isProductEligible(campaign, productId, productCategoryIds)) {
                        hasEligibleProduct = true;
                        break;
                    }
                }
                if (!hasEligibleProduct) continue;
            }

            // Get tier-specific discount
            const discount = getTierDiscount(campaign, customerTier);

            eligibleCampaigns.push({
                ...campaign.toObject(),
                customerTier,
                tierDiscount: discount
            });
        }

        res.status(200).json({
            success: true,
            count: eligibleCampaigns.length,
            customerTier,
            campaigns: eligibleCampaigns
        });
    } catch (error) {
        console.error('Error fetching eligible campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Calculate discount for order with tier-based pricing
// @route   POST /api/merchant/campaigns/calculate-discount
// @access  Private (Customer)
export const calculateDiscount = async (req, res) => {
    try {
        const { campaignId, customerId, orderItems } = req.body;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign || campaign.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found or inactive'
            });
        }

        // Get customer tier
        const customer = await User.findById(customerId).select('tier');
        const customerTier = customer?.tier || 'bronze';

        // Check tier eligibility
        const tierEligible = await isCustomerTierEligible(customerId, campaign);
        if (!tierEligible) {
            return res.status(400).json({
                success: false,
                message: 'Customer not eligible for this campaign'
            });
        }

        // Get tier-specific discount
        const tierDiscount = getTierDiscount(campaign, customerTier);

        // Calculate discounts per item
        let totalDiscount = 0;
        let totalOrderAmount = 0;
        const discountedItems = [];

        for (const item of orderItems) {
            const productCategoryIds = await getProductCategories(item.productId);
            const isEligible = isProductEligible(campaign, item.productId, productCategoryIds);

            let itemDiscount = 0;
            if (isEligible) {
                const itemAmount = item.price * item.quantity;
                if (campaign.discountType === 'percentage') {
                    itemDiscount = itemAmount * (tierDiscount.discountValue / 100);
                    if (tierDiscount.maxDiscountAmount > 0) {
                        itemDiscount = Math.min(itemDiscount, tierDiscount.maxDiscountAmount);
                    }
                } else if (campaign.discountType === 'fixed') {
                    itemDiscount = Math.min(tierDiscount.discountValue, itemAmount);
                }
                totalDiscount += itemDiscount;
                totalOrderAmount += itemAmount;
            }

            discountedItems.push({
                ...item,
                eligible: isEligible,
                discount: Math.round(itemDiscount),
                finalPrice: Math.round((item.price * item.quantity) - itemDiscount)
            });
        }

        // Apply max uses check
        if (campaign.maxUses > 0 && campaign.totalUses >= campaign.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'Campaign has reached its usage limit'
            });
        }

        // Check min order amount (only if there's discount)
        if (totalDiscount > 0 && campaign.minOrderAmount > 0 && totalOrderAmount < campaign.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of Rs.${campaign.minOrderAmount} required for discount`
            });
        }

        res.status(200).json({
            success: true,
            campaign: {
                id: campaign._id,
                name: campaign.name,
                type: campaign.type,
                couponCode: campaign.couponCode
            },
            customerTier,
            totalOrderAmount: Math.round(totalOrderAmount),
            totalDiscount: Math.round(totalDiscount),
            netAmount: Math.round(totalOrderAmount - totalDiscount),
            items: discountedItems
        });
    } catch (error) {
        console.error('Error calculating discount:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};