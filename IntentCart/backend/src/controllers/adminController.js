import User from '../models/User.js';
import Notification from '../models/Notifications.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

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

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
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

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      user
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

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create admin notification for user deletion
    await createAdminNotification(
      `User Deleted: ${user.username}`,
      `User ${user.username} (${user.email}) was deleted from the system.`,
      'alert',
      'System',
      { userId: user._id, email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
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

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: isActive,
        blockedAt: isActive ? null : new Date(),
        blockReason: isActive ? null : (reason || 'No reason provided')
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create admin notification for block/unblock
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
      user
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

    // Create admin notification for merchant approval
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

    // Create admin notification for merchant rejection
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

    // Create admin notification for merchant status reset
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

    let totalRevenue = 0;
    let avgRevenueSize = 0;

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
      totalRevenue: `$ ${totalRevenue.toLocaleString()}`,
      avgRevenueSize: `$ ${avgRevenueSize.toLocaleString()}`,
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

    // Create admin notification for profile update
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

    // Create admin notification for password change
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
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'pending' });
    const approvedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'approved' });
    const rejectedMerchants = await User.countDocuments({ role: 'merchant', merchantStatus: 'rejected' });
    const blockedUsers = await User.countDocuments({ isActive: false });
    const activeUsers = totalUsers - blockedUsers;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const now = new Date();
    const currentMonth = now.getMonth();

    const userGrowth = [];
    const merchantGrowth = [];
    const monthlyRevenue = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), currentMonth - i, 1);
      const nextMonth = new Date(now.getFullYear(), currentMonth - i + 1, 1);

      const userCount = await User.countDocuments({
        createdAt: { $gte: month, $lt: nextMonth }
      });
      userGrowth.push(userCount);

      const merchantCount = await User.countDocuments({
        role: 'merchant',
        createdAt: { $gte: month, $lt: nextMonth }
      });
      merchantGrowth.push(merchantCount);

      monthlyRevenue.push(0);
    }

    const totalProducts = 0;
    const totalOrders = 0;
    const totalRevenue = 0;

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
          months: months,
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

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Admin only
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

// @desc    Create admin notification (manual)
// @route   POST /api/admin/notifications
// @access  Admin only
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

// @desc    Mark admin notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Admin only
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

// @desc    Mark all admin notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Admin only
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

// @desc    Delete admin notification
// @route   DELETE /api/admin/notifications/:id
// @access  Admin only
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

// @desc    Get admin unread count
// @route   GET /api/admin/notifications/unread-count
// @access  Admin only
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

// Trigger: Product Approved Notification (to merchant)
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
        // console.log(`Product approval notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product approval notification:', error);
    }
};

// Trigger: Product Rejected Notification (to merchant)
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
        // console.log(`Product rejection notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product rejection notification:', error);
    }
};

// Trigger: Admin Notification for new product
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
        // console.log(`Admin notification sent for new product: ${productName}`);
    } catch (error) {
        console.error('Error creating admin notification:', error);
    }
};

// ==================== PRODUCT MODERATION ====================

// @desc    Get all products for admin moderation
// @route   GET /api/admin/products
// @access  Admin only
export const getAdminProducts = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;

        let query = {};

        // Filter by approval status
        if (status) {
            if (status === 'pending') {
                query.approvalStatus = 'pending';
            } else if (status === 'approved') {
                query.approvalStatus = 'approved';
            } else if (status === 'rejected') {
                query.approvalStatus = 'rejected';
            }
        }

        // Search by product name
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

        // Format products for frontend
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

// @desc    Get single product for moderation
// @route   GET /api/admin/products/:id
// @access  Admin only
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

// @desc    Approve product
// @route   PUT /api/admin/products/:id/approve
// @access  Admin only
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

        // Update product status
        product.approvalStatus = 'approved';
        product.status = 'active';
        product.approvalReason = notes || '';
        await product.save();

        // TRIGGER: Notify merchant that product is approved
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

// @desc    Reject product
// @route   PUT /api/admin/products/:id/reject
// @access  Admin only
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

        // Update product status
        product.approvalStatus = 'rejected';
        product.status = 'inactive';
        product.approvalReason = reason;
        await product.save();

        // TRIGGER: Notify merchant that product is rejected
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

// @desc    Get product statistics for admin dashboard
// @route   GET /api/admin/products/stats
// @access  Admin only
export const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const pendingProducts = await Product.countDocuments({ approvalStatus: 'pending' });
        const approvedProducts = await Product.countDocuments({ approvalStatus: 'approved' });
        const rejectedProducts = await Product.countDocuments({ approvalStatus: 'rejected' });
        const activeProducts = await Product.countDocuments({ status: 'active', approvalStatus: 'approved' });
        const outOfStock = await Product.countDocuments({ stock: 0, status: 'active' });

        // Get products by category
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

// @desc    Bulk approve products
// @route   PUT /api/admin/products/bulk-approve
// @access  Admin only
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

            // Send notification to each merchant
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

// @desc    Bulk reject products
// @route   PUT /api/admin/products/bulk-reject
// @access  Admin only
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

            // Send notification to each merchant
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

// @desc    Reset product status to pending (for re-review)
// @route   PUT /api/admin/products/:id/reset
// @access  Admin only
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

        // Reset product status
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