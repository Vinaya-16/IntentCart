import User from '../models/User.js';
import Notification from '../models/Notifications.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Event from '../models/Event.js';

// ==================== HELPER: Create Admin Notification ====================

const createAdminNotification = async (title, message, type, category, metadata = {}) => {
  try {
    await Notification.create({
      title,
      message,
      type: type || 'info',
      category: category || 'General',
      panel: 'admin',
      isGlobal: true,
      metadata
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users with filtering and pagination
// @route   GET /api/auth/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, isApproved, search, page = 1, limit = 10 } = req.query;
    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by approval status (for shippers and merchants)
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    // Search by username, email, or role-specific fields
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'shipperDetails.branch': { $regex: search, $options: 'i' } },
        { 'shipperDetails.vehicleNumber': { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    // Add additional info for shippers
    const usersWithDetails = users.map(user => {
      const userObj = user.toJSON();

      // Add shipper-specific stats if role is shipper
      if (user.role === 'shipper' && user.shipperDetails) {
        userObj.shipperStats = {
          totalDeliveries: user.shipperDetails.totalDeliveries || 0,
          successfulDeliveries: user.shipperDetails.successfulDeliveries || 0,
          failedDeliveries: user.shipperDetails.failedDeliveries || 0,
          rating: user.shipperDetails.rating || 0,
          currentStatus: user.shipperDetails.currentStatus || 'offline'
        };
      }

      return userObj;
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users: usersWithDetails
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user by ID with role-specific details
// @route   GET /api/auth/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('shipperDetails.assignedOrders', 'orderNumber status totalAmount shippingAddress customerName createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare response based on role
    const userObj = user.toJSON();

    // Add role-specific information
    if (user.role === 'shipper' && user.shipperDetails) {
      userObj.shipperStats = {
        totalDeliveries: user.shipperDetails.totalDeliveries || 0,
        successfulDeliveries: user.shipperDetails.successfulDeliveries || 0,
        failedDeliveries: user.shipperDetails.failedDeliveries || 0,
        successRate: user.shipperDetails.totalDeliveries > 0
          ? ((user.shipperDetails.successfulDeliveries / user.shipperDetails.totalDeliveries) * 100).toFixed(2)
          : 0,
        rating: user.shipperDetails.rating || 0,
        currentStatus: user.shipperDetails.currentStatus || 'offline',
        assignedOrdersCount: user.shipperDetails.assignedOrders?.length || 0,
        lastLocation: user.shipperDetails.lastLocation
      };

      // Add performance metrics if they exist
      if (user.performanceMetrics) {
        userObj.performanceMetrics = user.performanceMetrics;
      }
    }

    if (user.role === 'merchant') {
      userObj.merchantInfo = {
        businessName: user.businessName,
        businessDescription: user.businessDescription,
        businessAddress: user.businessAddress,
        businessPhone: user.businessPhone,
        merchantStatus: user.merchantStatus || 'pending'
      };
    }

    if (user.role === 'customer') {
      userObj.customerInfo = {
        tier: user.tier || 'Platinum Member',
        rewardPoints: user.rewardPoints || 0,
        totalOrders: user.totalOrders || 0,
        wishlistCount: user.wishlistCount || 0
      };
    }

    res.status(200).json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user with cleanup
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    // Store user info for notification before deletion
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      shipperDetails: user.shipperDetails,
      businessName: user.businessName
    };

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    // Create admin notification (if you have this function)
    if (typeof createAdminNotification === 'function') {
      await createAdminNotification(
        `User Deleted: ${userInfo.username}`,
        `User ${userInfo.username} (${userInfo.email}) with role '${userInfo.role}' was deleted from the system.`,
        'alert',
        'System',
        { userId: userInfo.id, email: userInfo.email }
      );
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent blocking super admin
    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Cannot block super admin account'
      });
    }

    // If blocking a shipper, also set isApproved to false
    if (user.role === 'shipper' && isActive === false) {
      user.isApproved = false;
    }

    // If unblocking a shipper, set isApproved to true and ensure shipperDetails exist
    if (user.role === 'shipper' && isActive === true) {
      user.isApproved = true;

      // Ensure shipperDetails exist
      if (!user.shipperDetails || Object.keys(user.shipperDetails).length === 0) {
        user.shipperDetails = {
          branch: "Not Assigned",
          assignedRegion: "Not Assigned",
          vehicleNumber: "Not Assigned",
          licenseNumber: "Not Assigned",
          experience: 0,
          currentStatus: "available",
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          rating: 0,
          lastLocation: {
            type: "Point",
            coordinates: [0, 0],
            updatedAt: new Date()
          },
          assignedOrders: []
        };
      }

      if (!user.performanceMetrics || Object.keys(user.performanceMetrics).length === 0) {
        user.performanceMetrics = {
          onTimeDelivery: 0,
          averageDeliveryTime: 0,
          customerRating: 0,
          totalEarnings: 0,
          weeklyEarnings: 0
        };
      }
    }

    user.isActive = isActive;
    user.blockedAt = isActive ? null : new Date();
    user.blockReason = isActive ? null : (reason || 'No reason provided');

    await user.save();

    // Create notification
    if (!isActive) {
      await createAdminNotification(
        `User Blocked: ${user.username}`,
        `User ${user.username} (${user.email}) has been blocked. Reason: ${reason || 'No reason provided'}`,
        'alert',
        'Alerts',
        { userId: user._id, email: user.email, reason }
      );
    } else {
      await createAdminNotification(
        `User Unblocked: ${user.username}`,
        `User ${user.username} (${user.email}) has been unblocked.`,
        'success',
        'Updates',
        { userId: user._id, email: user.email }
      );
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'unblocked' : 'blocked'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved,
        shipperDetails: user.shipperDetails
      }
    });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== SHIPPER MANAGEMENT ====================

// @desc    Approve/Reject shipper (Admin only)
// @route   PUT /api/auth/users/:id/approve-shipper
// @access  Private (Admin only)
export const approveShipper = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, reason } = req.body;

    if (isApproved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isApproved status is required'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a shipper
    if (user.role !== 'shipper') {
      return res.status(400).json({
        success: false,
        message: 'User is not a shipper'
      });
    }

    // Update shipper approval status
    user.isApproved = isApproved;

    // If approving, make sure shipper details exist
    if (isApproved === true) {
      // If shipperDetails is missing, add default values
      if (!user.shipperDetails || Object.keys(user.shipperDetails).length === 0) {
        user.shipperDetails = {
          branch: "Not Assigned",
          assignedRegion: "Not Assigned",
          vehicleNumber: "Not Assigned",
          licenseNumber: "Not Assigned",
          experience: 0,
          currentStatus: "available",
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          rating: 0,
          lastLocation: {
            type: "Point",
            coordinates: [0, 0],
            updatedAt: new Date()
          },
          assignedOrders: []
        };
      }

      // Add performance metrics if missing
      if (!user.performanceMetrics || Object.keys(user.performanceMetrics).length === 0) {
        user.performanceMetrics = {
          onTimeDelivery: 0,
          averageDeliveryTime: 0,
          customerRating: 0,
          totalEarnings: 0,
          weeklyEarnings: 0
        };
      }

      // Also ensure the user is active
      if (!user.isActive) {
        user.isActive = true;
      }
    }

    // Save the updated user
    await user.save();

    // Create notification
    await createAdminNotification(
      `Shipper ${isApproved ? 'Approved' : 'Rejected'}: ${user.username}`,
      `Shipper ${user.username} (${user.email}) has been ${isApproved ? 'approved' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
      isApproved ? 'success' : 'alert',
      'Shipper Management',
      {
        shipperId: user._id,
        email: user.email,
        username: user.username,
        isApproved,
        reason: reason || 'No reason provided'
      }
    );

    res.status(200).json({
      success: true,
      message: `Shipper ${isApproved ? 'approved' : 'rejected'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isActive: user.isActive,
        shipperDetails: user.shipperDetails,
        performanceMetrics: user.performanceMetrics
      }
    });
  } catch (error) {
    console.error('Error approving shipper:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all shippers with filtering (Admin only)
// @route   GET /api/auth/users/shippers
// @access  Private (Admin only)
export const getShippers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = { role: 'shipper' };

    // Filter by approval status
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    // Search by username, email, or shipper details
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'shipperDetails.branch': { $regex: search, $options: 'i' } },
        { 'shipperDetails.vehicleNumber': { $regex: search, $options: 'i' } },
        { 'shipperDetails.assignedRegion': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [shippers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    // Add shipper stats
    const shippersWithStats = shippers.map(shipper => {
      const shipperObj = shipper.toJSON();
      shipperObj.shipperStats = {
        totalDeliveries: shipper.shipperDetails?.totalDeliveries || 0,
        successfulDeliveries: shipper.shipperDetails?.successfulDeliveries || 0,
        failedDeliveries: shipper.shipperDetails?.failedDeliveries || 0,
        rating: shipper.shipperDetails?.rating || 0,
        currentStatus: shipper.shipperDetails?.currentStatus || 'offline',
        assignedOrders: shipper.shipperDetails?.assignedOrders?.length || 0
      };
      return shipperObj;
    });

    res.status(200).json({
      success: true,
      count: shippers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      shippers: shippersWithStats
    });
  } catch (error) {
    console.error('Error fetching shippers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get shipper statistics (Admin only)
// @route   GET /api/auth/users/shippers/stats
// @access  Private (Admin only)
export const getShipperStats = async (req, res) => {
  try {
    const totalShippers = await User.countDocuments({ role: 'shipper' });
    const pendingShippers = await User.countDocuments({
      role: 'shipper',
      isApproved: false
    });
    const approvedShippers = await User.countDocuments({
      role: 'shipper',
      isApproved: true
    });
    const activeShippers = await User.countDocuments({
      role: 'shipper',
      isActive: true
    });
    const availableShippers = await User.countDocuments({
      role: 'shipper',
      'shipperDetails.currentStatus': 'available',
      isActive: true,
      isApproved: true
    });
    const busyShippers = await User.countDocuments({
      role: 'shipper',
      'shipperDetails.currentStatus': 'busy',
      isActive: true,
      isApproved: true
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalShippers,
        pending: pendingShippers,
        approved: approvedShippers,
        active: activeShippers,
        available: availableShippers,
        busy: busyShippers,
        offline: totalShippers - (availableShippers + busyShippers)
      }
    });
  } catch (error) {
    console.error('Error fetching shipper stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update shipper details (Admin only)
// @route   PUT /api/auth/users/:id/shipper-details
// @access  Private (Admin only)
export const updateShipperDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch,
      assignedRegion,
      vehicleNumber,
      licenseNumber,
      experience,
      currentStatus
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'shipper') {
      return res.status(400).json({
        success: false,
        message: 'User is not a shipper'
      });
    }

    // Initialize shipperDetails if it doesn't exist
    if (!user.shipperDetails) {
      user.shipperDetails = {};
    }

    // Update fields
    if (branch) user.shipperDetails.branch = branch;
    if (assignedRegion) user.shipperDetails.assignedRegion = assignedRegion;
    if (vehicleNumber) user.shipperDetails.vehicleNumber = vehicleNumber;
    if (licenseNumber) user.shipperDetails.licenseNumber = licenseNumber;
    if (experience !== undefined) user.shipperDetails.experience = parseInt(experience);
    if (currentStatus) {
      const validStatuses = ['available', 'busy', 'offline', 'on_break'];
      if (!validStatuses.includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Valid: available, busy, offline, on_break'
        });
      }
      user.shipperDetails.currentStatus = currentStatus;
    }

    await user.save();

    await createAdminNotification(
      `Shipper Updated: ${user.username}`,
      `Shipper ${user.username}'s details were updated by admin.`,
      'info',
      'Shipper Management',
      { shipperId: user._id, email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'Shipper details updated successfully',
      shipperDetails: user.shipperDetails
    });
  } catch (error) {
    console.error('Error updating shipper details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== MERCHANT MANAGEMENT ====================

export const getPendingMerchants = async (req, res) => {
  try {
    const merchants = await User.find({
      role: 'merchant',
      merchantStatus: 'pending'
    }).select('-password');

    res.status(200).json({
      success: true,
      count: merchants.length,
      merchants
    });
  } catch (error) {
    console.error('Error fetching pending merchants:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const approveMerchant = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      console.log('Merchant not found');
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    if (existingUser.role !== 'merchant') {
      console.log('User is not a merchant. Role:', existingUser.role);
      return res.status(400).json({
        success: false,
        message: 'User is not a merchant'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        merchantStatus: 'approved',
        isApproved: true,
        approvedAt: new Date()
      },
      { new: true }
    ).select('-password');

    await createAdminNotification(
      `Merchant Approved: ${user.businessName || user.username}`,
      `Merchant ${user.businessName || user.username} (${user.email}) has been approved and can now sell products.`,
      'success',
      'Updates',
      { merchantId: user._id, email: user.email, businessName: user.businessName }
    );

    res.status(200).json({
      success: true,
      message: 'Merchant approved successfully',
      user
    });
  } catch (error) {
    console.error('Error approving merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const rejectMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      console.log('Merchant not found');
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    if (existingUser.role !== 'merchant') {
      console.log('User is not a merchant. Role:', existingUser.role);
      return res.status(400).json({
        success: false,
        message: 'User is not a merchant'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        merchantStatus: 'rejected',
        isApproved: false,
        rejectedAt: new Date(),
        rejectionReason: reason || 'No reason provided'
      },
      { new: true }
    ).select('-password');

    await createAdminNotification(
      `Merchant Rejected: ${user.businessName || user.username}`,
      `Merchant ${user.businessName || user.username} (${user.email}) has been rejected. Reason: ${reason || 'No reason provided'}`,
      'alert',
      'Alerts',
      { merchantId: user._id, email: user.email, reason }
    );

    res.status(200).json({
      success: true,
      message: 'Merchant rejected',
      user
    });
  } catch (error) {
    console.error('Error rejecting merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const resetMerchantStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      console.log('Merchant not found');
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    if (existingUser.role !== 'merchant') {
      console.log('User is not a merchant. Role:', existingUser.role);
      return res.status(400).json({
        success: false,
        message: 'User is not a merchant'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        merchantStatus: 'pending',
        isApproved: false,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null
      },
      { new: true }
    ).select('-password');

    await createAdminNotification(
      `Merchant Reset: ${user.businessName || user.username}`,
      `Merchant ${user.businessName || user.username} (${user.email}) has been reset to pending status for re-review.`,
      'info',
      'Updates',
      { merchantId: user._id, email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'Merchant reset to pending successfully',
      user
    });
  } catch (error) {
    console.error('Error resetting merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== SYSTEM STATISTICS ====================

export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'pending' });
    const approvedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'approved' });
    const rejectedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'rejected' });
    const blockedUsers = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalMerchants,
        totalCustomers,
        pendingMerchants,
        approvedMerchants,
        rejectedMerchants,
        blockedUsers,
        activeUsers: totalUsers - blockedUsers
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ADMIN PROFILE MANAGEMENT ====================

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    //  Calculate REAL Revenue and Orders from the Order collection
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] }
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

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalOrders = revenueStats[0]?.totalOrders || 0;
    const avgRevenueSize = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const profileData = {
      id: admin._id,
      firstName: admin.firstName || admin.username || 'Admin',
      lastName: admin.lastName || '',
      email: admin.email,
      address: admin.address || '',
      city: admin.city || '',
      stateZip: admin.stateZip || '',
      country: admin.country || '',
      mobile: admin.mobile || '',
      phone: admin.phone || '',
      dob: admin.dob || '',
      gender: admin.gender || '',
      created: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      account: admin.role || 'Admin',
      totalRevenue: `Rs.${totalRevenue.toLocaleString()}`,
      avgRevenueSize: `Rs.${avgRevenueSize.toLocaleString()}`,
      avatarUrl: admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      username: admin.username,
      role: admin.role,
      totalMerchants,
      totalCustomers
    };

    res.status(200).json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      address,
      city,
      stateZip,
      country,
      mobile,
      phone,
      dob,
      gender,
      avatarUrl
    } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (address) updates.address = address;
    if (city) updates.city = city;
    if (stateZip) updates.stateZip = stateZip;
    if (country) updates.country = country;
    if (mobile) updates.mobile = mobile;
    if (phone) updates.phone = phone;
    if (dob) updates.dob = dob;
    if (gender) updates.gender = gender;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    const admin = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await createAdminNotification(
      'Profile Updated',
      `Admin profile was updated successfully.`,
      'success',
      'Updates'
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: admin._id,
        firstName: admin.firstName || admin.username,
        lastName: admin.lastName || '',
        email: admin.email,
        address: admin.address || '',
        city: admin.city || '',
        stateZip: admin.stateZip || '',
        country: admin.country || '',
        mobile: admin.mobile || '',
        phone: admin.phone || '',
        dob: admin.dob || '',
        gender: admin.gender || '',
        created: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '',
        account: admin.role || 'Admin',
        avatarUrl: admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all password fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const admin = await User.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    admin.password = newPassword;
    await admin.save();

    await createAdminNotification(
      'Password Changed',
      `Admin password was changed successfully.`,
      'success',
      'System'
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateAdminAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    const admin = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      avatarUrl: admin.avatarUrl
    });
  } catch (error) {
    console.error('Error updating admin avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== DASHBOARD STATISTICS ====================

export const getDashboardStats = async (req, res) => {
  try {
    // User Counts
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'pending' });
    const approvedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'approved' });
    const rejectedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'rejected' });
    const blockedUsers = await User.countDocuments({ isActive: false });
    const activeUsers = totalUsers - blockedUsers;

    // Months for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();

    // 1. Total Products
    const totalProducts = await Product.countDocuments();

    // 2. Total Orders & Total Revenue
    const orderAggregation = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const totalOrders = orderAggregation[0]?.totalOrders || 0;
    const totalRevenue = orderAggregation[0]?.totalRevenue || 0;

    // 3. Monthly Revenue Chart (Last 6 months)
    const monthlyRevenue = [];
    const userGrowth = [];
    const merchantGrowth = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), currentMonth - i, 1);
      const nextMonth = new Date(now.getFullYear(), currentMonth - i + 1, 1);

      // Users registered in this month
      const userCount = await User.countDocuments({
        createdAt: { $gte: month, $lt: nextMonth }
      });
      userGrowth.push(userCount);

      // Merchants registered in this month
      const merchantCount = await User.countDocuments({
        role: 'merchant',
        createdAt: { $gte: month, $lt: nextMonth }
      });
      merchantGrowth.push(merchantCount);

      // Revenue generated in this month
      const revenueAgg = await Order.aggregate([
        {
          $match: {
            status: { $in: ['completed', 'delivered'] },
            createdAt: { $gte: month, $lt: nextMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);
      monthlyRevenue.push(revenueAgg[0]?.total || 0);
    }

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          admins: totalAdmins,
          merchants: totalMerchants,
          customers: totalCustomers
        },
        merchants: {
          total: totalMerchants,
          pending: pendingMerchants,
          approved: approvedMerchants,
          rejected: rejectedMerchants
        },
        revenue: {
          total: totalRevenue,
          totalOrders: totalOrders,
          totalProducts: totalProducts
        },
        charts: {
          months: months.slice(currentMonth - 5, currentMonth + 1),
          userGrowth: userGrowth,
          merchantGrowth: merchantGrowth,
          monthlyRevenue: monthlyRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ADMIN NOTIFICATIONS ====================

export const getAdminNotifications = async (req, res) => {
  try {
    const { limit = 50, page = 1, read } = req.query;

    let query = {
      panel: 'admin'
    };

    if (read !== undefined) {
      query.read = read === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      panel: 'admin',
      read: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const createAdminNotificationManual = async (req, res) => {
  try {
    const { title, message, type, category, actionLink, actionLabel, metadata } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      category: category || 'General',
      panel: 'admin',
      isGlobal: true,
      actionLink,
      actionLabel,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Admin notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, panel: 'admin' },
      {
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Admin notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { panel: 'admin', read: false },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All admin notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      panel: 'admin'
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Admin notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      panel: 'admin',
      read: false
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error getting admin unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== HELPER: Notification Triggers ====================

const triggerProductApprovedNotification = async (merchantId, productName, productId) => {
  try {
    await Notification.create({
      title: 'Product Approved!',
      message: `Your product "${productName}" has been approved and is now live in the marketplace.`,
      type: 'success',
      category: 'Products',
      panel: 'merchant',
      merchantId: merchantId,
      isGlobal: false,
      actionLink: `/merchant/products/${productId}`,
      actionLabel: 'View Product',
      metadata: { productId, productName }
    });
  } catch (error) {
    console.error('Error creating product approval notification:', error);
  }
};

const triggerProductRejectedNotification = async (merchantId, productName, productId, reason) => {
  try {
    await Notification.create({
      title: 'Product Rejected',
      message: `Your product "${productName}" was rejected. Reason: ${reason || 'No reason provided'}`,
      type: 'alert',
      category: 'Products',
      panel: 'merchant',
      merchantId: merchantId,
      isGlobal: false,
      actionLink: `/merchant/products/${productId}`,
      actionLabel: 'View Details',
      metadata: { productId, productName, reason }
    });
  } catch (error) {
    console.error('Error creating product rejection notification:', error);
  }
};

const triggerAdminNewProductNotification = async (productName, merchantName) => {
  try {
    await Notification.create({
      title: 'New Product Pending Approval',
      message: `Product "${productName}" from ${merchantName} is pending approval.`,
      type: 'info',
      category: 'Products',
      panel: 'admin',
      isGlobal: true,
      metadata: { productName, merchantName }
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

// ==================== PRODUCT MODERATION ====================

export const getAdminProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    let query = {};

    if (status) {
      if (status === 'pending') {
        query.approvalStatus = 'pending';
      } else if (status === 'approved') {
        query.approvalStatus = 'approved';
      } else if (status === 'rejected') {
        query.approvalStatus = 'rejected';
      }
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('merchantId', 'username businessName email')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('microCategoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const pendingCount = await Product.countDocuments({ approvalStatus: 'pending' });
    const approvedCount = await Product.countDocuments({ approvalStatus: 'approved' });
    const rejectedCount = await Product.countDocuments({ approvalStatus: 'rejected' });

    const formattedProducts = products.map(product => ({
      id: product._id,
      productId: product._id.toString().slice(-6).toUpperCase(),
      name: product.name,
      image: product.images && product.images.length > 0
        ? product.images.find(img => img.isPrimary)?.url || product.images[0]?.url
        : null,
      merchant: product.merchantId?.businessName || product.merchantId?.username || 'Unknown',
      merchantId: product.merchantId?._id,
      date: new Date(product.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }),
      status: product.approvalStatus || 'pending',
      category: product.categoryId?.name || 'Uncategorized',
      price: product.price,
      stock: product.stock,
      approvalReason: product.approvalReason || ''
    }));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      products: formattedProducts
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('merchantId', 'username businessName email phone businessAddress')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('microCategoryId', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const product = await Product.findById(id).populate('merchantId', 'username businessName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.approvalStatus = 'approved';
    product.status = 'active';
    product.approvalReason = notes || '';
    await product.save();

    await triggerProductApprovedNotification(
      product.merchantId._id,
      product.name,
      product._id
    );

    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      product
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const product = await Product.findById(id).populate('merchantId', 'username businessName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.approvalStatus = 'rejected';
    product.status = 'inactive';
    product.approvalReason = reason;
    await product.save();

    await triggerProductRejectedNotification(
      product.merchantId._id,
      product.name,
      product._id,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Product rejected successfully',
      product
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const pendingProducts = await Product.countDocuments({ approvalStatus: 'pending' });
    const approvedProducts = await Product.countDocuments({ approvalStatus: 'approved' });
    const rejectedProducts = await Product.countDocuments({ approvalStatus: 'rejected' });
    const activeProducts = await Product.countDocuments({ status: 'active', approvalStatus: 'approved' });
    const outOfStock = await Product.countDocuments({ stock: 0, status: 'active' });

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ['$category.name', 0] },
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalProducts,
        pending: pendingProducts,
        approved: approvedProducts,
        rejected: rejectedProducts,
        active: activeProducts,
        outOfStock: outOfStock,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const bulkApproveProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    const products = await Product.find({ _id: { $in: productIds } }).populate('merchantId', 'username email');

    let updatedCount = 0;
    for (const product of products) {
      product.approvalStatus = 'approved';
      product.status = 'active';
      await product.save();
      updatedCount++;

      await triggerProductApprovedNotification(
        product.merchantId._id,
        product.name,
        product._id
      );
    }

    res.status(200).json({
      success: true,
      message: `${updatedCount} products approved successfully`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error bulk approving products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const bulkRejectProducts = async (req, res) => {
  try {
    const { productIds, reason } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const products = await Product.find({ _id: { $in: productIds } }).populate('merchantId', 'username email');

    let updatedCount = 0;
    for (const product of products) {
      product.approvalStatus = 'rejected';
      product.status = 'inactive';
      product.approvalReason = reason;
      await product.save();
      updatedCount++;

      await triggerProductRejectedNotification(
        product.merchantId._id,
        product.name,
        product._id,
        reason
      );
    }

    res.status(200).json({
      success: true,
      message: `${updatedCount} products rejected successfully`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error bulk rejecting products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const resetProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.approvalStatus = 'pending';
    product.status = 'draft';
    product.approvalReason = '';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product reset to pending successfully',
      product
    });
  } catch (error) {
    console.error('Error resetting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== RISK MANAGEMENT ====================

// Get all merchants with risk scores
export const getRiskMerchants = async (req, res) => {
  try {
    const { search, riskLevel, page = 1, limit = 20 } = req.query;

    // console.log('=== getRiskMerchants called ===');
    // console.log('Query params:', { search, riskLevel, page, limit });

    let query = { role: 'merchant' };

    // Filter by risk level
    if (riskLevel && riskLevel !== 'all') {
      query.riskScore = riskLevel;
    }

    // Search functionality
    if (search && search.trim() !== '') {
      query.$or = [
        { businessName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { username: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // console.log('MongoDB Query:', JSON.stringify(query));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await User.countDocuments(query);
    // console.log('Total merchants:', total);

    // Fetch merchants
    const merchants = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // console.log('Merchants fetched:', merchants.length);

    // Get order stats for each merchant
    const merchantsWithStats = await Promise.all(merchants.map(async (merchant) => {
      // Get order count
      const orderCount = await Order.countDocuments({ merchantId: merchant._id });

      // Get total revenue
      const revenue = await Order.aggregate([
        {
          $match: {
            merchantId: merchant._id,
            status: { $in: ['completed', 'delivered', 'processing'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);

      // Get disputes count
      const disputes = await Order.countDocuments({
        merchantId: merchant._id,
        status: { $in: ['cancelled', 'refunded', 'disputed'] }
      });

      // If no risk score, calculate one
      let riskScore = merchant.riskScore || 'unassessed';
      let riskPercentage = merchant.riskPercentage || 0;

      // Auto-calculate risk if not set and merchant has orders
      if (!merchant.riskScore && orderCount > 0) {
        const disputeRate = orderCount > 0 ? (disputes / orderCount) * 100 : 0;

        if (disputeRate > 20) {
          riskScore = 'high';
          riskPercentage = 75 + Math.floor(Math.random() * 20);
        } else if (disputeRate > 10) {
          riskScore = 'medium';
          riskPercentage = 40 + Math.floor(Math.random() * 30);
        } else if (orderCount > 50) {
          riskScore = 'medium';
          riskPercentage = 30 + Math.floor(Math.random() * 20);
        } else {
          riskScore = 'low';
          riskPercentage = 5 + Math.floor(Math.random() * 20);
        }

        // Update merchant with calculated risk
        await User.findByIdAndUpdate(merchant._id, {
          riskScore: riskScore,
          riskPercentage: riskPercentage
        });
      }

      return {
        id: merchant._id,
        businessName: merchant.businessName || merchant.username || 'Unknown Merchant',
        email: merchant.email || 'No email',
        riskScore: riskScore,
        riskPercentage: riskPercentage,
        orders: orderCount || 0,
        revenue: revenue[0]?.total || 0,
        disputes: disputes || 0,
        status: merchant.merchantStatus || 'pending',
        joined: merchant.createdAt
      };
    }));

    res.status(200).json({
      success: true,
      merchants: merchantsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching risk merchants:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get risk statistics
export const getRiskStats = async (req, res) => {
  try {
    // console.log('=== getRiskStats called ===');

    // Get all merchants
    const merchants = await User.find({ role: 'merchant' });
    // console.log('Total merchants for stats:', merchants.length);

    // Calculate statistics with fallbacks
    const stats = {
      total: merchants.length || 0,
      low: merchants.filter(m => m.riskScore === 'low').length || 0,
      medium: merchants.filter(m => m.riskScore === 'medium').length || 0,
      high: merchants.filter(m => m.riskScore === 'high').length || 0,
      unassessed: merchants.filter(m => !m.riskScore || m.riskScore === 'unassessed').length || 0,
      active: merchants.filter(m => m.merchantStatus === 'active' || m.merchantStatus === 'approved').length || 0,
      pending: merchants.filter(m => m.merchantStatus === 'pending').length || 0,
      suspended: merchants.filter(m => m.merchantStatus === 'suspended' || m.merchantStatus === 'rejected').length || 0,
    };

    // console.log('Stats calculated:', stats);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching risk stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update merchant status
export const updateMerchantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // console.log('=== updateMerchantStatus ===');
    // console.log('Merchant ID:', id);
    // console.log('Status:', status);
    // console.log('Reason:', reason);

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, pending, or suspended'
      });
    }

    const merchant = await User.findById(id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Update merchant status
    const updatedMerchant = await User.findByIdAndUpdate(
      id,
      {
        merchantStatus: status,
        ...(status === 'suspended' && {
          suspensionReason: reason || 'No reason provided',
          suspendedAt: new Date()
        }),
        ...(status === 'active' && {
          suspensionReason: null,
          suspendedAt: null
        })
      },
      { new: true }
    ).select('-password');

    // console.log('Updated merchant:', updatedMerchant);

    // Create notification if function exists
    if (typeof createAdminNotification === 'function') {
      await createAdminNotification(
        `Merchant ${status === 'active' ? 'Activated' : status === 'suspended' ? 'Suspended' : 'Status Updated'}`,
        `Merchant ${merchant.businessName || merchant.username} (${merchant.email}) has been ${status}`,
        status === 'suspended' ? 'alert' : 'success',
        'Merchant Management',
        {
          merchantId: merchant._id,
          email: merchant.email,
          status: status,
          reason: reason || 'No reason provided'
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `Merchant status updated to ${status}`,
      merchant: updatedMerchant
    });
  } catch (error) {
    console.error('Error updating merchant status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

//  * @route PUT /api/admin/merchants/:id/recalculate-risk
//  * @access Private/Admin
export const recalculateMerchantRisk = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate admin authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
    }

    const adminId = req.user._id;

    // 2. Validate merchant exists
    const merchant = await User.findById(id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Verify the user is actually a merchant
    if (merchant.role !== 'merchant') {
      return res.status(400).json({
        success: false,
        message: 'User is not a merchant'
      });
    }

    // 3. Get order statistics
    const orderCount = await Order.countDocuments({ merchantId: merchant._id });

    // Only calculate risk if merchant has orders
    if (orderCount === 0) {
      // Merchant has no orders - set to low risk
      await User.findByIdAndUpdate(id, {
        riskScore: 'low',
        riskPercentage: 0,
        riskFactors: {
          order_volume: { points: 0, level: 'low', value: 0 },
          disputes: { points: 0, level: 'low', value: 0 },
          account_age: { points: 0, level: 'low', value: 0 }
        },
        riskAssessedAt: new Date(),
        riskAssessedBy: adminId
      });

      return res.status(200).json({
        success: true,
        message: 'Merchant has no orders. Risk set to low.',
        merchant: {
          id: merchant._id,
          businessName: merchant.businessName || merchant.username,
          riskScore: 'low',
          riskPercentage: 0,
          orderCount: 0
        }
      });
    }

    // Get dispute/refund orders
    const disputes = await Order.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['cancelled', 'refunded', 'disputed'] }
    });

    // Get completed/delivered orders for revenue
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          merchantId: merchant._id,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const completedOrders = revenueAgg[0]?.orderCount || 0;

    // 4. Calculate risk factors
    const disputeRate = orderCount > 0 ? (disputes / orderCount) * 100 : 0;
    const ageInDays = Math.floor((new Date() - merchant.createdAt) / (1000 * 60 * 60 * 24));

    // Average order value
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // 5. Define helper function for risk levels
    const getLevel = (points) => {
      if (points > 20) return 'high';
      if (points > 10) return 'medium';
      return 'low';
    };

    // 6. Score each factor
    // a) Order Volume Score (max 25 points)
    let volumePoints = 0;
    if (orderCount > 100) volumePoints = 25;
    else if (orderCount > 50) volumePoints = 15;
    else if (orderCount > 20) volumePoints = 8;
    else if (orderCount > 10) volumePoints = 4;
    else volumePoints = 2;

    // b) Dispute Rate Score (max 30 points - most important)
    let disputePoints = 0;
    if (disputeRate > 30) disputePoints = 30;
    else if (disputeRate > 20) disputePoints = 25;
    else if (disputeRate > 10) disputePoints = 18;
    else if (disputeRate > 5) disputePoints = 10;
    else if (disputeRate > 2) disputePoints = 5;
    else disputePoints = 0;

    // c) Account Age Score (max 15 points)
    let agePoints = 0;
    if (ageInDays < 30) agePoints = 15;
    else if (ageInDays < 60) agePoints = 12;
    else if (ageInDays < 90) agePoints = 10;
    else if (ageInDays < 180) agePoints = 5;
    else agePoints = 0;

    // d) Revenue/Order Value Score (max 10 points)
    let revenuePoints = 0;
    if (avgOrderValue > 10000) revenuePoints = 10; // High value orders = more risk
    else if (avgOrderValue > 5000) revenuePoints = 7;
    else if (avgOrderValue > 1000) revenuePoints = 4;
    else revenuePoints = 0;

    // 7. Calculate final score
    const totalPoints = volumePoints + disputePoints + agePoints + revenuePoints;
    const maxPoints = 80; // 25 + 30 + 15 + 10
    const riskPercentage = Math.min(Math.round((totalPoints / maxPoints) * 100), 100);

    // 8. Determine risk level 
    let riskScore;
    if (riskPercentage < 25) riskScore = 'low';
    else if (riskPercentage < 50) riskScore = 'medium';
    else riskScore = 'high';

    // 9. Add risk assessment notes
    const riskNotes = [];
    if (disputeRate > 20) riskNotes.push('High dispute rate (>20%)');
    if (orderCount < 10 && ageInDays < 30) riskNotes.push('New merchant with low order volume');
    if (avgOrderValue > 10000) riskNotes.push('High average order value');
    if (disputeRate > 10) riskNotes.push('Moderate dispute rate');

    // 10. Save updated risk assessment
    const updatedMerchant = await User.findByIdAndUpdate(
      id,
      {
        riskScore: riskScore,
        riskPercentage: riskPercentage,
        riskFactors: {
          order_volume: {
            points: volumePoints,
            level: getLevel(volumePoints),
            value: orderCount,
            completed_orders: completedOrders,
            total_revenue: totalRevenue
          },
          disputes: {
            points: disputePoints,
            level: getLevel(disputePoints),
            value: Math.round(disputeRate * 100) / 100,
            dispute_count: disputes
          },
          account_age: {
            points: agePoints,
            level: getLevel(agePoints),
            value: ageInDays,
            created_at: merchant.createdAt
          },
          revenue_metrics: {
            points: revenuePoints,
            level: getLevel(revenuePoints),
            avg_order_value: Math.round(avgOrderValue * 100) / 100,
            total_revenue: totalRevenue
          }
        },
        riskNotes: riskNotes,
        riskAssessedAt: new Date(),
        riskAssessedBy: adminId
      },
      { new: true }
    ).select('-password');

    // 11. Create admin notification
    await createAdminNotification(
      `Risk Recalculated: ${updatedMerchant.businessName || updatedMerchant.username}`,
      `Risk score for ${updatedMerchant.businessName || updatedMerchant.username} recalculated. ` +
      `New risk level: ${riskScore.toUpperCase()} (${riskPercentage}%). ` +
      `Dispute rate: ${Math.round(disputeRate * 100) / 100}%. Orders: ${orderCount}.`,
      riskScore === 'high' ? 'alert' : 'info',
      'Risk Management',
      {
        merchantId: merchant._id,
        email: merchant.email,
        businessName: merchant.businessName,
        riskScore,
        riskPercentage,
        disputeRate: Math.round(disputeRate * 100) / 100,
        orderCount,
        totalRevenue
      }
    );

    // 12. Send success response
    res.status(200).json({
      success: true,
      message: 'Risk score recalculated successfully',
      riskAssessment: {
        merchantId: updatedMerchant._id,
        businessName: updatedMerchant.businessName || updatedMerchant.username,
        riskScore: riskScore,
        riskPercentage: riskPercentage,
        riskFactors: updatedMerchant.riskFactors,
        riskNotes: riskNotes,
        assessedAt: new Date(),
        assessedBy: adminId,
        summary: {
          totalOrders: orderCount,
          completedOrders: completedOrders,
          disputes: disputes,
          disputeRate: Math.round(disputeRate * 100) / 100,
          accountAge: ageInDays,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          totalRevenue: totalRevenue
        }
      }
    });

  } catch (error) {
    console.error('Error recalculating merchant risk:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recalculating risk',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};