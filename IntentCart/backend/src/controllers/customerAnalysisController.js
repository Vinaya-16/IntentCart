import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get customer analysis data
// @route   GET /api/merchant/customers
// @access  Private (Merchant)
export const getCustomers = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { search, page = 1, limit = 20, segment } = req.query;

        // Get all customers who have placed orders with this merchant
        // First, find all orders for this merchant
        const orders = await Order.find({ merchantId })
            .populate('customerId', 'username name email createdAt')
            .lean();

        // Group orders by customer
        const customerMap = {};
        orders.forEach(order => {
            const customerId = order.customerId?._id?.toString();
            if (!customerId) return;

            if (!customerMap[customerId]) {
                customerMap[customerId] = {
                    customerId: customerId,
                    name: order.customerId?.name || order.customerId?.username || 'Unknown',
                    email: order.customerId?.email || 'No email',
                    joinedAt: order.customerId?.createdAt,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastPurchase: null,
                    orders: []
                };
            }

            customerMap[customerId].totalOrders += 1;
            customerMap[customerId].totalSpent += order.total || 0;
            if (!customerMap[customerId].lastPurchase || new Date(order.createdAt) > new Date(customerMap[customerId].lastPurchase)) {
                customerMap[customerId].lastPurchase = order.createdAt;
            }
            customerMap[customerId].orders.push(order);
        });

        // Convert to array and calculate segment
        let customers = Object.values(customerMap).map(c => {
            // Calculate customer segment based on total spent
            let segment = 'Bottom Tier';
            if (c.totalSpent > 50000) segment = 'Top Tier';
            else if (c.totalSpent > 20000) segment = 'Middle Tier';
            
            // Calculate average order value
            const avgOrderValue = c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0;

            return {
                id: c.customerId.substring(0, 8).toUpperCase(),
                customerId: c.customerId,
                name: c.name,
                email: c.email,
                totalOrders: c.totalOrders,
                lifetimeValue: c.totalSpent,
                avgOrderValue: avgOrderValue,
                lastPurchase: c.lastPurchase,
                segment: segment,
                joinedAt: c.joinedAt
            };
        });

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(searchLower) ||
                c.email.toLowerCase().includes(searchLower) ||
                c.id.toLowerCase().includes(searchLower)
            );
        }

        // Apply segment filter
        if (segment && segment !== 'all') {
            customers = customers.filter(c => c.segment === segment);
        }

        // Sort by total spent (highest first)
        customers.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

        // Pagination
        const total = customers.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedCustomers = customers.slice(skip, skip + parseInt(limit));

        // Calculate stats
        const totalCustomers = customers.length;
        const avgLifetimeValue = totalCustomers > 0 
            ? customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers 
            : 0;
        
        // New customers in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomers = customers.filter(c => 
            c.joinedAt && new Date(c.joinedAt) > thirtyDaysAgo
        ).length;

        // Segment breakdown
        const segmentBreakdown = {
            'Top Tier': customers.filter(c => c.segment === 'Top Tier').length,
            'Middle Tier': customers.filter(c => c.segment === 'Middle Tier').length,
            'Bottom Tier': customers.filter(c => c.segment === 'Bottom Tier').length
        };

        res.status(200).json({
            success: true,
            count: paginatedCustomers.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            customers: paginatedCustomers,
            stats: {
                totalCustomers,
                avgLifetimeValue,
                newCustomers,
                segmentBreakdown
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get customer details
// @route   GET /api/merchant/customers/:id
// @access  Private (Merchant)
export const getCustomerDetails = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { id } = req.params;

        // Find all orders for this customer and merchant
        const orders = await Order.find({ 
            merchantId,
            customerId: id 
        })
        .populate('items.productId', 'name price images')
        .sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found or no orders'
            });
        }

        const customer = await User.findById(id).select('-password');
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Calculate customer stats
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastPurchase = orders[0]?.createdAt || null;

        // Calculate segment
        let segment = 'Bottom Tier';
        if (totalSpent > 50000) segment = 'Top Tier';
        else if (totalSpent > 20000) segment = 'Middle Tier';

        res.status(200).json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name || customer.username,
                email: customer.email,
                phone: customer.phone,
                totalOrders,
                totalSpent,
                avgOrderValue,
                lastPurchase,
                segment,
                joinedAt: customer.createdAt,
                orders: orders.map(order => ({
                    orderId: order.orderId,
                    date: order.createdAt,
                    total: order.total,
                    status: order.status,
                    items: order.items,
                    paymentStatus: order.paymentStatus
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get customer stats/overview
// @route   GET /api/merchant/customers/stats
// @access  Private (Merchant)
export const getCustomerStats = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // Get all orders for this merchant
        const orders = await Order.find({ merchantId })
            .populate('customerId', 'username name email createdAt')
            .lean();

        // Group by customer
        const customerMap = {};
        orders.forEach(order => {
            const customerId = order.customerId?._id?.toString();
            if (!customerId) return;

            if (!customerMap[customerId]) {
                customerMap[customerId] = {
                    customerId: customerId,
                    totalOrders: 0,
                    totalSpent: 0,
                    joinedAt: order.customerId?.createdAt
                };
            }

            customerMap[customerId].totalOrders += 1;
            customerMap[customerId].totalSpent += order.total || 0;
        });

        const customers = Object.values(customerMap);
        const totalCustomers = customers.length;
        const avgLifetimeValue = totalCustomers > 0 
            ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers 
            : 0;

        // New customers in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomers = customers.filter(c => 
            c.joinedAt && new Date(c.joinedAt) > thirtyDaysAgo
        ).length;

        // Segment breakdown
        const segmentBreakdown = {
            'Top Tier': 0,
            'Middle Tier': 0,
            'Bottom Tier': 0
        };

        customers.forEach(c => {
            let segment = 'Bottom Tier';
            if (c.totalSpent > 50000) segment = 'Top Tier';
            else if (c.totalSpent > 20000) segment = 'Middle Tier';
            segmentBreakdown[segment]++;
        });

        res.status(200).json({
            success: true,
            stats: {
                totalCustomers,
                avgLifetimeValue,
                newCustomers,
                segmentBreakdown
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};