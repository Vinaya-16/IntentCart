import Return from '../models/Return.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Notification from '../models/Notifications.js';

// @desc    Create a return request
// @route   POST /api/returns
// @access  Private (Customer)
export const createReturn = async (req, res) => {
    try {
        const { orderId, items, reason, reasonDescription, refundMethod } = req.body;

        // Check if order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to customer
        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only return your own orders'
            });
        }

        // Check if order is delivered (only delivered orders can be returned)
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Only delivered orders can be returned'
            });
        }

        // Check if return already exists for this order
        const existingReturn = await Return.findOne({
            orderId: orderId,
            isActive: true,
            status: { $nin: ['completed', 'refund_processed'] }
        });

        if (existingReturn) {
            return res.status(400).json({
                success: false,
                message: 'A return request already exists for this order'
            });
        }

        // Calculate refund amount
        let refundAmount = 0;
        const returnItems = items.map(item => {
            const orderItem = order.items.find(oi => oi.productId.toString() === item.productId);
            const price = orderItem ? orderItem.price : 0;
            const total = price * item.quantity;
            refundAmount += total;
            return {
                productId: item.productId,
                productName: orderItem ? orderItem.productName : 'Unknown Product',
                quantity: item.quantity,
                price: price,
                total: total
            };
        });

        const returnData = {
            orderId: order._id,
            orderNumber: order.orderId,
            customerId: req.user._id,
            merchantId: order.merchantId || null,
            items: returnItems,
            reason: reason,
            reasonDescription: reasonDescription || '',
            refundMethod: refundMethod || 'original_payment',
            refundAmount: refundAmount,
            pickupAddress: order.shippingAddress,
            status: 'pending'
        };

        const newReturn = new Return(returnData);
        await newReturn.save();

        res.status(201).json({
            success: true,
            message: 'Return request created successfully',
            return: newReturn
        });
    } catch (error) {
        console.error('Error creating return:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all returns (Admin/Shipper)
// @route   GET /api/returns
// @access  Private (Admin/Shipper)
export const getAllReturns = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const returns = await Return.find(query)
            .populate('customerId', 'username email phone')
            .populate('orderId', 'orderId total shippingAddress')
            .populate('items.productId', 'name price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Return.countDocuments(query);

        // Format returns for frontend 
        const formattedReturns = returns.map(ret => {
            // Get refund amount from the return document
            let refundAmount = ret.refundAmount || 0;
            
            // If refundAmount is 0, calculate from items
            if (refundAmount === 0 && ret.items && ret.items.length > 0) {
                refundAmount = ret.items.reduce((sum, item) => {
                    const price = item.price || item.productId?.price || 0;
                    const quantity = item.quantity || 1;
                    return sum + (price * quantity);
                }, 0);
            }

            // Log for debugging
            // if (refundAmount === 0 && ret.status === 'completed') {
            //     console.log(`Return ${ret._id} has 0 refund amount but is completed`);
            // }

            return {
                _id: ret._id,
                returnId: ret.returnId || ret._id.toString().slice(-6),
                orderId: ret.orderId?._id || ret.orderId,
                orderNumber: ret.orderNumber || ret.orderId?.orderId || `ORD-${ret._id.toString().slice(-6)}`,
                customerId: ret.customerId ? {
                    _id: ret.customerId._id,
                    username: ret.customerId.username || 'Unknown',
                    email: ret.customerId.email || '',
                    phone: ret.customerId.phone || ''
                } : { username: 'Unknown', email: '' },
                items: ret.items.map(item => ({
                    ...item.toObject ? item.toObject() : item,
                    productName: item.productId?.name || item.productName || 'Unknown Product',
                    price: item.price || item.productId?.price || 0,
                    image: item.productId?.images?.[0]?.url || item.image || null,
                    quantity: item.quantity || 1,
                    total: (item.price || item.productId?.price || 0) * (item.quantity || 1)
                })),
                itemCount: ret.items?.length || 0,
                productName: ret.items?.[0]?.productName || ret.items?.[0]?.productId?.name || 'Multiple Items',
                reason: ret.reason || 'other',
                reasonDescription: ret.reasonDescription || '',
                status: ret.status || 'pending',
                refundMethod: ret.refundMethod || 'original_payment',
                refundAmount: refundAmount, 
                pickupAddress: ret.pickupAddress || {},
                pickupScheduledAt: ret.pickupScheduledAt,
                pickedUpAt: ret.pickedUpAt,
                qualityCheckNotes: ret.qualityCheckNotes || '',
                rejectionReason: ret.rejectionReason || '',
                refundProcessedAt: ret.refundProcessedAt,
                notes: ret.notes || '',
                images: ret.images || [],
                createdAt: ret.createdAt,
                updatedAt: ret.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            count: formattedReturns.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            returns: formattedReturns
        });
    } catch (error) {
        console.error('Error fetching returns:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get customer's returns
// @route   GET /api/returns/my-returns
// @access  Private (Customer)
export const getCustomerReturns = async (req, res) => {
    try {
        const returns = await Return.find({
            customerId: req.user._id,
            isActive: true
        })
            .populate('orderId', 'orderId total')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: returns.length,
            returns
        });
    } catch (error) {
        console.error('Error fetching customer returns:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get return by ID
// @route   GET /api/returns/:id
// @access  Private
export const getReturnById = async (req, res) => {
    try {
        const returnData = await Return.findById(req.params.id)
            .populate('customerId', 'username email phone')
            .populate('orderId', 'orderId total shippingAddress')
            .populate('items.productId', 'name price images');

        if (!returnData) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }

        res.status(200).json({
            success: true,
            return: returnData
        });
    } catch (error) {
        console.error('Error fetching return:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update return status (Admin/Shipper)
// @route   PUT /api/returns/:id/status
// @access  Private (Admin/Shipper)
export const updateReturnStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, rejectionReason, qualityCheckNotes } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'quality_inspection', 'refund_processed', 'completed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid: ' + validStatuses.join(', ')
            });
        }

        const returnData = await Return.findById(id);
        if (!returnData) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }

        // Ensure refund amount is calculated before completing
        if (status === 'refund_processed' || status === 'completed') {
            // Calculate refund amount if it's 0
            if (returnData.refundAmount === 0 && returnData.items && returnData.items.length > 0) {
                let refundAmount = returnData.items.reduce((sum, item) => {
                    const price = item.price || 0;
                    const quantity = item.quantity || 1;
                    return sum + (price * quantity);
                }, 0);
                
                if (refundAmount > 0) {
                    returnData.refundAmount = refundAmount;
                    // console.log(`Updated refund amount for return ${id}: Rs.${refundAmount}`);
                }
            }
        }

        // Get the associated order
        const order = await Order.findById(returnData.orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Associated order not found'
            });
        }

        // Update return status
        returnData.status = status;

        if (notes) returnData.notes = notes;
        if (rejectionReason) returnData.rejectionReason = rejectionReason;
        if (qualityCheckNotes) returnData.qualityCheckNotes = qualityCheckNotes;

        if (status === 'pickup_scheduled') {
            returnData.pickupScheduledAt = new Date();
        }
        if (status === 'picked_up') {
            returnData.pickedUpAt = new Date();
        }

        // ONLY when return is COMPLETED or REFUND_PROCESSED, update order status
        if (status === 'refund_processed' || status === 'completed') {
            returnData.refundProcessedAt = new Date();
            
            order.status = 'returned';
            order.paymentStatus = 'refunded';
            
            if (order.deliveredAt) {
                order.returnedAt = new Date();
            }
            
            await order.save();
            // console.log(`Order ${order.orderId} status updated to 'returned' (return completed)`);
        }

        // When return is rejected, revert order status if it was changed
        if (status === 'rejected') {
            if (order.status === 'returned') {
                order.status = 'delivered';
                order.paymentStatus = 'paid';
                await order.save();
                // console.log(`Order ${order.orderId} status reverted to 'delivered'`);
            }
        }

        await returnData.save();

        // Create notification for customer
        if (returnData.customerId) {
            try {
                if (Notification) {
                    await Notification.create({
                        title: status === 'completed' || status === 'refund_processed'
                            ? 'Return Completed & Refund Processed'
                            : status === 'rejected'
                                ? 'Return Request Rejected'
                                : `Return Status Updated: ${status.replace('_', ' ')}`,
                        message: status === 'completed' || status === 'refund_processed'
                            ? `Your return for order ${order.orderId} has been completed and refund of Rs.${returnData.refundAmount || 0} has been processed.`
                            : status === 'rejected'
                                ? `Your return request for order #${order.orderId} has been rejected. Reason: ${rejectionReason || 'No reason provided'}`
                                : `Your return request for order #${order.orderId} is now ${status.replace('_', ' ')}.`,
                        type: status === 'rejected' ? 'alert' : 'success',
                        category: 'Orders',
                        panel: 'customer',
                        customerId: returnData.customerId,
                        isGlobal: false,
                        actionLink: `/orders/${order._id}`,
                        actionLabel: 'View Order',
                        metadata: { orderId: order._id, returnId: returnData._id, status }
                    });
                }
            } catch (err) {
                console.error('Error creating notification:', err.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Return status updated successfully',
            return: returnData,
            orderStatus: order.status
        });
    } catch (error) {
        console.error('Error updating return:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get return stats
// @route   GET /api/returns/stats
// @access  Private (Admin/Shipper)
export const getReturnStats = async (req, res) => {
    try {
        // Get all returns counts
        const stats = {
            total: await Return.countDocuments({ isActive: true }),
            pending: await Return.countDocuments({ status: 'pending', isActive: true }),
            approved: await Return.countDocuments({ status: 'approved', isActive: true }),
            rejected: await Return.countDocuments({ status: 'rejected', isActive: true }),
            pickupScheduled: await Return.countDocuments({ status: 'pickup_scheduled', isActive: true }),
            pickedUp: await Return.countDocuments({ status: 'picked_up', isActive: true }),
            qualityInspection: await Return.countDocuments({ status: 'quality_inspection', isActive: true }),
            refundProcessed: await Return.countDocuments({ status: 'refund_processed', isActive: true }),
            completed: await Return.countDocuments({ status: 'completed', isActive: true })
        };

        // Get ALL returns that are refunded OR completed
        const allRefunded = await Return.find({
            status: { $in: ['refund_processed', 'completed'] },
            isActive: true
        }).populate('items.productId', 'price');

        // console.log('Found refunded/completed returns:', allRefunded.length);

        let totalRefund = 0;
        let refundedOrders = 0;

        // Calculate refund amount for each return
        for (const ret of allRefunded) {
            let refundAmount = ret.refundAmount || 0;
            
            // If refundAmount is 0, calculate from items
            if (refundAmount === 0 && ret.items && ret.items.length > 0) {
                refundAmount = ret.items.reduce((sum, item) => {
                    const price = item.price || item.productId?.price || 0;
                    const quantity = item.quantity || 1;
                    return sum + (price * quantity);
                }, 0);
                // console.log(`Calculated refund for ${ret._id}: Rs.${refundAmount}`);
            }
            
            // If still 0, check if there's any item price
            if (refundAmount === 0 && ret.items && ret.items.length > 0) {
                // Fallback: use first item's price
                const firstItem = ret.items[0];
                refundAmount = (firstItem.price || 0) * (firstItem.quantity || 1);
                // console.log(`Fallback refund for ${ret._id}: Rs.${refundAmount}`);
            }
            
            totalRefund += refundAmount;
            refundedOrders++;
        }

        // Also calculate for completed returns
        const completedReturns = await Return.find({
            status: 'completed',
            isActive: true
        });

        let completedRefund = 0;
        for (const ret of completedReturns) {
            let refundAmount = ret.refundAmount || 0;
            
            if (refundAmount === 0 && ret.items && ret.items.length > 0) {
                refundAmount = ret.items.reduce((sum, item) => {
                    const price = item.price || item.productId?.price || 0;
                    const quantity = item.quantity || 1;
                    return sum + (price * quantity);
                }, 0);
            }
            
            completedRefund += refundAmount;
        }

        // console.log('Return Stats Final:', {
        //     totalRefund,
        //     refundedOrders,
        //     completedRefund,
        //     allRefundedCount: allRefunded.length,
        //     completedReturnsCount: completedReturns.length
        // });

        res.status(200).json({
            success: true,
            stats: {
                ...stats,
                totalRefund: totalRefund,
                refundedOrders: refundedOrders,
                completedRefund: completedRefund,
                // Include individual return details for debugging
                _debug: allRefunded.map(r => ({
                    id: r._id,
                    status: r.status,
                    refundAmount: r.refundAmount,
                    calculatedRefund: r.items ? r.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) : 0
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching return stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get order by ID for return
// @route   GET /api/customer/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.productId', 'name price images');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
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