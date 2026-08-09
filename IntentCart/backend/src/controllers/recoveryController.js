import eventService from '../services/eventService.js';
import abandonmentService from '../services/abandonmentService.js';
import recoveryService from '../services/recoveryService.js';

import User from '../models/User.js';
import Event from '../models/Event.js';
import { triggerRecoveryNotification } from './customerNotificationController.js';

export const triggerRecovery = async (req, res) => {
    try {
        const { sessionId, customerId } = req.body;

        // 1. Fetch the actual cart items from the events
        const cartEvent = await Event.findOne({
            sessionId,
            eventType: { $in: ['add_to_cart', 'checkout_started'] }
        }).sort({ createdAt: -1 });

        if (!cartEvent) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // 2. Get user details (to make sure they exist)
        const user = await User.findById(customerId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // 3. SAVE TO CUSTOMER NOTIFICATIONS DB (This is the ONLY thing we do)
        // This puts the notification into the customer's app dashboard
        await triggerRecoveryNotification(
            user._id,
            cartEvent.cartItems,
            cartEvent.cartTotal,
            sessionId
        );

        // console.log(`Recovery notification saved to DB for customer: ${user._id}`);

        // 4. Log the action in your Events collection (for merchant dashboard tracking)
        await eventService.trackEvent({
            sessionId,
            customerId,
            eventType: 'recovery_email_sent',
            cartItems: cartEvent.cartItems,
            cartTotal: cartEvent.cartTotal,
            metadata: {
                triggeredBy: 'merchant_dashboard',
                notifiedCustomer: user._id.toString()
            }
        });

        res.status(200).json({
            success: true,
            message: "Recovery notification saved to customer's inbox successfully!"
        });

    } catch (error) {
        console.error("Error triggering recovery notification:", error);
        res.status(500).json({ success: false, message: "Failed to trigger recovery" });
    }
};

/**
 * Get recovery statistics
 */
export const getRecoveryStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const merchantId = req.user._id;

        // Get recovery stats
        const stats = await recoveryService.getRecoveryStats(period);

        // Get abandonment stats
        const abandonmentStats = await eventService.getAbandonmentStats(period);

        // Get event distribution
        const eventStats = await eventService.getEventStats(period);

        // Calculate total abandonments
        const totalAbandonments = Object.values(abandonmentStats).reduce((a, b) => a + b, 0);

        // Prepare abandonment data for charts
        const abandonmentData = Object.entries(abandonmentStats).map(([key, value]) => ({
            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value
        }));

        // Prepare notification data
        const notificationData = [
            { name: 'Sent', value: stats.sent || 0 },
            { name: 'Opened', value: stats.opened || 0 },
            { name: 'Clicked', value: stats.clicked || 0 },
            { name: 'Converted', value: stats.converted || 0 }
        ];

        // Prepare intent data
        const intentData = {
            High: stats.converted || 0,
            Medium: stats.opened || 0,
            Low: stats.sent || 0
        };

        // Get trends data
        const trends = await getTrendData(period);

        res.json({
            success: true,
            stats: {
                recoveredRevenue: stats.totalRevenue || 0,
                recoveryRate: stats.recoveryRate || 0,
                totalAttempts: stats.totalAttempts || 0,
                recoveredOrders: stats.converted || 0,
                recoveryOpened: stats.opened || 0,
                recoveryClicked: stats.clicked || 0,
                averageRecoveryTime: stats.avgRecoveryTime || 0,
                totalAbandonments: totalAbandonments,
                // Additional stats from events
                cartAbandoned: abandonmentStats.cart_abandoned || 0,
                checkoutAbandoned: abandonmentStats.checkout_abandoned || 0,
                productAbandoned: abandonmentStats.product_abandoned || 0,
                wishlistAbandoned: abandonmentStats.wishlist_abandoned || 0,
                cartRestored: eventStats.cart_restored || 0,
                productViewed: eventStats.product_viewed || 0,
                cartViewed: eventStats.cart_viewed || 0,
                checkoutViewed: eventStats.checkout_viewed || 0,
                wishlistViewed: eventStats.wishlist_viewed || 0
            },
            charts: {
                abandonmentData,
                notificationData,
                intentData,
                trends
            }
        });
    } catch (error) {
        console.error('Error getting recovery stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get recovery statistics'
        });
    }
};

/**
 * Get all recovery events with pagination
 */
export const getAllRecoveryEvents = async (req, res) => {
    try {
        const {
            limit = 100,
            page = 1,
            eventType,
            status,
            fromDate,
            toDate,
            customerId,
            sessionId
        } = req.query;

        const filters = {
            eventType: eventType && eventType !== 'all' ? eventType : null,
            recoveryStatus: status,
            customerId,
            sessionId,
            fromDate,
            toDate
        };

        // Remove null/undefined filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        const result = await eventService.getEvents(
            filters,
            parseInt(limit),
            parseInt(page)
        );

        // Get event types for filter dropdown
        const eventTypes = [...new Set(
            result.data.map(e => e.eventType)
        )];

        res.json({
            success: true,
            data: result.data,
            pagination: {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
                limit: parseInt(limit)
            },
            eventTypes
        });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get recovery events'
        });
    }
};

/**
 * Get abandonment reasons distribution
 */
export const getAbandonmentReasons = async (req, res) => {
    try {
        const { period = '30' } = req.query;

        const reasons = await eventService.getAbandonmentReasons(period);

        // Format for frontend
        const formattedReasons = reasons.map(reason => ({
            name: reason._id,
            count: reason.count,
            percentage: 0
        }));

        const total = reasons.reduce((sum, r) => sum + r.count, 0);

        res.json({
            success: true,
            data: formattedReasons,
            total
        });
    } catch (error) {
        console.error('Error getting abandonment reasons:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get abandonment reasons'
        });
    }
};

/**
 * Get recovery trends data
 */
export const getRecoveryTrends = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const trends = await getTrendData(period);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error getting trends:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get recovery trends'
        });
    }
};

/**
 * Detect abandonments (manual trigger)
 */
export const detectAbandonments = async (req, res) => {
    try {
        const results = await abandonmentService.detectAbandonments();

        res.json({
            success: true,
            message: 'Abandonment detection completed successfully',
            details: {
                total: results.total,
                cartIdle: results.cartIdle || 0,
                checkoutAbandoned: results.checkoutAbandoned || 0,
                wishlistToCart: results.wishlistToCart || 0,
                productObsession: results.productObsession || 0,
                details: results.details || []
            }
        });
    } catch (error) {
        console.error('Error detecting abandonments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to detect abandonments'
        });
    }
};

/**
 * Track email open (webhook/pixel)
 */
export const trackEmailOpen = async (req, res) => {
    try {
        const { recoveryId } = req.params;

        if (!recoveryId) {
            return res.status(400).json({
                success: false,
                message: 'Recovery ID is required'
            });
        }

        const recovery = await recoveryService.trackEmailOpen(recoveryId);

        // Return a 1x1 pixel or success response
        res.json({
            success: true,
            message: 'Email open tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking email open:', error);
        // Still return success to not break the tracking pixel
        res.json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Track email click (webhook)
 */
export const trackEmailClick = async (req, res) => {
    try {
        const { recoveryId } = req.params;

        if (!recoveryId) {
            return res.status(400).json({
                success: false,
                message: 'Recovery ID is required'
            });
        }

        const recovery = await recoveryService.trackEmailClick(recoveryId);

        res.json({
            success: true,
            message: 'Email click tracked successfully',
            data: recovery
        });
    } catch (error) {
        console.error('Error tracking email click:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track email click'
        });
    }
};

/**
 * Mark recovery as converted (when purchase is completed)
 */
export const markRecoveryConverted = async (req, res) => {
    try {
        const { recoveryId } = req.params;
        const { orderValue } = req.body;

        if (!recoveryId) {
            return res.status(400).json({
                success: false,
                message: 'Recovery ID is required'
            });
        }

        const recovery = await recoveryService.markConverted(
            recoveryId,
            orderValue
        );

        res.json({
            success: true,
            message: 'Recovery marked as converted',
            data: recovery
        });
    } catch (error) {
        console.error('Error marking conversion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark recovery as converted'
        });
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate trend data for charts
 */
const getTrendData = async (period = 30) => {
    const days = parseInt(period);
    const trends = [];
    const now = new Date();

    // Get recovery data for each day
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Query for this day's data (this would be optimized in a real implementation)
        const dayData = await getDayData(startOfDay, endOfDay);

        trends.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: dayData.revenue || 0,
            orders: dayData.orders || 0,
            attempts: dayData.attempts || 0,
            conversions: dayData.conversions || 0
        });
    }

    return trends;
};

/**
 * Get data for a specific day (simplified version)
 * In production, this would query the database directly
 */
const getDayData = async (startDate, endDate) => {
    try {
        const Recovery = (await import('../models/Recovery.js')).default;

        const result = await Recovery.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    attempts: { $sum: 1 },
                    conversions: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, 1, 0] }
                    },
                    revenue: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, '$recoveryValue', 0] }
                    }
                }
            }
        ]);

        return result[0] || { attempts: 0, conversions: 0, revenue: 0 };
    } catch (error) {
        console.error('Error getting day data:', error);
        return { attempts: 0, conversions: 0, revenue: 0 };
    }
};