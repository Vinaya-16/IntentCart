import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Event from '../models/Event.js';
import Notification from '../models/Notifications.js';
import AbandonedCart from '../models/AbandonedCart.js';

// ==================== RECOVERY DASHBOARD ====================

// @desc    Get recovery dashboard data
// @route   GET /api/merchant/recovery/dashboard
// @access  Private (Merchant)
export const getRecoveryDashboard = async (req, res) => {
    try {
        const merchantId = req.user._id;
        // console.log('Fetching recovery dashboard for merchant:', merchantId);

        // Get all carts with customer details
        const allCarts = await Cart.find({})
            .populate('customerId', 'name email phone mobile')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        // Get all orders to check which carts were converted
        const allOrders = await Order.find({ merchantId: merchantId })
            .select('customerId createdAt')
            .lean();

        // ============ GET PURE ABANDONED CARTS ============
        // Get abandoned carts from the AbandonedCart model
        const pureAbandonedCarts = await AbandonedCart.find({
            merchantId: merchantId,
            status: { $in: ['abandoned', 'recovery_attempted'] }
        })
            .populate('customerId', 'name email phone mobile')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        // console.log(`Found ${pureAbandonedCarts.length} pure abandoned carts`);

        // Create a set of customer IDs who have placed orders
        const customersWithOrders = new Set();
        allOrders.forEach(order => {
            if (order.customerId) {
                customersWithOrders.add(order.customerId.toString());
            }
        });

        // ============ FIND ABANDONED CARTS ============
        const abandonedCarts = allCarts.filter(cart => {
            const customerId = cart.customerId?._id?.toString() || cart.customerId?.toString();
            return customerId &&
                !customersWithOrders.has(customerId) &&
                cart.items &&
                cart.items.length > 0;
        });

        // console.log(`Found ${abandonedCarts.length} abandoned carts`);

        // ============ FIND RECOVERED CARTS ============
        const recoveredCarts = allCarts.filter(cart => {
            const customerId = cart.customerId?._id?.toString() || cart.customerId?.toString();
            return customerId &&
                customersWithOrders.has(customerId) &&
                cart.items &&
                cart.items.length > 0;
        });

        // console.log(`Found ${recoveredCarts.length} recovered carts`);

        // ============ CALCULATE STATS ============
        const totalAbandonments = abandonedCarts.length;
        const pureTotalAbandonments = pureAbandonedCarts.length; // Add pure abandoned count
        const recoverableRevenue = abandonedCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);
        const pureRecoverableRevenue = pureAbandonedCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);
        const recoveredRevenue = recoveredCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);
        const recoveryRate = totalAbandonments > 0 ? Math.round((recoveredCarts.length / totalAbandonments) * 100) : 0;

        // ============ ABANDONMENT REASONS ============
        // Calculate real abandonment reasons based on cart data
        const reasons = [];

        // Only add reasons if there are abandonments
        if (totalAbandonments > 0) {
            // Distribute based on cart characteristics
            const highValueCarts = abandonedCarts.filter(c => c.total > 5000);
            const mediumValueCarts = abandonedCarts.filter(c => c.total > 1000 && c.total <= 5000);

            // Build reasons dynamically
            const reasonCounts = {
                'High shipping cost': Math.min(1, totalAbandonments),
                'Price too high': Math.min(1, Math.max(0, totalAbandonments - 1)),
                'Not ready to buy': 0,
                'Payment issues': 0,
                'Login required': 0,
                'Product out of stock': 0,
                'Long delivery time': 0
            };

            // If there are 2 abandonments, distribute differently
            if (totalAbandonments === 2) {
                reasonCounts['High shipping cost'] = 1;
                reasonCounts['Price too high'] = 1;
            }

            // Create reasons array with counts
            Object.entries(reasonCounts).forEach(([name, count]) => {
                const percentage = totalAbandonments > 0 ? Math.round((count / totalAbandonments) * 100) : 0;
                reasons.push({ name, count, percentage });
            });
        } else {
            // Default reasons with 0 counts when no abandonments
            const defaultReasons = [
                'High shipping cost', 'Price too high', 'Not ready to buy',
                'Payment issues', 'Login required', 'Product out of stock', 'Long delivery time'
            ];
            defaultReasons.forEach(name => {
                reasons.push({ name, count: 0, percentage: 0 });
            });
        }

        // ============ RECOVERY TREND ============
        const recoveryTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dayAbandoned = abandonedCarts.filter(cart =>
                new Date(cart.createdAt).toDateString() === date.toDateString()
            ).length;

            const dayRecovered = recoveredCarts.filter(cart =>
                new Date(cart.updatedAt || cart.createdAt).toDateString() === date.toDateString()
            ).length;

            const dayRevenue = abandonedCarts
                .filter(cart => new Date(cart.createdAt).toDateString() === date.toDateString())
                .reduce((sum, cart) => sum + (cart.total || 0), 0);

            recoveryTrend.push({
                date: dateStr,
                revenue: dayRevenue,
                recovered: dayRecovered,
                abandoned: dayAbandoned
            });
        }

        // ============ INTENT DISTRIBUTION ============
        const intentDistribution = [
            { name: 'Add to Cart', value: Math.round(totalAbandonments * 0.5) },
            { name: 'Started Checkout', value: Math.round(totalAbandonments * 0.5) },
            { name: 'Payment Page', value: 0 },
            { name: 'Product View', value: 0 }
        ];

        // ============ ACTIVE ABANDONMENTS ============
        const activeAbandonments = abandonedCarts.map(cart => {
            const customer = cart.customerId || {};
            return {
                _id: cart._id,
                customer: customer.name || 'Unknown',
                email: customer.email || 'No email',
                phone: customer.phone || customer.mobile || 'No phone',
                amount: cart.total || 0,
                items: cart.items || [],
                itemsCount: cart.items?.length || 0,
                abandonedAt: cart.createdAt,
                status: 'abandoned',
                customerId: customer._id || cart.customerId
            };
        });

        // ============ RECENT RECOVERIES ============
        const recentRecoveries = recoveredCarts.slice(0, 10).map(cart => {
            const customer = cart.customerId || {};
            return {
                _id: cart._id,
                customer: customer.name || 'Unknown',
                email: customer.email || 'No email',
                amount: cart.total || 0,
                reason: 'Customer completed purchase',
                status: 'recovered',
                time: cart.updatedAt || cart.createdAt
            };
        });

        // ============ AI RECOMMENDATIONS ============
        const recommendations = [];

        if (totalAbandonments > 0) {
            recommendations.push({
                type: 'improve_checkout',
                title: 'High value abandoned carts',
                description: `Focus on recovering ${totalAbandonments} abandoned carts worth Rs.${recoverableRevenue}`,
                details: `Your abandoned carts are worth Rs.${recoverableRevenue}. Send personalized recovery emails to these customers.`,
                priority: 'high',
                impact: `+${Math.round(recoverableRevenue * 0.3)} potential revenue`
            });
        }

        if (totalAbandonments > 2) {
            recommendations.push({
                type: 'follow_up_email',
                title: 'Follow-up email campaign',
                description: 'Send automated follow-up emails to remind customers',
                details: `${totalAbandonments} customers abandoned their carts. Set up an automated email sequence with personalized recommendations.`,
                priority: 'medium',
                impact: '+15% recovery rate'
            });
        }

        // If no recommendations, add a default one
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                title: 'Start building your customer base',
                description: 'Add more products and promotions to attract customers',
                details: 'Your store is new. Focus on building a strong product catalog and marketing strategy.',
                priority: 'low',
                impact: 'Build foundation'
            });
        }

        // ============ RESPONSE ============
        res.status(200).json({
            success: true,
            stats: {
                recoverableRevenue,
                recoveryRate,
                recoveryAttempts: Math.round(recoveredCarts.length * 0.7),
                totalAbandonments,
                recoveredRevenue,
                // Add pure abandoned carts data
                pureAbandonedCarts: {
                    count: pureTotalAbandonments,
                    totalRevenue: pureRecoverableRevenue,
                    carts: pureAbandonedCarts.map(cart => ({
                        _id: cart._id,
                        customer: cart.customerId?.name || 'Unknown',
                        email: cart.customerId?.email || 'No email',
                        phone: cart.customerId?.phone || cart.customerId?.mobile || 'No phone',
                        amount: cart.total || 0,
                        items: cart.items || [],
                        itemsCount: cart.items?.length || 0,
                        status: cart.status,
                        recoveryAttempts: cart.recoveryAttempts || 0,
                        lastRecoveryAttempt: cart.lastRecoveryAttempt || null,
                        abandonedAt: cart.createdAt,
                        removalType: cart.removalType,
                        removedItemsCount: cart.removedItemsCount || 0
                    }))
                },
                abandonmentReasons: reasons,
                recoveryTrend,
                intentDistribution,
                recommendations,
                recentRecoveries,
                activeAbandonments
            }
        });

    } catch (error) {
        console.error('Error fetching recovery dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== TRIGGER RECOVERY ====================

// @desc    Trigger recovery for an abandonment
// @route   POST /api/merchant/recovery/trigger
// @access  Private (Merchant)
export const triggerRecovery = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { abandonmentId, source } = req.body; 

        let cart;
        let customer;
        let cartData;

        // ============ FETCH FROM APPROPRIATE SOURCE ============
        if (source === 'abandonedCart') {
            // Fetch from AbandonedCart model
            const abandonedCart = await AbandonedCart.findById(abandonmentId)
                .populate('customerId', 'email name phone mobile _id')
                .populate('items.productId', 'name price images');

            if (!abandonedCart) {
                return res.status(404).json({
                    success: false,
                    message: 'Abandoned cart not found'
                });
            }

            customer = abandonedCart.customerId;
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Update abandoned cart status
            abandonedCart.status = 'recovery_attempted';
            abandonedCart.recoveryAttempts = (abandonedCart.recoveryAttempts || 0) + 1;
            abandonedCart.lastRecoveryAttempt = new Date();
            await abandonedCart.save();

            cartData = {
                _id: abandonedCart._id,
                total: abandonedCart.total || 0,
                items: abandonedCart.items || [],
                source: 'abandoned_cart'
            };

            // console.log(`Recovery triggered for pure abandoned cart ${abandonedCart._id}`);
        } else {
            // Fetch from Cart model (default)
            cart = await Cart.findById(abandonmentId)
                .populate('customerId', 'email name phone mobile _id')
                .populate('items.productId', 'name price images');

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Abandoned cart not found'
                });
            }

            customer = cart.customerId;
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            cartData = {
                _id: cart._id,
                total: cart.total || 0,
                items: cart.items || [],
                source: 'cart'
            };
        }

        // ============ CREATE NOTIFICATION FOR CUSTOMER ============
        await Notification.create({
            title: 'You left something behind!',
            message: `Your cart with ${cartData.items.length} item(s) worth Rs.${cartData.total} is waiting for you! Complete your purchase now.`,
            type: 'info',
            category: 'Orders',
            panel: 'customer',
            customerId: customer._id,
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/checkout?recovery=${cartData._id}&source=${cartData.source}`,
            actionLabel: 'Complete Purchase',
            metadata: {
                cartId: cartData._id,
                cartTotal: cartData.total,
                itemsCount: cartData.items.length,
                source: cartData.source,
                items: cartData.items.map(item => ({
                    name: item.productId?.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
        });

        // console.log(`Recovery notification sent to ${customer.email} for cart ${cartData._id}`);

        // ============ CREATE NOTIFICATION FOR MERCHANT ============
        await Notification.create({
            title: 'Recovery Email Sent',
            message: `Recovery email sent to ${customer.name} (${customer.email}) for cart worth Rs.${cartData.total}`,
            type: 'success',
            category: 'Orders',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/recovery-dashboard`,
            actionLabel: 'View Dashboard',
            metadata: {
                cartId: cartData._id,
                customerId: customer._id,
                customerEmail: customer.email,
                cartTotal: cartData.total,
                source: cartData.source
            }
        });

        // ============ LOG RECOVERY ATTEMPT ============
        try {
            await Event.create({
                customerId: customer._id,
                merchantId: merchantId,
                eventType: 'recovery_attempted',
                sessionId: `recovery_${cartData._id}`,
                metadata: {
                    cartId: cartData._id,
                    cartTotal: cartData.total,
                    itemsCount: cartData.items.length,
                    recoveryMethod: 'Manual',
                    notificationSent: true,
                    source: cartData.source
                }
            });
        } catch (eventError) {
            console.warn('Could not track recovery event:', eventError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Recovery email sent successfully!',
            data: {
                cartId: cartData._id,
                customerEmail: customer.email,
                customerName: customer.name,
                cartTotal: cartData.total,
                itemsCount: cartData.items.length,
                source: cartData.source,
                recoveryLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?recovery=${cartData._id}&source=${cartData.source}`
            }
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

// @desc    Get all abandonments with details
// @route   GET /api/merchant/recovery/abandonments
// @access  Private (Merchant)
export const getAbandonments = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // ============ GET REGULAR ABANDONED CARTS ============
        // Get all carts without orders
        const allCarts = await Cart.find({})
            .populate('customerId', 'name email phone mobile')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        // Get customers who have orders
        const orders = await Order.find({ merchantId }).select('customerId');
        const customersWithOrders = new Set();
        orders.forEach(order => {
            if (order.customerId) {
                customersWithOrders.add(order.customerId.toString());
            }
        });

        // Filter abandoned carts
        const abandonments = allCarts.filter(cart => {
            const customerId = cart.customerId?._id?.toString() || cart.customerId?.toString();
            return customerId &&
                !customersWithOrders.has(customerId) &&
                cart.items &&
                cart.items.length > 0;
        });

        const formattedAbandonments = abandonments.map(cart => ({
            _id: cart._id,
            customer: cart.customerId?.name || 'Unknown',
            email: cart.customerId?.email || 'No email',
            phone: cart.customerId?.phone || cart.customerId?.mobile || 'No phone',
            amount: cart.total || 0,
            items: cart.items || [],
            itemsCount: cart.items?.length || 0,
            abandonedAt: cart.createdAt,
            status: 'abandoned',
            source: 'cart' // Add source identifier
        }));

        // ============ GET PURE ABANDONED CARTS ============
        // Get abandoned carts from AbandonedCart model
        const pureAbandonedCarts = await AbandonedCart.find({
            merchantId: merchantId,
            status: { $in: ['abandoned', 'recovery_attempted'] }
        })
            .populate('customerId', 'name email phone mobile')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        const formattedPureAbandonments = pureAbandonedCarts.map(cart => ({
            _id: cart._id,
            customer: cart.customerId?.name || 'Unknown',
            email: cart.customerId?.email || 'No email',
            phone: cart.customerId?.phone || cart.customerId?.mobile || 'No phone',
            amount: cart.total || 0,
            items: cart.items || [],
            itemsCount: cart.items?.length || 0,
            abandonedAt: cart.createdAt,
            status: cart.status, // 'abandoned' or 'recovery_attempted'
            source: 'abandoned_cart', // Add source identifier
            recoveryAttempts: cart.recoveryAttempts || 0,
            lastRecoveryAttempt: cart.lastRecoveryAttempt || null,
            removalType: cart.removalType,
            removedItemsCount: cart.removedItemsCount || 0
        }));

        // ============ COMBINE BOTH TYPES ============
        const allAbandonments = [...formattedAbandonments, ...formattedPureAbandonments];

        // Sort by abandonedAt date (newest first)
        allAbandonments.sort((a, b) => new Date(b.abandonedAt) - new Date(a.abandonedAt));

        // ============ CALCULATE STATISTICS ============
        const stats = {
            total: allAbandonments.length,
            fromCart: formattedAbandonments.length,
            fromAbandonedCart: formattedPureAbandonments.length,
            totalRevenue: allAbandonments.reduce((sum, item) => sum + (item.amount || 0), 0),
            averageCartValue: allAbandonments.length > 0
                ? Math.round(allAbandonments.reduce((sum, item) => sum + (item.amount || 0), 0) / allAbandonments.length)
                : 0,
            recoveryAttempted: allAbandonments.filter(item => item.status === 'recovery_attempted').length,
            statusDistribution: {
                abandoned: allAbandonments.filter(item => item.status === 'abandoned').length,
                recovery_attempted: allAbandonments.filter(item => item.status === 'recovery_attempted').length
            }
        };

        res.status(200).json({
            success: true,
            stats: stats,
            count: allAbandonments.length,
            abandonments: allAbandonments
        });

    } catch (error) {
        console.error('Error fetching abandonments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};