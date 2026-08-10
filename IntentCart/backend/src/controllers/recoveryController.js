import eventService from '../services/eventService.js';
import abandonmentService from '../services/abandonmentService.js';

import User from '../models/User.js';
import Event from '../models/Event.js';
import { triggerRecoveryNotification } from './customerNotificationController.js';

export const triggerRecovery = async (req, res) => {
    try {
        const { sessionId, customerId } = req.body;
        const merchantId = req.user._id;

        // 1. Fetch the actual cart items from the events
        const cartEvent = await Event.findOne({
            sessionId,
            merchantId: merchantId,
            eventType: { $in: ['add_to_cart', 'checkout_started'] }
        }).sort({ createdAt: -1 });

        if (!cartEvent) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // 2. Get user details
        const user = await User.findById(customerId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // 3. SAVE TO CUSTOMER NOTIFICATIONS DB
        await triggerRecoveryNotification(
            user._id,
            cartEvent.cartItems,
            cartEvent.cartTotal,
            sessionId
        );

        // 4. Log the action in your Events collection
        const trackedEvent = await eventService.trackEvent({
            sessionId,
            customerId,
            merchantId: merchantId,
            eventType: 'recovery_email_sent',
            cartItems: cartEvent.cartItems,
            cartTotal: cartEvent.cartTotal,
            metadata: {
                triggeredBy: 'merchant_dashboard',
                notifiedCustomer: user._id.toString()
            }
        });

        if (!trackedEvent) {
            console.error("eventService.trackEvent failed to save the event!");
            return res.status(500).json({
                success: false,
                message: "Failed to track recovery event in Event collection."
            });
        }

        // console.log(`Recovery email sent event saved to Event collection. ID: ${trackedEvent._id}`);

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
        const merchantId = req.user._id;
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. GET REAL ABANDONMENT STATS
        const totalAbandonments = await Event.countDocuments({
            // Allow legacy data with missing merchantId
            $or: [
                { merchantId: merchantId },
                { merchantId: { $exists: false } }
            ],
            eventType: {
                $in: [
                    'cart_abandoned',
                    'checkout_abandoned',
                    'product_abandoned',
                    'wishlist_abandoned'
                ]
            },
            createdAt: { $gte: startDate }
        });

        // 2. GET SUCCESSFUL RECOVERIES
        const recoveredOrders = await Event.countDocuments({
            merchantId: merchantId,
            eventType: 'purchase_completed',
            // Count ALL purchases, not just converted ones
            recoveryStatus: { $in: ['converted', 'pending'] },
            createdAt: { $gte: startDate }
        });

        // 3. CALCULATE REVENUE
        const revenueResult = await Event.aggregate([
            {
                $match: {
                    merchantId: merchantId,
                    eventType: 'purchase_completed',
                    // Sum ALL purchases, not just converted ones
                    recoveryStatus: { $in: ['converted', 'pending'] },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $ifNull: ['$cartTotal', 0] } }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // 4. CALCULATE RECOVERY RATE
        const recoveryRate = totalAbandonments > 0 ? (recoveredOrders / totalAbandonments) * 100 : 0;

        // --- [CHART LOGIC BELOW] ---

        // 5. ABANDONMENT REASONS BREAKDOWN FOR PIE CHART (BEHAVIORAL REASONS)
        const abandonmentBreakdown = await Event.aggregate([
            {
                $match: {
                    merchantId: merchantId,
                    eventType: {
                        $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned']
                    },
                    abandonmentReason: { $ne: null },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$abandonmentReason',
                    value: { $sum: 1 }
                }
            },
            {
                $sort: { value: -1 }
            }
        ]);

        // Calculate total for percentage calculation
        const totalReasons = abandonmentBreakdown.reduce((acc, curr) => acc + curr.value, 0);

        const abandonmentData = abandonmentBreakdown.map(item => ({
            name: item._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: totalReasons > 0 ? Math.round((item.value / totalReasons) * 100) : 0
        }));

        // 6. NOTIFICATION PERFORMANCE
        const sentCount = await Event.countDocuments({
            merchantId: merchantId,
            eventType: 'recovery_email_sent',
            createdAt: { $gte: startDate }
        });

        const notificationData = [
            { name: 'Sent', value: sentCount },
            { name: 'Opened', value: 0 },
            { name: 'Clicked', value: 0 },
            { name: 'Converted', value: recoveredOrders }
        ];

        // 7. INTENT DISTRIBUTION
        const intentData = {
            High: recoveredOrders,
            Medium: sentCount,
            Low: Math.max(0, totalAbandonments - sentCount)
        };

        // 8. RECOVERY TRENDS
        const trends = await getTrendData(merchantId, period);

        // 9. EVENT FLOW STATS (ABANDONMENT FLOW)
        const eventFlowStats = await Event.aggregate([
            {
                $match: {
                    merchantId: merchantId,
                    eventType: {
                        $in: ['product_viewed', 'cart_viewed', 'checkout_viewed', 'cart_restored']
                    },
                    createdAt: { $gte: startDate }
                }
            },
            {
                // Group by BOTH eventType AND sessionId to avoid duplicates
                $group: {
                    _id: {
                        eventType: '$eventType',
                        sessionId: '$sessionId'
                    }
                }
            },
            {
                // Now count the unique combinations
                $group: {
                    _id: '$_id.eventType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const flowStats = {};
        eventFlowStats.forEach(item => {
            flowStats[item._id] = item.count;
        });

        res.json({
            success: true,
            stats: {
                recoveredRevenue: totalRevenue || 0,
                recoveryRate: recoveryRate || 0,
                totalAttempts: sentCount || 0,
                recoveredOrders: recoveredOrders || 0,
                totalAbandonments: totalAbandonments || 0,
                // Abandonment breakdown
                cartAbandoned: abandonmentBreakdown.find(i => i._id === 'cart_abandoned')?.value || 0,
                checkoutAbandoned: abandonmentBreakdown.find(i => i._id === 'checkout_abandoned')?.value || 0,
                productAbandoned: abandonmentBreakdown.find(i => i._id === 'product_abandoned')?.value || 0,
                wishlistAbandoned: abandonmentBreakdown.find(i => i._id === 'wishlist_abandoned')?.value || 0,
                // Flow breakdown
                cartRestored: flowStats.cart_restored || 0,
                productViewed: flowStats.product_viewed || 0,
                cartViewed: flowStats.cart_viewed || 0,
                checkoutViewed: flowStats.checkout_viewed || 0
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
        const merchantId = req.user._id;
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
            merchantId: merchantId,
            eventType: eventType && eventType !== 'all' ? eventType : null,
            recoveryStatus: status,
            customerId,
            sessionId,
            fromDate,
            toDate
        };

        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        const result = await eventService.getEvents(
            filters,
            parseInt(limit),
            parseInt(page)
        );

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
 * Detect abandonments (manual trigger)
 */
export const detectAbandonments = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const results = await abandonmentService.detectAbandonments(merchantId);

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
 * Generate trend data for charts based on the actual Events collection
 */
const getTrendData = async (merchantId, period = 30) => {
    const days = parseInt(period);
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Force MongoDB to treat cartTotal as a number
        const revenueData = await Event.aggregate([
            {
                $match: {
                    merchantId: merchantId,
                    eventType: 'purchase_completed',
                    // Also accept 'pending' here
                    recoveryStatus: { $in: ['converted', 'pending'] },
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $ifNull: ['$cartTotal', 0] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dayResult = revenueData[0] || { totalRevenue: 0, count: 0 };

        trends.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: dayResult.totalRevenue || 0,
            orders: dayResult.count || 0
        });
    }

    return trends;
};