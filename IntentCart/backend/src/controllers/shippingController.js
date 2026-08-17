import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get all orders for shipping
// @route   GET /api/shipping/orders
// @access  Private (Shipper only)
export const getShippingOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 100 } = req.query;

        let query = {};

        // Filter by status - only apply if status is provided
        if (status && status !== 'all') {
            query.status = status;
        }
        // If no status filter, get ALL orders (not just pending/processing)

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customerId', 'username email phone')
                .populate('items.productId', 'name price images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        // Format orders for shipping
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
            deliveredAt: order.deliveredAt || ''
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
        const { id } = req.params;

        // Check if id is valid
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        // Check if id is a valid ObjectId
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

        // Format order for shipping
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
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid: ' + validStatuses.join(', ')
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        order.status = status;

        // If delivered, update deliveredAt
        if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'paid';
        }

        // If cancelled, update cancelledAt
        if (status === 'cancelled') {
            order.cancelledAt = new Date();
            if (notes) {
                order.cancellationReason = notes;
            }
        }

        await order.save();

        // Update shipper performance metrics (if shipper is assigned)
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

        // Update rating (simple calculation)
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
        const { id } = req.params;
        const { trackingNumber, estimatedDelivery } = req.body;

        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number is required'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.trackingNumber = trackingNumber;
        if (estimatedDelivery) {
            order.estimatedDelivery = new Date(estimatedDelivery);
        }

        // Update status to shipped if it's not already
        if (order.status === 'processing') {
            order.status = 'shipped';
        }

        await order.save();

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
        const stats = {
            total: await Order.countDocuments(),
            pending: await Order.countDocuments({ status: 'pending' }),
            processing: await Order.countDocuments({ status: 'processing' }),
            shipped: await Order.countDocuments({ status: 'shipped' }),
            delivered: await Order.countDocuments({ status: 'delivered' }),
            cancelled: await Order.countDocuments({ status: 'cancelled' }),
            refunded: await Order.countDocuments({ status: 'refunded' })
        };

        // Get payment stats
        const paymentStats = {
            paid: await Order.countDocuments({ paymentStatus: 'paid' }),
            pending: await Order.countDocuments({ paymentStatus: 'pending' }),
            failed: await Order.countDocuments({ paymentStatus: 'failed' }),
            refunded: await Order.countDocuments({ paymentStatus: 'refunded' })
        };

        // Get revenue stats
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
// @access  Private (Admin or Shipper)
export const assignShipperToOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { shipperId } = req.body;

        if (!shipperId) {
            return res.status(400).json({
                success: false,
                message: 'Shipper ID is required'
            });
        }

        const order = await Order.findById(id);
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