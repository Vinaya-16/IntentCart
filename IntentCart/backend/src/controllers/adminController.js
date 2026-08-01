import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalMerchants,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      pendingProducts,
      totalCategories
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'merchant' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Product.countDocuments({ status: 'pending' }),
      Category.countDocuments()
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'username email')
      .populate('merchantId', 'businessName');

    // Get pending merchant applications
    const pendingMerchants = await User.find({
      role: 'merchant',
      businessStatus: 'pending'
    }).select('username email businessName createdAt');

    // Get top selling products
    const topProducts = await Product.find()
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name price soldCount images');

    // Monthly revenue for chart
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          merchants: totalMerchants,
          pendingMerchants: pendingMerchants.length
        },
        products: {
          total: totalProducts,
          pending: pendingProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders
        },
        revenue: totalRevenue[0]?.total || 0,
        categories: totalCategories
      },
      recentOrders,
      pendingMerchants,
      topProducts,
      monthlyRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get merchant applications
// @route   GET /api/admin/merchants/pending
// @access  Private/Admin
export const getMerchantApplications = async (req, res) => {
  try {
    const merchants = await User.find({
      role: 'merchant',
      businessStatus: 'pending'
    }).select('-password');

    res.status(200).json({
      success: true,
      count: merchants.length,
      merchants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve merchant application
// @route   PUT /api/admin/merchants/:id/approve
// @access  Private/Admin
export const approveMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const merchant = await User.findById(id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    if (merchant.role !== 'merchant') {
      return res.status(400).json({
        success: false,
        message: 'User is not a merchant'
      });
    }

    merchant.businessStatus = status;
    merchant.isActive = status === 'approved';
    if (note) merchant.approvalNote = note;
    await merchant.save();

    // TODO: Send email notification to merchant

    res.status(200).json({
      success: true,
      message: `Merchant ${status} successfully`,
      merchant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block admin users'
      });
    }

    user.isActive = !block;
    await user.save();

    res.status(200).json({
      success: true,
      message: block ? 'User blocked successfully' : 'User unblocked successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all products with filters
// @route   GET /api/admin/products
// @access  Private/Admin
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, category } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (category) query.categoryId = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('merchantId', 'username businessName email')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve/Reject product
// @route   PUT /api/admin/products/:id/approve
// @access  Private/Admin
export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.status = status;
    product.approvalNote = note || null;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${status} successfully`,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'username email')
        .populate('merchantId', 'businessName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    order.history.push({
      status,
      note,
      updatedBy: req.user._id
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancellationReason = note;
    }

    await order.save();

    // TODO: Send notification to customer

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};