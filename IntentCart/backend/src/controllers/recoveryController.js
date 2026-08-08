import RecoveryAnalytics from '../models/RecoveryAnalytics.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notifications.js';

// ==================== RECOVERY ANALYTICS ====================

// @desc    Track abandonment event
// @route   POST /api/merchant/recovery/track
// @access  Private (Merchant)
export const trackAbandonment = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const {
            eventType = 'cart_abandoned',
            sessionId,
            customerId,
            cartItems,
            cartTotal,
            abandonmentReason = 'other',
            exitPage,
            deviceType = 'desktop',
            city,
            country,
            pageViews = 0,
            timeSpent = 0
        } = req.body;

        // Validate event type
        const validEventTypes = ['cart_abandoned', 'checkout_abandoned'];
        if (!validEventTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event type. Must be cart_abandoned or checkout_abandoned'
            });
        }

        // Calculate intent score based on behavior
        let intentScore = 0;
        if (cartItems && cartItems.length > 0) {
            intentScore += Math.min(cartItems.length * 10, 40);
        }
        if (cartTotal > 1000) intentScore += 20;
        if (pageViews > 5) intentScore += 20;
        if (timeSpent > 60) intentScore += 20;
        intentScore = Math.min(intentScore, 100);

        const recovery = await RecoveryAnalytics.create({
            merchantId,
            eventType,
            sessionId,
            customerId,
            cartItems: cartItems || [],
            cartTotal: cartTotal || 0,
            abandonmentReason,
            exitPage,
            deviceType,
            city,
            country,
            pageViews: pageViews || 0,
            timeSpent: timeSpent || 0,
            intentScore,
            recoveryStatus: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Abandonment tracked successfully',
            recovery,
            intentScore
        });
    } catch (error) {
        console.error('Error tracking abandonment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get recovery dashboard stats
// @route   GET /api/merchant/recovery/stats
// @access  Private (Merchant)
export const getRecoveryStats = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { period = '30' } = req.query;
        const days = parseInt(period);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Total abandonment events
        const totalAbandonments = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] }
        });

        // Recovery attempts (emails sent)
        const recoveryAttempts = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_sent'
        });

        // Recovery opened
        const recoveryOpened = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_opened'
        });

        // Recovery clicked
        const recoveryClicked = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_clicked'
        });

        // Recovered revenue (from converted recoveries)
        const recoveredEvents = await RecoveryAnalytics.find({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_converted'
        });

        const recoveredRevenue = recoveredEvents.reduce((sum, event) => sum + (event.cartTotal || 0), 0);
        const recoveredOrders = recoveredEvents.length;

        // Recovery rate
        const recoveryRate = totalAbandonments > 0
            ? (recoveredOrders / totalAbandonments) * 100
            : 0;

        // Abandonment reasons distribution
        const abandonmentReasons = await RecoveryAnalytics.aggregate([
            {
                $match: {
                    merchantId,
                    createdAt: { $gte: startDate },
                    abandonmentReason: { $ne: 'other' },
                    eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] }
                }
            },
            {
                $group: {
                    _id: '$abandonmentReason',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const reasonLabels = {
            shipping_costs: 'Shipping Costs',
            just_browsing: 'Just Browsing',
            account_creation: 'Account Creation',
            payment_issue: 'Payment Issue',
            high_price: 'High Price',
            technical_issue: 'Technical Issue'
        };

        const totalReasons = abandonmentReasons.reduce((sum, item) => sum + item.count, 0);
        const abandonmentData = abandonmentReasons.map(item => ({
            name: reasonLabels[item._id] || item._id,
            value: totalReasons > 0 ? Math.round((item.count / totalReasons) * 100) : 0
        }));

        // Notification funnel performance
        const emailSent = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_sent'
        });

        const emailOpened = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_opened'
        });

        const emailClicked = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_email_clicked'
        });

        const emailConverted = await RecoveryAnalytics.countDocuments({
            merchantId,
            createdAt: { $gte: startDate },
            eventType: 'recovery_converted'
        });

        const notificationData = [
            { stage: 'Sent', count: emailSent },
            { stage: 'Opened', count: emailOpened },
            { stage: 'Clicked', count: emailClicked },
            { stage: 'Purchased', count: emailConverted }
        ];

        // Intent score distribution
        const intentDistribution = await RecoveryAnalytics.aggregate([
            {
                $match: {
                    merchantId,
                    createdAt: { $gte: startDate },
                    eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] }
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$intentScore', 70] }, then: 'High' },
                                { case: { $gte: ['$intentScore', 40] }, then: 'Medium' },
                            ],
                            default: 'Low'
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const intentData = {
            High: 0,
            Medium: 0,
            Low: 0
        };

        intentDistribution.forEach(item => {
            if (item._id in intentData) {
                intentData[item._id] = item.count;
            }
        });

        // Recovery trends (last 6 data points)
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const revenue = await RecoveryAnalytics.aggregate([
                {
                    $match: {
                        merchantId,
                        eventType: 'recovery_converted',
                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$cartTotal' }
                    }
                }
            ]);

            const orders = await RecoveryAnalytics.countDocuments({
                merchantId,
                eventType: 'recovery_converted',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            trends.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: revenue.length > 0 ? revenue[0].total : 0,
                orders: orders
            });
        }

        res.status(200).json({
            success: true,
            stats: {
                recoveredRevenue,
                recoveryRate: Math.round(recoveryRate * 10) / 10,
                totalAttempts: recoveryAttempts,
                totalAbandonments,
                recoveredOrders,
                recoveryOpened,
                recoveryClicked
            },
            charts: {
                abandonmentData: abandonmentData.length > 0 ? abandonmentData : [
                    { name: 'No Data', value: 100 }
                ],
                notificationData,
                intentData,
                trends
            }
        });
    } catch (error) {
        console.error('Error fetching recovery stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Trigger recovery action
// @route   POST /api/merchant/recovery/trigger
// @access  Private (Merchant)
export const triggerRecovery = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { sessionId, customerId, method = 'email' } = req.body;

        if (!sessionId && !customerId) {
            return res.status(400).json({
                success: false,
                message: 'Either sessionId or customerId is required'
            });
        }

        // Find abandonment event
        const query = {
            merchantId,
            eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] },
            recoveryStatus: 'pending'
        };

        if (sessionId) {
            query.sessionId = sessionId;
        } else if (customerId) {
            query.customerId = customerId;
        }

        const abandonment = await RecoveryAnalytics.findOne(query).sort({ createdAt: -1 });

        if (!abandonment) {
            return res.status(404).json({
                success: false,
                message: 'No pending abandonment found'
            });
        }

        // Create recovery event based on method
        let eventType;
        if (method === 'email') {
            eventType = 'recovery_email_sent';
        } else if (method === 'sms') {
            eventType = 'recovery_sms_sent';
        } else if (method === 'push') {
            eventType = 'recovery_push_sent';
        } else {
            eventType = 'recovery_email_sent';
        }

        // Create a new recovery event entry
        const recovery = await RecoveryAnalytics.create({
            merchantId,
            eventType,
            sessionId: abandonment.sessionId,
            customerId: abandonment.customerId,
            cartItems: abandonment.cartItems,
            cartTotal: abandonment.cartTotal,
            abandonmentReason: abandonment.abandonmentReason,
            exitPage: abandonment.exitPage,
            deviceType: abandonment.deviceType,
            city: abandonment.city,
            country: abandonment.country,
            pageViews: abandonment.pageViews,
            timeSpent: abandonment.timeSpent,
            intentScore: abandonment.intentScore,
            recoveryStatus: 'sent',
            recoveryMethod: method,
            metadata: {
                originalAbandonmentId: abandonment._id
            }
        });

        // Update original abandonment status
        abandonment.recoveryStatus = 'sent';
        abandonment.recoveryMethod = method;
        await abandonment.save();

        // Trigger notification
        if (customerId) {
            await Notification.create({
                title: '🛒 Forgot Something?',
                message: `We noticed you left items in your cart worth ₹${abandonment.cartTotal}. Complete your purchase now!`,
                type: 'order',
                category: 'Recovery',
                panel: 'customer',
                customerId: customerId,
                isGlobal: false,
                actionLink: '/cart',
                actionLabel: 'View Cart'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recovery triggered successfully',
            recovery
        });
    } catch (error) {
        console.error('Error triggering recovery:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Track recovery event (open, click, convert)
// @route   POST /api/merchant/recovery/track-event
// @access  Private (Merchant)
export const trackRecoveryEvent = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const {
            sessionId,
            customerId,
            eventType,
            orderId,
            orderAmount
        } = req.body;

        const validEventTypes = ['recovery_email_opened', 'recovery_email_clicked', 'recovery_converted'];
        if (!validEventTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event type'
            });
        }

        // Find the original abandonment
        const abandonment = await RecoveryAnalytics.findOne({
            merchantId,
            sessionId,
            eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] }
        }).sort({ createdAt: -1 });

        if (!abandonment) {
            return res.status(404).json({
                success: false,
                message: 'No associated abandonment found'
            });
        }

        // Create tracking event
        const recoveryEvent = await RecoveryAnalytics.create({
            merchantId,
            eventType,
            sessionId,
            customerId,
            cartItems: abandonment.cartItems,
            cartTotal: eventType === 'recovery_converted' ? (orderAmount || abandonment.cartTotal) : 0,
            abandonmentReason: abandonment.abandonmentReason,
            exitPage: abandonment.exitPage,
            deviceType: abandonment.deviceType,
            city: abandonment.city,
            country: abandonment.country,
            pageViews: abandonment.pageViews,
            timeSpent: abandonment.timeSpent,
            intentScore: abandonment.intentScore,
            recoveryStatus: eventType === 'recovery_converted' ? 'converted' : 'clicked',
            recoveryMethod: 'email',
            metadata: {
                originalAbandonmentId: abandonment._id,
                ...(orderId && { orderId })
            }
        });

        // Update original abandonment if converted
        if (eventType === 'recovery_converted') {
            abandonment.recoveryStatus = 'converted';
            await abandonment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Recovery event tracked',
            recoveryEvent
        });
    } catch (error) {
        console.error('Error tracking recovery event:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get abandoned carts list
// @route   GET /api/merchant/recovery/abandoned
// @access  Private (Merchant)
export const getAbandonedCarts = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const abandoned = await RecoveryAnalytics.find({
            merchantId,
            eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] },
            recoveryStatus: { $in: ['pending', 'sent', 'opened', 'clicked'] }
        })
            .populate('customerId', 'username name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await RecoveryAnalytics.countDocuments({
            merchantId,
            eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] },
            recoveryStatus: { $in: ['pending', 'sent', 'opened', 'clicked'] }
        });

        res.status(200).json({
            success: true,
            count: abandoned.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            abandoned
        });
    } catch (error) {
        console.error('Error fetching abandoned carts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Generate sample recovery data for demo
// @route   POST /api/merchant/recovery/generate-sample
// @access  Private (Merchant)
export const generateSampleData = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // First, clear existing sample data
        await RecoveryAnalytics.deleteMany({ merchantId });

        // Sample abandonment reasons
        const reasons = ['shipping_costs', 'just_browsing', 'account_creation', 'payment_issue', 'high_price', 'technical_issue'];
        const reasonLabels = {
            shipping_costs: 'Shipping Costs',
            just_browsing: 'Just Browsing',
            account_creation: 'Account Creation',
            payment_issue: 'Payment Issue',
            high_price: 'High Price',
            technical_issue: 'Technical Issue'
        };

        // Sample cart items
        const sampleProducts = [
            { name: 'Wireless Headphones', price: 2999 },
            { name: 'Smart Watch', price: 4999 },
            { name: 'Running Shoes', price: 3999 },
            { name: 'Backpack', price: 1499 },
            { name: 'Phone Case', price: 599 },
            { name: 'Laptop Stand', price: 899 },
            { name: 'USB-C Hub', price: 1299 },
            { name: 'Wireless Mouse', price: 799 }
        ];

        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
        const devices = ['desktop', 'mobile', 'tablet'];
        const pages = ['/cart', '/checkout', '/product', '/category', '/home'];

        // Generate 50 sample events
        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            // Random cart items (1-4 items)
            const numItems = Math.floor(Math.random() * 4) + 1;
            const cartItems = [];
            let cartTotal = 0;
            const shuffled = [...sampleProducts].sort(() => Math.random() - 0.5);

            for (let j = 0; j < numItems && j < shuffled.length; j++) {
                const product = shuffled[j];
                const quantity = Math.floor(Math.random() * 2) + 1;
                const price = product.price;
                cartItems.push({
                    name: product.name,
                    quantity: quantity,
                    price: price
                });
                cartTotal += price * quantity;
            }

            // Random intent score
            const intentScore = Math.floor(Math.random() * 100);

            // Random abandonment reason
            const reason = reasons[Math.floor(Math.random() * reasons.length)];

            // Determine recovery status
            let recoveryStatus;
            let eventType;
            let recoveryMethod = 'none';
            const statusRoll = Math.random();

            if (statusRoll < 0.3) {
                recoveryStatus = 'pending';
                eventType = 'cart_abandoned';
            } else if (statusRoll < 0.5) {
                recoveryStatus = 'sent';
                eventType = 'recovery_email_sent';
                recoveryMethod = 'email';
            } else if (statusRoll < 0.65) {
                recoveryStatus = 'opened';
                eventType = 'recovery_email_opened';
                recoveryMethod = 'email';
            } else if (statusRoll < 0.8) {
                recoveryStatus = 'clicked';
                eventType = 'recovery_email_clicked';
                recoveryMethod = 'email';
            } else {
                recoveryStatus = 'converted';
                eventType = 'recovery_converted';
                recoveryMethod = 'email';
                // Boost cart total for converted orders
                cartTotal = Math.floor(cartTotal * (1 + Math.random() * 0.5));
            }

            await RecoveryAnalytics.create({
                merchantId,
                eventType,
                sessionId: `session_${Math.random().toString(36).substring(2, 10)}`,
                customerId: Math.random() > 0.3 ? null : null, // Some with customer ID
                cartItems,
                cartTotal,
                abandonmentReason: reason,
                exitPage: pages[Math.floor(Math.random() * pages.length)],
                deviceType: devices[Math.floor(Math.random() * devices.length)],
                city: cities[Math.floor(Math.random() * cities.length)],
                country: 'India',
                pageViews: Math.floor(Math.random() * 10) + 1,
                timeSpent: Math.floor(Math.random() * 180) + 10,
                intentScore,
                recoveryStatus,
                recoveryMethod,
                createdAt: date,
                updatedAt: date
            });
        }

        // Add some sample data with customer IDs (for better demo)
        const demoCustomers = ['60f7a1b2c3d4e5f6a7b8c9d0', '60f7a1b2c3d4e5f6a7b8c9d1', '60f7a1b2c3d4e5f6a7b8c9d2'];
        for (let i = 0; i < 10; i++) {
            const daysAgo = Math.floor(Math.random() * 15);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            const cartTotal = Math.floor(Math.random() * 5000) + 1000;

            await RecoveryAnalytics.create({
                merchantId,
                eventType: Math.random() > 0.3 ? 'cart_abandoned' : 'recovery_converted',
                sessionId: `session_cust_${Math.random().toString(36).substring(2, 10)}`,
                customerId: demoCustomers[Math.floor(Math.random() * demoCustomers.length)],
                cartItems: sampleProducts.slice(0, 2).map(p => ({
                    name: p.name,
                    quantity: 1,
                    price: p.price
                })),
                cartTotal: cartTotal,
                abandonmentReason: reasons[Math.floor(Math.random() * reasons.length)],
                exitPage: '/checkout',
                deviceType: 'desktop',
                city: 'Mumbai',
                country: 'India',
                pageViews: Math.floor(Math.random() * 5) + 3,
                timeSpent: Math.floor(Math.random() * 120) + 30,
                intentScore: Math.floor(Math.random() * 30) + 60,
                recoveryStatus: Math.random() > 0.4 ? 'converted' : 'pending',
                recoveryMethod: Math.random() > 0.4 ? 'email' : 'none',
                createdAt: date,
                updatedAt: date
            });
        }

        res.status(200).json({
            success: true,
            message: 'Sample data generated successfully'
        });
    } catch (error) {
        console.error('Error generating sample data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};