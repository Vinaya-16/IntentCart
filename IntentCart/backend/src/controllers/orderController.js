import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import {
    triggerOrderPlacedNotification
} from '../utils/notificationTriggers.js';
import { notifyMerchantNewOrder } from '../utils/notificationTriggers.js';

// ==================== ORDER MANAGEMENT ====================

// @desc    Create order
// @route   POST /api/customer/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { shippingAddress, paymentMethod } = req.body;

        // console.log('Creating order for customer:', customerId);

        // Get cart
        const cart = await Cart.findOne({ customerId })
            .populate('items.productId', 'name price images stock merchantId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // console.log('Cart items:', cart.items.length);

        // Check stock and calculate totals
        let subtotal = 0;
        const orderItems = [];
        let merchantId = null;

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

            // Get merchantId from product
            if (product.merchantId) {
                merchantId = product.merchantId;
            }

            // Update product stock
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

        // console.log('Order totals:', { subtotal, shippingCost, tax, total });

        // Create order - let orderId auto-generate
        const order = new Order({
            customerId,
            merchantId: merchantId,
            items: orderItems,
            subtotal,
            shippingCost,
            tax,
            total,
            shippingAddress,
            paymentMethod,
            status: 'pending',
            // Set payment status based on payment method
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
        });

        await order.save();
        // console.log('Order created:', order.orderId);

        // Clear cart
        cart.items = [];
        cart.subtotal = 0;
        cart.total = 0;
        await cart.save();

        // Update user's total orders
        await User.findByIdAndUpdate(customerId, { $inc: { totalOrders: 1 } });

        // TRIGGER: Order Placed Notification (Customer)
        await triggerOrderPlacedNotification(customerId, order.orderId, total);

        // TRIGGER: New Order Notification (Merchant)
        if (merchantId) {
            const customer = await User.findById(customerId);
            await notifyMerchantNewOrder(
                merchantId,
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

        // Handle validation errors
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

        // Check if the id is a valid ObjectId or a string
        let query = { customerId };

        // If id is a valid ObjectId string, search by _id
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id;
        } else {
            // Otherwise search by orderId
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
        const { reason } = req.body;

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

// In orderController.js - Admin function to update payment status
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