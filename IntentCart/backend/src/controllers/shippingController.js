import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Notification from '../models/Notifications.js';

// ==================== NOTIFICATION HELPERS ====================

// Shipper notification triggers
const createShipperNotification = async (title, message, type, category, metadata = {}) => {
    try {
        await Notification.create({
            title,
            message,
            type: type || 'info',
            category: category || 'Orders',
            panel: 'shipper',
            isGlobal: false,
            actionLink: metadata?.orderId ? `/shipping/orders/${metadata.orderId}` : '/shipping-dashboard',
            actionLabel: 'View Order',
            metadata
        });
    } catch (error) {
        console.error('Error creating shipper notification:', error);
    }
};

const triggerOrderProcessingNotification = async (orderId, customerName) => {
    await createShipperNotification(
        'Order Processing Started',
        `Order #${orderId} for ${customerName} is now being processed.`,
        'info',
        'Orders',
        { orderId, customerName }
    );
};

const triggerOrderShippedNotification = async (orderId, customerName, trackingNumber) => {
    await createShipperNotification(
        'Order Shipped!',
        `Order #${orderId} for ${customerName} has been shipped. Tracking: ${trackingNumber || 'N/A'}`,
        'success',
        'Orders',
        { orderId, customerName, trackingNumber }
    );
};

const triggerOrderDeliveredNotification = async (orderId, customerName) => {
    await createShipperNotification(
        'Order Delivered!',
        `Order #${orderId} for ${customerName} has been successfully delivered.`,
        'success',
        'Orders',
        { orderId, customerName }
    );
};

const triggerOrderCancelledNotification = async (orderId, customerName, reason) => {
    await createShipperNotification(
        'Order Cancelled',
        `Order #${orderId} for ${customerName} has been cancelled. Reason: ${reason || 'No reason provided'}`,
        'alert',
        'Orders',
        { orderId, customerName, reason }
    );
};

const triggerTrackingUpdatedNotification = async (orderId, customerName, trackingNumber) => {
    await createShipperNotification(
        'Tracking Updated',
        `Tracking number for order #${orderId} (${customerName}) has been updated to ${trackingNumber}`,
        'info',
        'Shipping',
        { orderId, customerName, trackingNumber }
    );
};

const triggerShipperAssignedNotification = async (orderId, customerName, shipperName) => {
    await createShipperNotification(
        'Shipper Assigned',
        `Order #${orderId} for ${customerName} has been assigned to ${shipperName}.`,
        'info',
        'Orders',
        { orderId, customerName, shipperName }
    );
};

// ==================== CONTROLLER FUNCTIONS ====================

// @desc    Get all orders for shipping
// @route   GET /api/shipping/orders
// @access  Private (Shipper only)
export const getShippingOrders = async (req, res) => {
    try {
        // Check if user is authenticated and is a shipper
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can access this endpoint'
            });
        }

        const { status, page = 1, limit = 1000 } = req.query;

        let query = {};

        // Filter by status - only apply if status is provided
        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customerId', 'username email phone')
                .populate('items.productId', 'name price images')
                .populate('merchantId', 'username email businessName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            customer: order.customerId?.username || 'Unknown Customer',
            email: order.customerId?.email || '',
            phone: order.customerId?.phone || '',
            product: order.items?.[0]?.productName || 'Multiple Items',
            quantity: order.items?.length || 1,
            price: order.subtotal || 0,
            total: order.total || 0,
            address: order.shippingAddress ?
                `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}` :
                'No address provided',
            payment: order.paymentMethod || 'Not specified',
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'pending',
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }),
            notes: order.cancellationReason || '',
            items: order.items || [],
            shippingAddress: order.shippingAddress || {},
            trackingNumber: order.trackingNumber || '',
            estimatedDelivery: order.estimatedDelivery || '',
            deliveredAt: order.deliveredAt || '',
            merchantId: order.merchantId?._id || null,
            merchantName: order.merchantId?.businessName || order.merchantId?.username || 'Unknown Merchant'
        }));

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Error fetching shipping orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single order for shipping details
// @route   GET /api/shipping/orders/:id
// @access  Private (Shipper only)
export const getShippingOrderById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can access this endpoint'
            });
        }

        const { id } = req.params;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }

        const order = await Order.findById(id)
            .populate('customerId', 'username email phone address')
            .populate('items.productId', 'name price images description')
            .populate('merchantId', 'username email businessName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const formattedOrder = {
            id: order._id,
            orderId: order.orderId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            customer: order.customerId?.username || 'Unknown Customer',
            email: order.customerId?.email || '',
            phone: order.customerId?.phone || '',
            product: order.items?.[0]?.productName || 'Multiple Items',
            quantity: order.items?.length || 1,
            price: order.subtotal || 0,
            total: order.total || 0,
            subtotal: order.subtotal || 0,
            shippingCost: order.shippingCost || 0,
            tax: order.tax || 0,
            discount: order.discount || 0,
            address: order.shippingAddress ?
                `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}` :
                'No address provided',
            shippingAddress: order.shippingAddress || {},
            payment: order.paymentMethod || 'Not specified',
            paymentStatus: order.paymentStatus || 'pending',
            status: order.status || 'pending',
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }),
            notes: order.cancellationReason || '',
            items: order.items || [],
            trackingNumber: order.trackingNumber || '',
            estimatedDelivery: order.estimatedDelivery ?
                new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                }) : '',
            deliveredAt: order.deliveredAt ?
                new Date(order.deliveredAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                }) : '',
            merchant: order.merchantId?.businessName || order.merchantId?.username || 'Unknown Merchant',
            merchantId: order.merchantId?._id || null,
            couponCode: order.couponCode || '',
            discountAmount: order.discountAmount || 0
        };

        res.status(200).json({
            success: true,
            order: formattedOrder
        });
    } catch (error) {
        console.error('Error fetching shipping order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order shipping status
// @route   PUT /api/shipping/orders/:id/status
// @access  Private (Shipper only)
export const updateShippingStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can update order status'
            });
        }

        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid: ' + validStatuses.join(', ')
            });
        }

        const order = await Order.findById(id)
            .populate('customerId', 'username email')
            .populate('merchantId', 'username email businessName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const previousStatus = order.status;
        const orderId = order.orderId || order._id.toString().slice(-6).toUpperCase();
        const customerName = order.customerId?.username || 'Customer';

        // Update order status
        order.status = status;

        // ==================== SEND NOTIFICATIONS ====================

        // 1. When order is marked as PROCESSING
        if (status === 'processing' && previousStatus !== 'processing') {
            await triggerOrderProcessingNotification(orderId, customerName);
            // console.log(`Processing notification sent for order ${orderId}`);
        }

        // 2. When order is marked as SHIPPED
        if (status === 'shipped' && previousStatus !== 'shipped') {
            await triggerOrderShippedNotification(
                orderId,
                customerName,
                order.trackingNumber || 'Not available'
            );
            // console.log(`Shipping notification sent for order ${orderId}`);
        }

        // 3. When order is marked as DELIVERED
        if (status === 'delivered' && previousStatus !== 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'paid';

            await triggerOrderDeliveredNotification(orderId, customerName);
            // console.log(`Delivery notification sent for order ${orderId}`);
        }

        // 4. When order is CANCELLED
        if (status === 'cancelled' && previousStatus !== 'cancelled') {
            order.cancelledAt = new Date();
            if (notes) {
                order.cancellationReason = notes;
            }

            await triggerOrderCancelledNotification(orderId, customerName, notes);
            // console.log(`Cancellation notification sent for order ${orderId}`);
        }

        // 5. When order is REFUNDED
        if (status === 'refunded' && previousStatus !== 'refunded') {
            await createShipperNotification(
                'Order Refunded',
                `Order #${orderId} for ${customerName} has been refunded.`,
                'payment',
                'Payments',
                { orderId, customerName }
            );
            // console.log(`Refund notification sent for order ${orderId}`);
        }

        await order.save();

        // Update shipper performance metrics
        if (req.user && req.user.role === 'shipper') {
            await updateShipperPerformance(req.user._id, status === 'delivered');
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status,
                deliveredAt: order.deliveredAt,
                cancellationReason: order.cancellationReason
            }
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

// Helper function to update shipper performance
const updateShipperPerformance = async (shipperId, isSuccessful) => {
    try {
        const shipper = await User.findById(shipperId);
        if (!shipper || shipper.role !== 'shipper') return;

        if (!shipper.shipperDetails) {
            shipper.shipperDetails = {};
        }

        shipper.shipperDetails.totalDeliveries = (shipper.shipperDetails.totalDeliveries || 0) + 1;

        if (isSuccessful) {
            shipper.shipperDetails.successfulDeliveries = (shipper.shipperDetails.successfulDeliveries || 0) + 1;
        } else {
            shipper.shipperDetails.failedDeliveries = (shipper.shipperDetails.failedDeliveries || 0) + 1;
        }

        const successRate = shipper.shipperDetails.successfulDeliveries / shipper.shipperDetails.totalDeliveries;
        shipper.shipperDetails.rating = Math.round(successRate * 5 * 10) / 10;

        await shipper.save();
    } catch (error) {
        console.error('Error updating shipper performance:', error);
    }
};

// @desc    Update tracking number
// @route   PUT /api/shipping/orders/:id/tracking
// @access  Private (Shipper only)
export const updateTrackingNumber = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can update tracking numbers'
            });
        }

        const { id } = req.params;
        const { trackingNumber, estimatedDelivery } = req.body;

        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number is required'
            });
        }

        const order = await Order.findById(id)
            .populate('customerId', 'username email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const orderId = order.orderId || order._id.toString().slice(-6).toUpperCase();
        const customerName = order.customerId?.username || 'Customer';

        order.trackingNumber = trackingNumber;
        if (estimatedDelivery) {
            order.estimatedDelivery = new Date(estimatedDelivery);
        }

        if (order.status === 'processing') {
            order.status = 'shipped';
        }

        await order.save();

        // Send tracking update notification
        await triggerTrackingUpdatedNotification(orderId, customerName, trackingNumber);
        // console.log(`Tracking update notification sent for order ${orderId}`);

        res.status(200).json({
            success: true,
            message: 'Tracking number updated successfully',
            order: {
                id: order._id,
                orderId: order.orderId,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: order.estimatedDelivery,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Error updating tracking number:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get shipping statistics for dashboard
// @route   GET /api/shipping/stats
// @access  Private (Shipper only)
export const getShippingStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can access stats'
            });
        }

        const stats = {
            total: await Order.countDocuments(),
            pending: await Order.countDocuments({ status: 'pending' }),
            processing: await Order.countDocuments({ status: 'processing' }),
            shipped: await Order.countDocuments({ status: 'shipped' }),
            delivered: await Order.countDocuments({ status: 'delivered' }),
            cancelled: await Order.countDocuments({ status: 'cancelled' }),
            refunded: await Order.countDocuments({ status: 'refunded' })
        };

        const paymentStats = {
            paid: await Order.countDocuments({ paymentStatus: 'paid' }),
            pending: await Order.countDocuments({ paymentStatus: 'pending' }),
            failed: await Order.countDocuments({ paymentStatus: 'failed' }),
            refunded: await Order.countDocuments({ paymentStatus: 'refunded' })
        };

        const revenueAgg = await Order.aggregate([
            {
                $match: { status: { $in: ['delivered', 'shipped'] } }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const revenue = revenueAgg[0]?.totalRevenue || 0;
        const totalOrders = revenueAgg[0]?.totalOrders || 0;

        res.status(200).json({
            success: true,
            stats: {
                ...stats,
                payment: paymentStats,
                revenue: {
                    total: revenue,
                    orders: totalOrders,
                    average: totalOrders > 0 ? revenue / totalOrders : 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching shipping stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available shippers for assignment
// @route   GET /api/shipping/available-shippers
// @access  Private (Admin only)
export const getAvailableShippers = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only admins can view available shippers'
            });
        }

        const shippers = await User.find({
            role: 'shipper',
            isActive: true,
            isApproved: true,
            'shipperDetails.currentStatus': 'available'
        }).select('username email shipperDetails performanceMetrics');

        const formattedShippers = shippers.map(shipper => ({
            id: shipper._id,
            username: shipper.username,
            email: shipper.email,
            branch: shipper.shipperDetails?.branch || 'Not Assigned',
            rating: shipper.shipperDetails?.rating || 0,
            totalDeliveries: shipper.shipperDetails?.totalDeliveries || 0,
            currentStatus: shipper.shipperDetails?.currentStatus || 'available'
        }));

        res.status(200).json({
            success: true,
            count: formattedShippers.length,
            shippers: formattedShippers
        });
    } catch (error) {
        console.error('Error fetching available shippers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Assign shipper to order
// @route   PUT /api/shipping/orders/:id/assign
// @access  Private (Admin only)
export const assignShipperToOrder = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only admins can assign shippers'
            });
        }

        const { id } = req.params;
        const { shipperId } = req.body;

        if (!shipperId) {
            return res.status(400).json({
                success: false,
                message: 'Shipper ID is required'
            });
        }

        const order = await Order.findById(id)
            .populate('customerId', 'username email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const shipper = await User.findById(shipperId);
        if (!shipper || shipper.role !== 'shipper') {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        const orderId = order.orderId || order._id.toString().slice(-6).toUpperCase();
        const customerName = order.customerId?.username || 'Customer';

        // Update order with shipper info
        order.status = 'processing';
        await order.save();

        // Add order to shipper's assigned orders
        if (!shipper.shipperDetails) {
            shipper.shipperDetails = {};
        }
        if (!shipper.shipperDetails.assignedOrders) {
            shipper.shipperDetails.assignedOrders = [];
        }
        shipper.shipperDetails.assignedOrders.push(order._id);
        shipper.shipperDetails.currentStatus = 'busy';
        await shipper.save();

        // Send shipper assignment notification
        await triggerShipperAssignedNotification(orderId, customerName, shipper.username);
        // console.log(`Shipper assignment notification sent for order ${orderId}`);

        res.status(200).json({
            success: true,
            message: 'Shipper assigned successfully',
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status,
                assignedShipper: shipperId
            }
        });
    } catch (error) {
        console.error('Error assigning shipper:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== SHIPPER NOTIFICATION FUNCTIONS ====================

// @desc    Get shipper notifications (only shipper panel)
// @route   GET /api/shipping/notifications/shipper
// @access  Private (Shipper only)
export const getShipperNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only shippers can view notifications'
            });
        }

        // Import Notification model at the top of the file
        const notifications = await Notification.find({
            panel: 'shipper'
        })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/shipping/notifications/shipper/:id/read
// @access  Private (Shipper only)
export const markNotificationAsRead = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { id } = req.params;

        const notification = await Notification.findOne({
            _id: id,
            panel: 'shipper'
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/shipping/notifications/shipper/mark-all-read
// @access  Private (Shipper only)
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Notification.updateMany(
            {
                panel: 'shipper',
                read: false
            },
            {
                read: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/shipping/notifications/shipper/:id
// @access  Private (Shipper only)
export const deleteNotification = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            panel: 'shipper'
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get unread count
// @route   GET /api/shipping/notifications/shipper/unread-count
// @access  Private (Shipper only)
export const getUnreadCount = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const count = await Notification.countDocuments({
            panel: 'shipper',
            read: false
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};