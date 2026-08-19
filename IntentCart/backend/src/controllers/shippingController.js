import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Notification from '../models/Notifications.js';
import Driver from '../models/Driver.js';

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

        // Get all drivers for this shipper to check assignment
        const drivers = await Driver.find({
            shipperId: req.user._id,
            isActive: true
        }).select('assignedOrders');

        // Get all order IDs assigned to this shipper's drivers
        const assignedOrderIds = [];
        drivers.forEach(driver => {
            if (driver.assignedOrders) {
                driver.assignedOrders.forEach(orderId => {
                    assignedOrderIds.push(orderId.toString());
                });
            }
        });

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
            merchantName: order.merchantId?.businessName || order.merchantId?.username || 'Unknown Merchant',
            // Add flag to check if order is assigned to this shipper's driver
            isAssignedToMyDriver: assignedOrderIds.includes(order._id.toString())
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

        // Find driver assigned to this order
        const drivers = await Driver.find({
            shipperId: req.user._id,
            isActive: true
        });

        // Check if any driver has this order assigned
        let assignedDriver = null;
        let isAssigned = false;

        for (const driver of drivers) {
            if (driver.assignedOrders && driver.assignedOrders.length > 0) {
                // Convert to string for comparison
                const assignedOrderIds = driver.assignedOrders.map(oId => oId.toString());
                if (assignedOrderIds.includes(order._id.toString())) {
                    isAssigned = true;
                    assignedDriver = {
                        id: driver._id,
                        name: driver.name || 'Unknown Driver',
                        phone: driver.phone || 'N/A',
                        vehicle: driver.vehicleNumber || 'Not Assigned',
                        vehicleType: driver.vehicleType || 'Not Specified',
                        rating: driver.rating || 0,
                        totalDeliveries: driver.totalDeliveries || 0,
                        licenseNumber: driver.licenseNumber || 'N/A',
                        status: driver.status || 'offline',
                        experience: driver.experience || 0
                    };
                    break;
                }
            }
        }

        // console.log('Order ID:', order._id.toString());
        // console.log('Is Assigned:', isAssigned);
        // console.log('Assigned Driver:', assignedDriver);

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
            discountAmount: order.discountAmount || 0,
            paidAt: order.paidAt || null,
            refundedAt: order.refundedAt || null,
            refundAmount: order.refundAmount || 0,
            // Add assignment flag and driver details
            isAssignedToMyDriver: isAssigned,
            assignedDriver: assignedDriver
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

        const validStatuses = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

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

        // Check if this order is assigned to the shipper's driver
        const drivers = await Driver.find({
            shipperId: req.user._id,
            isActive: true,
            assignedOrders: { $in: [order._id] }
        });

        const isAssigned = drivers.length > 0;

        // If order is not assigned to this shipper, deny access
        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: This order is not assigned to your drivers'
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
        }

        // 2. When order is marked as SHIPPED
        if (status === 'shipped' && previousStatus !== 'shipped') {
            await triggerOrderShippedNotification(
                orderId,
                customerName,
                order.trackingNumber || 'Not available'
            );
        }

        // 3. When order is marked as DELIVERED
        if (status === 'delivered' && previousStatus !== 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'paid';

            await createShipperNotification(
                'Payment Processed',
                `Payment of Rs.${order.total} for order #${orderId} has been successfully processed.`,
                'success',
                'Payments',
                { orderId, amount: order.total }
            );

            await triggerOrderDeliveredNotification(orderId, customerName);
        }

        // 4. When order is CANCELLED
        if (status === 'cancelled' && previousStatus !== 'cancelled') {
            order.cancelledAt = new Date();
            if (notes) {
                order.cancellationReason = notes;
            }

            if (order.paymentStatus === 'paid') {
                await processOrderRefund(order);
            }

            await triggerOrderCancelledNotification(orderId, customerName, notes);
        }

        // 5. When order is REFUNDED
        if (status === 'refunded' && previousStatus !== 'refunded') {
            await processOrderRefund(order);
            await createShipperNotification(
                'Order Refunded',
                `Order #${orderId} for ${customerName} has been refunded.`,
                'payment',
                'Payments',
                { orderId, customerName }
            );
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
                paymentStatus: order.paymentStatus,
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

// ==================== PAYMENT HELPER FUNCTIONS ====================

// Process order payment
const processOrderPayment = async (order) => {
    try {
        // Update payment status
        order.paymentStatus = 'paid';
        order.paidAt = new Date();

        await createPaymentTransaction(order, 'captured');

        console.log(`Payment processed for order ${order.orderId}: Rs.${order.total}`);
    } catch (error) {
        console.error('Payment processing failed:', error);
        order.paymentStatus = 'failed';
        // Log payment failure
        await createPaymentTransaction(order, 'failed', error.message);
        throw error;
    }
};

// Process order refund
const processOrderRefund = async (order) => {
    try {
        // Update payment status
        order.paymentStatus = 'refunded';
        order.refundedAt = new Date();

        await createPaymentTransaction(order, 'refunded');

        console.log(`Refund processed for order ${order.orderId}: Rs.${order.total}`);
    } catch (error) {
        console.error('Refund processing failed:', error);
        throw error;
    }
};

// Create payment transaction record
const createPaymentTransaction = async (order, status, errorMessage = null) => {
    try {

        // console.log(`Payment transaction recorded: ${status} - ${order.orderId}`);
    } catch (error) {
        console.error('Error recording payment transaction:', error);
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

        // Only count DELIVERED orders for revenue
        const revenueAgg = await Order.aggregate([
            {
                $match: {
                    status: 'delivered'  // Only delivered orders
                }
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

// @desc    Get order by orderId (search by orderId string)
// @route   GET /api/shipping/orders/search/:orderId
// @access  Private (Shipper only)
export const searchOrderByOrderId = async (req, res) => {
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

        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Search by orderId field (not _id)
        const order = await Order.findOne({ orderId: orderId })
            .populate('customerId', 'username email phone address')
            .populate('items.productId', 'name price images description')
            .populate('merchantId', 'username email businessName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order with ID "${orderId}" not found`
            });
        }

        // Find driver assigned to this order
        const drivers = await Driver.find({
            shipperId: req.user._id,
            isActive: true
        });

        // Check if any driver has this order assigned
        let assignedDriver = null;
        let isAssigned = false;

        for (const driver of drivers) {
            if (driver.assignedOrders && driver.assignedOrders.length > 0) {
                const assignedOrderIds = driver.assignedOrders.map(oId => oId.toString());
                if (assignedOrderIds.includes(order._id.toString())) {
                    isAssigned = true;
                    assignedDriver = {
                        id: driver._id,
                        name: driver.name || 'Unknown Driver',
                        phone: driver.phone || 'N/A',
                        vehicle: driver.vehicleNumber || 'Not Assigned',
                        vehicleType: driver.vehicleType || 'Not Specified',
                        rating: driver.rating || 0,
                        totalDeliveries: driver.totalDeliveries || 0,
                        licenseNumber: driver.licenseNumber || 'N/A',
                        status: driver.status || 'offline',
                        experience: driver.experience || 0
                    };
                    break;
                }
            }
        }

        const formattedOrder = {
            id: order._id,
            orderId: order.orderId,
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
            discountAmount: order.discountAmount || 0,
            paidAt: order.paidAt || null,
            refundedAt: order.refundedAt || null,
            refundAmount: order.refundAmount || 0,
            // Add assignment flag and driver details
            isAssignedToMyDriver: isAssigned,
            assignedDriver: assignedDriver
        };

        res.status(200).json({
            success: true,
            order: formattedOrder
        });
    } catch (error) {
        console.error('Error searching order by orderId:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== DRIVER MANAGEMENT ====================

// @desc    Get all drivers for a shipper
// @route   GET /api/shipping/drivers
// @access  Private (Shipper/Admin)
export const getAllDrivers = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        let query = {};

        if (req.user.role === 'shipper') {
            query.shipperId = req.user._id;
        }

        // Populate assignedOrders with order details
        const drivers = await Driver.find(query)
            .populate('shipperId', 'username email businessName')
            .populate({
                path: 'assignedOrders',
                select: 'orderId status total shippingAddress trackingNumber createdAt',
                populate: {
                    path: 'customerId',
                    select: 'username email'
                }
            })
            .sort({ createdAt: -1 });

        // Format drivers with proper order details
        const formattedDrivers = drivers.map(driver => {
            // Count delivered orders from assignedOrders
            const deliveredOrders = driver.assignedOrders?.filter(
                order => order.status === 'delivered'
            ) || [];

            // Count total orders
            const totalOrders = driver.assignedOrders?.length || 0;

            // Get successful deliveries count
            const successfulDeliveries = deliveredOrders.length;

            // Calculate failed deliveries (if any)
            const failedDeliveries = driver.failedDeliveries || 0;

            return {
                id: driver._id,
                driverId: driver.driverId,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber,
                status: driver.status,
                currentLoad: totalOrders,
                maxCapacity: driver.maxCapacity || 10,
                rating: driver.rating || 0,
                // Set totalDeliveries from successful deliveries
                totalDeliveries: successfulDeliveries,
                successfulDeliveries: successfulDeliveries,
                failedDeliveries: failedDeliveries,
                zone: driver.address?.city || 'Not Assigned',
                assignedOrders: driver.assignedOrders || [],
                assignedOrdersCount: totalOrders,
                createdAt: driver.createdAt,
                isActive: driver.isActive,
                licenseNumber: driver.licenseNumber,
                experience: driver.experience,
                // Include delivery stats
                deliveryStats: {
                    total: totalOrders,
                    completed: successfulDeliveries,
                    pending: totalOrders - successfulDeliveries,
                    failed: failedDeliveries,
                    successRate: totalOrders > 0 ? Math.round((successfulDeliveries / totalOrders) * 100) : 0
                }
            };
        });

        res.status(200).json({
            success: true,
            count: formattedDrivers.length,
            drivers: formattedDrivers
        });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single driver
// @route   GET /api/shipping/drivers/:id
// @access  Private (Shipper/Admin)
export const getDriverById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        const driver = await Driver.findById(req.params.id)
            .populate('shipperId', 'username email businessName phone')
            .populate('assignedOrders', 'orderId status total shippingAddress');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if shipper has access to this driver
        if (req.user.role === 'shipper' && driver.shipperId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: This driver does not belong to you'
            });
        }

        res.status(200).json({
            success: true,
            driver
        });
    } catch (error) {
        console.error('Error fetching driver:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create new driver
// @route   POST /api/shipping/drivers
// @access  Private (Shipper/Admin)
export const createDriver = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        const shipperId = req.user.role === 'shipper' ? req.user._id : req.body.shipperId;

        if (!shipperId) {
            return res.status(400).json({
                success: false,
                message: 'Shipper ID is required'
            });
        }

        const driverData = {
            ...req.body,
            shipperId: shipperId,
            currentLoad: 0,
            assignedOrders: []
        };

        const driver = new Driver(driverData);
        await driver.save();

        res.status(201).json({
            success: true,
            message: 'Driver created successfully',
            driver
        });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update driver
// @route   PUT /api/shipping/drivers/:id
// @access  Private (Shipper/Admin)
export const updateDriver = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if shipper has access
        if (req.user.role === 'shipper' && driver.shipperId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const updatedDriver = await Driver.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Driver updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update driver status
// @route   PUT /api/shipping/drivers/:id/status
// @access  Private (Shipper/Admin)
export const updateDriverStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        const { status } = req.body;
        const validStatuses = ['available', 'busy', 'on_break', 'offline', 'unavailable'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid: ' + validStatuses.join(', ')
            });
        }

        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if shipper has access
        if (req.user.role === 'shipper' && driver.shipperId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        driver.status = status;
        await driver.save();

        res.status(200).json({
            success: true,
            message: 'Driver status updated successfully',
            driver
        });
    } catch (error) {
        console.error('Error updating driver status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete driver (hard delete - permanent)
// @route   DELETE /api/shipping/drivers/:id
// @access  Private (Shipper/Admin)
export const deleteDriver = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { id } = req.params;

        const driver = await Driver.findById(id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        if (req.user.role === 'shipper' && driver.shipperId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Driver.findByIdAndDelete(id);

        // console.log(`Driver ${driver.name} (${driver.driverId}) permanently deleted`);

        res.status(200).json({
            success: true,
            message: `Driver ${driver.name} permanently deleted`,
            deletedDriver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId
            }
        });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Assign order to driver
// @route   PUT /api/shipping/drivers/:id/assign-order
// @access  Private (Shipper/Admin)
export const assignOrderToDriver = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login first'
            });
        }

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if shipper has access
        if (req.user.role === 'shipper' && driver.shipperId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if order is already assigned to this driver
        if (driver.assignedOrders && driver.assignedOrders.includes(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Order already assigned to this driver'
            });
        }

        if (!driver.canAcceptOrder()) {
            return res.status(400).json({
                success: false,
                message: 'Driver cannot accept more orders'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Assign order to driver
        if (!driver.assignedOrders) {
            driver.assignedOrders = [];
        }
        driver.assignedOrders.push(orderId);
        driver.currentLoad = driver.assignedOrders.length;

        // Update status if at max capacity
        if (driver.currentLoad >= driver.maxCapacity) {
            driver.status = 'busy';
        }

        await driver.save();

        res.status(200).json({
            success: true,
            message: 'Order assigned to driver successfully',
            driver: {
                id: driver._id,
                name: driver.name,
                currentLoad: driver.currentLoad,
                assignedOrdersCount: driver.assignedOrders.length,
                status: driver.status
            }
        });
    } catch (error) {
        console.error('Error assigning order to driver:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};