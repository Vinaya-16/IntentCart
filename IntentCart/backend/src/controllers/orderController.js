import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import {
    triggerOrderPlacedNotification
} from '../utils/notificationTriggers.js';
import { notifyMerchantNewOrder } from '../utils/notificationTriggers.js';

// ==================== ORDER MANAGEMENT ====================

// @desc    Create order
// @route   POST /api/customer/orders
export const createOrder = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { shippingAddress, paymentMethod, sessionId: reqSessionId } = req.body;

        // Get cart
        const cart = await Cart.findOne({ customerId })
            .populate('items.productId', 'name price images stock merchantId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Check stock and calculate totals
        let subtotal = 0;
        const orderItems = [];
        let productMerchantId = null;

        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}. Available: ${product.stock}`
                });
            }

            if (product.merchantId) {
                productMerchantId = product.merchantId;
            }

            product.stock -= item.quantity;
            await product.save();

            orderItems.push({
                productId: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: item.price,
                total: item.quantity * item.price,
                image: product.images && product.images.length > 0 ? product.images[0].url : null
            });

            subtotal += item.quantity * item.price;
        }

        // Calculate totals
        const shippingCost = subtotal > 1000 ? 0 : 50;
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + shippingCost + tax;

        // Create order
        const order = new Order({
            customerId,
            merchantId: productMerchantId,
            items: orderItems,
            subtotal,
            shippingCost,
            tax,
            total,
            shippingAddress,
            paymentMethod,
            status: 'pending',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
        });

        await order.save();

        // DYNAMIC RECOVERY LINKING

        try {
            const dashboardMerchantId = req.user._id; 
            let sessionId = reqSessionId;

            // DYNAMIC FALLBACK: If frontend didn't send sessionId, find the most recent abandonment
            if (!sessionId) {
                const lastAbandoned = await Event.findOne({
                    customerId: customerId,
                    merchantId: dashboardMerchantId,
                    eventType: { $in: ['cart_abandoned', 'checkout_abandoned'] }
                }).sort({ createdAt: -1 });

                if (lastAbandoned) {
                    sessionId = lastAbandoned.sessionId;
                }
            }

            // If we successfully found a sessionId to link to, mark it as converted
            if (sessionId && dashboardMerchantId) {
                // 1. Mark the old abandoned cart as Converted
                await Event.findOneAndUpdate(
                    {
                        sessionId: sessionId,
                        merchantId: dashboardMerchantId,
                        eventType: { $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'] }
                    },
                    {
                        $set: {
                            recoveryStatus: 'converted',
                            recoveredAt: new Date(),
                            cartTotal: total
                        }
                    }
                );

                // 2. Attach 'converted' to the purchase_completed event itself
                await Event.findOneAndUpdate(
                    {
                        sessionId: sessionId,
                        merchantId: dashboardMerchantId,
                        eventType: 'purchase_completed'
                    },
                    {
                        $set: {
                            recoveryStatus: 'converted',
                            cartTotal: total
                        }
                    },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error("Error updating recovery status:", error);
        }

        // Clear cart
        cart.items = [];
        cart.subtotal = 0;
        cart.total = 0;
        await cart.save();

        // Update user's total orders
        await User.findByIdAndUpdate(customerId, { $inc: { totalOrders: 1 } });

        // Trigger Notifications
        await triggerOrderPlacedNotification(customerId, order.orderId, total);

        if (productMerchantId) {
            const customer = await User.findById(customerId);
            await notifyMerchantNewOrder(
                productMerchantId,
                order.orderId,
                customer?.username || 'Customer'
            );
        }

        const populatedOrder = await Order.findById(order._id)
            .populate('customerId', 'username email')
            .populate('merchantId', 'businessName username')
            .populate('items.productId', 'name price');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: populatedOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get customer orders
// @route   GET /api/customer/orders
// @access  Private (Customer)
export const getCustomerOrders = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { customerId };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /api/customer/orders/:id
// @access  Private (Customer)
export const getOrderById = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { id } = req.params;

        let query = { customerId };

        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else {
            query.orderId = id;
        }

        const order = await Order.findOne(query)
            .populate('customerId', 'username email')
            .populate('merchantId', 'businessName username')
            .populate('items.productId', 'name price images');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/customer/orders/:id/cancel
// @access  Private (Customer)
export const cancelOrder = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { id } = req.params;
        const { reason, sessionId, totalAmount } = req.body;

        const order = await Order.findOne({ _id: id, customerId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason || 'No reason provided';

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
            });
        }

        await order.save();

        // USE req.user._id for Cancellation as well
        try {
            const dashboardMerchantId = req.user._id; 

            if (sessionId && dashboardMerchantId) {
                await Event.findOneAndUpdate(
                    {
                        sessionId: sessionId,
                        merchantId: dashboardMerchantId, 
                        eventType: { $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'] }
                    },
                    {
                        $set: {
                            recoveryStatus: 'converted',
                            recoveredAt: new Date(),
                            cartTotal: totalAmount || order.total
                        }
                    }
                );

                // Also update the purchase_completed event if it exists
                await Event.findOneAndUpdate(
                    {
                        sessionId: sessionId,
                        merchantId: dashboardMerchantId, 
                        eventType: 'purchase_completed'
                    },
                    {
                        $set: {
                            recoveryStatus: 'converted',
                            cartTotal: totalAmount || order.total
                        }
                    }
                );
            }
        } catch (error) {
            console.error("Error updating recovery status:", error);
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order payment status
// @route   PUT /api/admin/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment status updated',
            order
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get sales prediction
// @route   POST /api/merchant/predict/sales
// @access  Private (Merchant)
export const predictSales = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { timeframe } = req.body; 

        // Get historical orders for this merchant
        const orders = await Order.find({ 
            merchantId,
            status: { $in: ['delivered', 'completed'] }
        }).sort({ createdAt: -1 });

        // Calculate historical averages
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate daily average
        const days = Math.max(1, Math.ceil((new Date() - new Date(orders[orders.length - 1]?.createdAt || Date.now())) / (1000 * 60 * 60 * 24)));
        const dailyAvgOrders = totalOrders / days;
        const dailyAvgRevenue = totalRevenue / days;

        // Predict based on timeframe
        let predictedSales, predictedRevenue, confidence;
        const volatility = 0.1 + Math.random() * 0.15;

        switch(timeframe) {
            case 'tomorrow':
                predictedSales = Math.round(dailyAvgOrders * (1 + (Math.random() - 0.5) * 0.2));
                predictedRevenue = Math.round(dailyAvgRevenue * (1 + (Math.random() - 0.5) * 0.2));
                confidence = Math.round(85 + Math.random() * 10);
                break;
            case 'nextWeek':
                predictedSales = Math.round(dailyAvgOrders * 7 * (1 + (Math.random() - 0.5) * 0.3));
                predictedRevenue = Math.round(dailyAvgRevenue * 7 * (1 + (Math.random() - 0.5) * 0.3));
                confidence = Math.round(75 + Math.random() * 15);
                break;
            case 'nextMonth':
                predictedSales = Math.round(dailyAvgOrders * 30 * (1 + (Math.random() - 0.5) * 0.4));
                predictedRevenue = Math.round(dailyAvgRevenue * 30 * (1 + (Math.random() - 0.5) * 0.4));
                confidence = Math.round(65 + Math.random() * 15);
                break;
            default:
                predictedSales = 0;
                predictedRevenue = 0;
                confidence = 0;
        }

        // Get top products
        const productSales = {};
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const name = item.productName || item.productId?.name || 'Unknown';
                productSales[name] = (productSales[name] || 0) + (item.quantity || 0);
            });
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                predicted: Math.round(count * (1 + (Math.random() - 0.5) * 0.3))
            }));

        // Determine trend
        const recentOrders = orders.slice(0, Math.min(10, orders.length));
        const olderOrders = orders.slice(Math.min(10, orders.length), Math.min(20, orders.length));
        const recentAvg = recentOrders.length > 0 ? recentOrders.reduce((s, o) => s + (o.total || 0), 0) / recentOrders.length : 0;
        const olderAvg = olderOrders.length > 0 ? olderOrders.reduce((s, o) => s + (o.total || 0), 0) / olderOrders.length : 0;
        
        let trend = 'stable';
        if (recentAvg > olderAvg * 1.1) trend = 'up';
        else if (recentAvg < olderAvg * 0.9) trend = 'down';

        res.status(200).json({
            success: true,
            data: {
                timeframe,
                predictedSales,
                predictedRevenue,
                confidence,
                trend,
                topProducts,
                avgOrderValue: Math.round(avgOrderValue),
                totalHistoricalOrders: totalOrders,
                dailyAvgOrders: Math.round(dailyAvgOrders * 10) / 10
            }
        });

    } catch (error) {
        console.error('Error predicting sales:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};