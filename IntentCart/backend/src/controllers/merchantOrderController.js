import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notifications.js';

// @desc    Get merchant orders
// @route   GET /api/merchant/orders
// @access  Private (Merchant)
export const getMerchantOrders = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { status, page = 1, limit = 20, search } = req.query;

        let query = { merchantId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'customerId.name': { $regex: search, $options: 'i' } },
                { 'customerId.username': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('customerId', 'username name email phone')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);
        const pendingOrders = await Order.countDocuments({ merchantId, status: 'pending' });

        // Only count delivered orders as completed
        const completedOrders = await Order.countDocuments({
            merchantId,
            status: 'delivered'
        });

        // Calculate total revenue from delivered orders only
        const deliveredOrders = await Order.find({
            merchantId,
            status: 'delivered'
        });
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);

        // Calculate average order value from delivered orders
        const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            pendingOrders,
            completedOrders,
            avgOrderValue,
            totalRevenue,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        console.error('Error fetching merchant orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single order
// @route   GET /api/merchant/orders/:id
// @access  Private (Merchant)
export const getMerchantOrderById = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, merchantId })
            .populate('customerId', 'username name email phone address')
            .populate('items.productId', 'name price images description')
            .populate('merchantId', 'businessName username');

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

// @desc    Update order status
// @route   PUT /api/merchant/orders/:id/status
// @access  Private (Merchant)
export const updateOrderStatus = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;
        const { status, trackingNumber } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid: ' + validStatuses.join(', ')
            });
        }

        const order = await Order.findOne({ _id: id, merchantId })
            .populate('customerId', 'username email name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order
        order.status = status;
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }
        if (status === 'shipped') {
            order.estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        }

        await order.save();

        // Create notification for customer
        await Notification.create({
            title: `Order ${status === 'shipped' ? 'Shipped' : 'Updated'}`,
            message: `Your order #${order.orderId} has been ${status}${status === 'shipped' ? ` with tracking #${trackingNumber || 'N/A'}` : ''}`,
            type: 'order',
            category: 'Orders',
            panel: 'customer',
            customerId: order.customerId._id,
            isGlobal: false,
            actionLink: `/orders/${order._id}`,
            actionLabel: 'View Order',
            metadata: { orderId: order.orderId, status }
        });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get order statistics
// @route   GET /api/merchant/orders/stats
// @access  Private (Merchant)
export const getOrderStats = async (req, res) => {
    try {
        const merchantId = req.user._id;

        const totalOrders = await Order.countDocuments({ merchantId });
        const pendingOrders = await Order.countDocuments({ merchantId, status: 'pending' });
        const processingOrders = await Order.countDocuments({ merchantId, status: 'processing' });
        const shippedOrders = await Order.countDocuments({ merchantId, status: 'shipped' });
        const deliveredOrders = await Order.countDocuments({ merchantId, status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ merchantId, status: 'cancelled' });

        // Calculate revenue from delivered orders only
        const completedOrders = await Order.find({
            merchantId,
            status: 'delivered'
        });

        // SUM all totals from delivered orders
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

        // Get monthly orders (last 6 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const now = new Date();
        const monthlyOrders = [];
        const monthlyRevenue = [];

        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            // Count orders for this month
            const count = await Order.countDocuments({
                merchantId,
                createdAt: { $gte: month, $lt: nextMonth }
            });
            monthlyOrders.push(count);

            // Calculate revenue for this month (delivered orders only)
            const monthOrders = await Order.find({
                merchantId,
                status: 'delivered',
                createdAt: { $gte: month, $lt: nextMonth }
            });
            const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
            monthlyRevenue.push(monthRevenue);
        }

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                avgOrderValue,
                monthlyOrders,
                monthlyRevenue,
                months
            }
        });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};