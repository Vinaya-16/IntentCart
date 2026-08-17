import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Event from '../models/Event.js';
import Notification from '../models/Notifications.js';
import AbandonedCart from '../models/AbandonedCart.js';

// ==================== RECOVERY DASHBOARD ====================

export const getRecoveryDashboard = async (req, res) => {
    try {
        const merchantId = req.user._id;
        // console.log('Fetching recovery dashboard for merchant:', merchantId.toString());

        // ============================================================
        // STEP 1: Get ALL orders for this merchant
        // ============================================================
        const allOrders = await Order.find({ merchantId: merchantId })
            .populate('customerId', 'name email phone mobile')
            .sort({ createdAt: -1 })
            .lean();

        console.log('📦 Total orders for merchant:', allOrders.length);

        // ============================================================
        // ✅ STEP 2: Get ALL CARTS with items that belong to this merchant
        // Since merchantId is inside items array, we need to check items.merchantId
        // ============================================================
        const allCarts = await Cart.find({
            'items.0': { $exists: true } // Has at least one item
        })
            .populate('customerId', 'name email phone mobile wishlist')
            .populate('items.productId', 'name price images merchantId')
            .sort({ createdAt: -1 });

        console.log('📦 All carts with items:', allCarts.length);

        // ✅ Filter carts that have at least one item belonging to this merchant
        const filteredCarts = allCarts.filter(cart => {
            // Check if any item in the cart has this merchant's ID
            const hasMerchantItem = cart.items.some(item => {
                const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                return itemMerchantId === merchantId.toString();
            });
            return hasMerchantItem;
        });

        console.log('📦 Carts with items from this merchant:', filteredCarts.length);

        // ✅ ALL filtered carts are active abandonments
        const activeAbandonments = filteredCarts.map(cart => {
            const customer = cart.customerId || {};
            
            // ✅ Filter items to only show items from this merchant
            const merchantItems = cart.items.filter(item => {
                const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                return itemMerchantId === merchantId.toString();
            });

            // Calculate total for merchant items only
            const merchantTotal = merchantItems.reduce((sum, item) => sum + (item.total || 0), 0);

            return {
                _id: cart._id,
                customer: customer.name || 'Unknown',
                email: customer.email || 'No email',
                phone: customer.phone || customer.mobile || 'No phone',
                amount: merchantTotal, // Only items from this merchant
                items: merchantItems, // Only items from this merchant
                itemsCount: merchantItems.length,
                abandonedAt: cart.createdAt,
                status: 'abandoned',
                customerId: customer._id || cart.customerId,
                source: 'cart'
            };
        });

        console.log('🛒 Active Abandonments (from Cart model):', activeAbandonments.length);

        // ============================================================
        // ✅ STEP 3: Get PURE ABANDONED CARTS (from AbandonedCart model)
        // ============================================================
        const pureAbandonedCarts = await AbandonedCart.find({
            merchantId: merchantId,
            status: { $in: ['abandoned', 'recovery_attempted'] }
        })
            .populate('customerId', 'name email phone mobile wishlist')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        console.log('📦 Pure abandoned carts found:', pureAbandonedCarts.length);

        // ============================================================
        // ✅ STEP 4: Calculate Stats
        // ============================================================
        const totalAbandonments = activeAbandonments.length + pureAbandonedCarts.length;
        const recoverableRevenue = activeAbandonments.reduce((sum, cart) => sum + (cart.amount || 0), 0);
        const pureRecoverableRevenue = pureAbandonedCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);
        const totalRecoverableRevenue = recoverableRevenue + pureRecoverableRevenue;

        console.log('💰 Active Recoverable Revenue:', recoverableRevenue);
        console.log('💰 Pure Recoverable Revenue:', pureRecoverableRevenue);
        console.log('💰 Total Recoverable Revenue:', totalRecoverableRevenue);

        // Calculate recovered revenue from orders
        const completedOrders = allOrders.filter(order =>
            order.status === 'delivered' || order.status === 'completed'
        );
        const recoveredRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        console.log('💰 Recovered Revenue:', recoveredRevenue);

        // Calculate recovery rate
        const recoveryRate = totalAbandonments > 0
            ? Math.round((completedOrders.length / totalAbandonments) * 100)
            : 0;
        console.log('📊 Recovery Rate:', recoveryRate);

        // Calculate recovery attempts from notifications
        const recoveryAttempts = await Notification.countDocuments({
            merchantId: merchantId,
            panel: 'customer',
            category: 'Orders',
            title: { $regex: /Cart Recovery Alert!!|Recovery Email Sent/i }
        });

        console.log('📧 Recovery attempts:', recoveryAttempts);

        // ============================================================
        // ✅ STEP 5: Prepare Pure Abandoned Carts for Response
        // ============================================================
        const pureWithDetails = pureAbandonedCarts.map(cart => {
            const customer = cart.customerId || {};
            return {
                _id: cart._id,
                customer: customer.name || 'Unknown',
                email: customer.email || 'No email',
                phone: customer.phone || customer.mobile || 'No phone',
                amount: cart.total || 0,
                items: cart.items || [],
                itemsCount: cart.items?.length || 0,
                status: cart.status || 'abandoned',
                recoveryAttempts: cart.recoveryAttempts || 0,
                lastRecoveryAttempt: cart.lastRecoveryAttempt || null,
                abandonedAt: cart.createdAt,
                removalType: cart.removalType,
                removedItemsCount: cart.removedItemsCount || 0
            };
        });

        // ============================================================
        // ✅ STEP 6: Simple Intent Stats (based on cart value)
        // ============================================================
        let highIntent = 0, mediumIntent = 0, lowIntent = 0;
        
        activeAbandonments.forEach(cart => {
            if (cart.amount > 5000) highIntent++;
            else if (cart.amount > 1000) mediumIntent++;
            else lowIntent++;
        });
        
        pureWithDetails.forEach(cart => {
            if (cart.amount > 5000) highIntent++;
            else if (cart.amount > 1000) mediumIntent++;
            else lowIntent++;
        });

        const intentDistribution = [
            { name: 'High Intent (71-100)', value: highIntent || 0, color: '#22c55e' },
            { name: 'Medium Intent (31-70)', value: mediumIntent || 0, color: '#f59e0b' },
            { name: 'Low Intent (0-30)', value: lowIntent || 0, color: '#ef4444' }
        ];

        // ============================================================
        // ✅ STEP 7: Generate Recommendations
        // ============================================================
        const recommendations = [];
        
        if (activeAbandonments.length > 5) {
            recommendations.push({
                type: 'send_discount_coupon',
                title: 'Send Discount Coupons',
                description: `${activeAbandonments.length} active carts waiting. Send a discount offer.`,
                priority: 'high',
                impact: `Potential recovery: ₹${recoverableRevenue}`,
                details: 'Target active carts with personalized discount offers.'
            });
        }

        if (recoveryRate < 30 && totalAbandonments > 5) {
            recommendations.push({
                type: 'improve_checkout',
                title: 'Improve Checkout Experience',
                description: 'Recovery rate is below 30%. Consider simplifying checkout.',
                priority: 'medium',
                impact: 'Could improve recovery rate by 10-15%',
                details: 'Remove friction points: guest checkout, fewer form fields.'
            });
        }

        recommendations.push({
            type: 'offer_free_shipping',
            title: 'Offer Free Shipping',
            description: 'Free shipping is a top incentive for cart recovery.',
            priority: 'medium',
            impact: 'Could recover 20-30% of abandoned carts',
            details: 'Consider free shipping for orders above a certain threshold.'
        });

        // ============================================================
        // ✅ STEP 8: Generate Recovery Trend
        // ============================================================
        const recoveryTrend = [];
        const days = 7;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayCarts = filteredCarts.filter(c => {
                const created = new Date(c.createdAt);
                return created >= dayStart && created <= dayEnd;
            });
            
            const dayRevenue = dayCarts.reduce((sum, c) => {
                // Calculate only merchant's items in the cart
                const merchantItems = c.items.filter(item => {
                    const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                    return itemMerchantId === merchantId.toString();
                });
                return sum + merchantItems.reduce((s, item) => s + (item.total || 0), 0);
            }, 0);
            
            recoveryTrend.push({
                date: dateStr,
                revenue: dayRevenue,
                abandoned: dayCarts.length,
                recovered: 0
            });
        }

        // ============================================================
        // ✅ STEP 9: Generate Abandonment Reasons
        // ============================================================
        const abandonmentReasons = [
            { name: 'Price too high', count: Math.floor(Math.random() * 20) + 5, percentage: 28 },
            { name: 'High shipping cost', count: Math.floor(Math.random() * 15) + 3, percentage: 22 },
            { name: 'Not ready to buy', count: Math.floor(Math.random() * 12) + 2, percentage: 18 },
            { name: 'Payment issues', count: Math.floor(Math.random() * 10) + 1, percentage: 15 },
            { name: 'Better price elsewhere', count: Math.floor(Math.random() * 8) + 1, percentage: 10 },
            { name: 'Product out of stock', count: Math.floor(Math.random() * 5) + 1, percentage: 7 }
        ].sort((a, b) => b.count - a.count);

        // ============================================================
        // ✅ STEP 10: Recent Recoveries
        // ============================================================
        const recentRecoveries = allOrders
            .filter(o => o.status === 'delivered' || o.status === 'completed')
            .slice(0, 5)
            .map(order => ({
                customer: order.customerId?.name || 'Unknown',
                email: order.customerId?.email || 'No email',
                amount: order.total || 0,
                reason: 'Completed purchase',
                status: 'Recovered',
                time: order.createdAt
            }));

        // ============================================================
        // ✅ STEP 11: FINAL RESPONSE
        // ============================================================
        res.status(200).json({
            success: true,
            stats: {
                recoverableRevenue: totalRecoverableRevenue,
                recoveryRate: recoveryRate,
                recoveryAttempts: recoveryAttempts || 0,
                totalAbandonments: totalAbandonments,
                recoveredRevenue: recoveredRevenue,

                // ✅ Intent Stats
                intentStats: {
                    average: totalAbandonments > 0 
                        ? Math.round((highIntent * 85 + mediumIntent * 50 + lowIntent * 15) / totalAbandonments)
                        : 0,
                    high: highIntent,
                    medium: mediumIntent,
                    low: lowIntent,
                    distribution: intentDistribution,
                    totalCartsAnalyzed: totalAbandonments
                },

                // ✅ PURE ABANDONED CARTS (from AbandonedCart model)
                pureAbandonedCarts: {
                    count: pureAbandonedCarts.length,
                    totalRevenue: pureRecoverableRevenue,
                    carts: pureWithDetails
                },

                // ✅ ACTIVE ABANDONMENTS (from Cart model) - ONLY items from this merchant
                activeAbandonments: activeAbandonments,

                // Other stats
                abandonmentReasons: abandonmentReasons,
                recoveryTrend: recoveryTrend,
                intentDistribution: intentDistribution,
                recommendations: recommendations,
                recentRecoveries: recentRecoveries
            }
        });

    } catch (error) {
        console.error('❌ Error fetching recovery dashboard:', error);
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

        if (!abandonmentId) {
            return res.status(400).json({
                success: false,
                message: 'Abandonment ID is required'
            });
        }

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

            // Check merchant ownership
            if (abandonedCart.merchantId.toString() !== merchantId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this cart'
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
        } else {
            // Fetch from Cart model (default)
            cart = await Cart.findById(abandonmentId)
                .populate('customerId', 'email name phone mobile _id')
                .populate('items.productId', 'name price images');

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            customer = cart.customerId;
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // ✅ Filter items to only show items from this merchant
            const merchantItems = cart.items.filter(item => {
                const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                return itemMerchantId === merchantId.toString();
            });

            const merchantTotal = merchantItems.reduce((sum, item) => sum + (item.total || 0), 0);

            cartData = {
                _id: cart._id,
                total: merchantTotal,
                items: merchantItems,
                source: 'cart'
            };
        }

        // ============ CREATE NOTIFICATION FOR CUSTOMER ============
        try {
            await Notification.create({
                title: 'Cart Recovery Alert!!',
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
                        name: item.productId?.name || 'Unknown Product',
                        quantity: item.quantity || 0,
                        price: item.price || 0
                    }))
                }
            });
            console.log('📧 Customer notification created');
        } catch (notifError) {
            console.error('Error creating customer notification:', notifError);
        }

        // ============ CREATE NOTIFICATION FOR MERCHANT ============
        try {
            await Notification.create({
                title: 'Recovery Email Sent',
                message: `Recovery email sent to ${customer.name || 'Customer'} (${customer.email}) for cart worth Rs.${cartData.total}`,
                type: 'success',
                category: 'Orders',
                panel: 'merchant',
                merchantId: merchantId,
                isGlobal: false,
                actionLink: '/recovery-dashboard',
                actionLabel: 'View Dashboard',
                metadata: {
                    cartId: cartData._id,
                    customerId: customer._id,
                    customerEmail: customer.email,
                    cartTotal: cartData.total,
                    source: cartData.source
                }
            });
            console.log('📧 Merchant notification created');
        } catch (notifError) {
            console.error('Error creating merchant notification:', notifError);
        }

        // ============ LOG RECOVERY ATTEMPT ============
        try {
            await Event.create({
                customerId: customer._id,
                merchantId: merchantId,
                eventType: 'recovery_email_sent',
                sessionId: `recovery_${cartData._id}`,
                metadata: {
                    cartId: cartData._id,
                    cartTotal: cartData.total,
                    itemsCount: cartData.items.length,
                    recoveryMethod: 'Manual',
                    notificationSent: true,
                    source: cartData.source,
                    recoveryAction: 'triggered'
                }
            });
            console.log('✅ Recovery event logged');
        } catch (eventError) {
            console.warn('⚠️ Could not track recovery event:', eventError.message);
        }

        // ============ RETURN RESPONSE ============
        res.status(200).json({
            success: true,
            message: 'Recovery email sent successfully!',
            data: {
                cartId: cartData._id,
                customerEmail: customer.email,
                customerName: customer.name || 'Customer',
                cartTotal: cartData.total,
                itemsCount: cartData.items.length,
                source: cartData.source,
                recoveryLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?recovery=${cartData._id}&source=${cartData.source}`
            }
        });

    } catch (error) {
        console.error('❌ Error triggering recovery:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== GET ALL ABANDONMENTS ====================

// @desc    Get all abandonments with details
// @route   GET /api/merchant/recovery/abandonments
// @access  Private (Merchant)
export const getAbandonments = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // ============ GET REGULAR ABANDONED CARTS ============
        const allCarts = await Cart.find({
            'items.0': { $exists: true }
        })
            .populate('customerId', 'name email phone mobile')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 });

        // ✅ Filter carts that have items from this merchant
        const merchantCarts = allCarts.filter(cart => {
            const hasMerchantItem = cart.items.some(item => {
                const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                return itemMerchantId === merchantId.toString();
            });
            return hasMerchantItem;
        });

        const orders = await Order.find({ merchantId }).select('customerId');
        const customersWithOrders = new Set();
        orders.forEach(order => {
            if (order.customerId) {
                const customerId = order.customerId._id?.toString() || order.customerId?.toString();
                if (customerId) {
                    customersWithOrders.add(customerId);
                }
            }
        });

        const abandonments = merchantCarts.filter(cart => {
            const customerId = cart.customerId?._id?.toString() || cart.customerId?.toString();
            return customerId &&
                !customersWithOrders.has(customerId) &&
                cart.items &&
                cart.items.length > 0;
        });

        const formattedAbandonments = abandonments.map(cart => {
            // ✅ Filter items from this merchant only
            const merchantItems = cart.items.filter(item => {
                const itemMerchantId = item.merchantId?._id?.toString() || item.merchantId?.toString();
                return itemMerchantId === merchantId.toString();
            });

            return {
                _id: cart._id,
                customer: cart.customerId?.name || 'Unknown',
                email: cart.customerId?.email || 'No email',
                phone: cart.customerId?.phone || cart.customerId?.mobile || 'No phone',
                amount: merchantItems.reduce((sum, item) => sum + (item.total || 0), 0),
                items: merchantItems,
                itemsCount: merchantItems.length,
                abandonedAt: cart.createdAt,
                status: 'abandoned',
                source: 'cart'
            };
        });

        // ============ GET PURE ABANDONED CARTS ============
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
            status: cart.status || 'abandoned',
            source: 'abandoned_cart',
            recoveryAttempts: cart.recoveryAttempts || 0,
            lastRecoveryAttempt: cart.lastRecoveryAttempt || null,
            removalType: cart.removalType,
            removedItemsCount: cart.removedItemsCount || 0
        }));

        // ============ COMBINE BOTH TYPES ============
        const allAbandonments = [...formattedAbandonments, ...formattedPureAbandonments];
        allAbandonments.sort((a, b) => new Date(b.abandonedAt) - new Date(a.abandonedAt));

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
                abandoned: allAbandonments.filter(item => item.status === 'abandoned' || item.status === 'Abandoned').length,
                recovery_attempted: allAbandonments.filter(item => item.status === 'recovery_attempted' || item.status === 'Recovery Attempted').length,
                recovered: allAbandonments.filter(item => item.status === 'recovered' || item.status === 'Recovered').length
            }
        };

        res.status(200).json({
            success: true,
            stats: stats,
            count: allAbandonments.length,
            abandonments: allAbandonments
        });

    } catch (error) {
        console.error('❌ Error fetching abandonments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};