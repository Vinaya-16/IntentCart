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

// Get all merchants with risk scores - FIXED
export const getRiskMerchants = async (req, res) => {
  try {
    const { search, riskLevel, page = 1, limit = 20 } = req.query;

    // console.log('=== getRiskMerchants called ===');
    // console.log('Query params:', { search, riskLevel, page, limit });

    // Build query - get ALL merchants first
    let query = { role: 'merchant' };

    // Filter by risk level
    if (riskLevel && riskLevel !== 'all' && riskLevel !== 'undefined') {
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

    // console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    // First, get total count
    const total = await User.countDocuments(query);
    // console.log('Total merchants matching query:', total);

    if (total === 0) {
      return res.status(200).json({
        success: true,
        merchants: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

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

      return {
        id: merchant._id,
        businessName: merchant.businessName || merchant.username || 'Unknown Merchant',
        email: merchant.email || 'No email',
        riskScore: merchant.riskScore || 'unassessed',
        riskPercentage: merchant.riskPercentage || 0,
        orders: orderCount || 0,
        revenue: revenue[0]?.total || 0,
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

// Get risk statistics - FIXED
export const getRiskStats = async (req, res) => {
  try {
    // console.log('=== getRiskStats called ===');

    // Get all merchants
    const merchants = await User.find({ role: 'merchant' });
    // console.log('Total merchants for stats:', merchants.length);

    // Calculate statistics
    const stats = {
      total: merchants.length,
      low: merchants.filter(m => m.riskScore === 'low').length,
      medium: merchants.filter(m => m.riskScore === 'medium').length,
      high: merchants.filter(m => m.riskScore === 'high').length,
      unassessed: merchants.filter(m => !m.riskScore || m.riskScore === 'unassessed').length,
      active: merchants.filter(m => m.merchantStatus === 'active' || m.merchantStatus === 'approved').length,
      pending: merchants.filter(m => m.merchantStatus === 'pending').length,
      suspended: merchants.filter(m => m.merchantStatus === 'suspended' || m.merchantStatus === 'rejected').length,
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

// Get single merchant risk details
export const getMerchantRiskDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const merchant = await User.findById(id).select('-password');
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

    // Get order statistics
    const orderCount = await Order.countDocuments({ merchantId: merchant._id });

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
          total: { $sum: '$total' },
          avg: { $avg: '$total' }
        }
      }
    ]);

    const disputes = await Order.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['cancelled', 'refunded', 'disputed'] }
    });

    // Get recent orders
    const recentOrders = await Order.find({ merchantId: merchant._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber total status createdAt');

    res.status(200).json({
      success: true,
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName || merchant.username,
        email: merchant.email,
        riskScore: merchant.riskScore || 'unassessed',
        riskPercentage: merchant.riskPercentage || 0,
        riskFactors: merchant.riskFactors || null,
        riskAssessedAt: merchant.riskAssessedAt || null,
        status: merchant.merchantStatus || 'pending',
        joined: merchant.createdAt,
        stats: {
          totalOrders: orderCount,
          totalRevenue: revenue[0]?.total || 0,
          averageOrderValue: revenue[0]?.avg || 0,
          disputes: disputes || 0
        },
        recentOrders: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching merchant risk details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update merchant status (active/pending/suspended)
export const updateMerchantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

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

    // Create notification
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

// Recalculate merchant risk score
export const recalculateMerchantRisk = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;

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

    // Calculate risk based on order data
    const orderCount = await Order.countDocuments({ merchantId: merchant._id });

    const disputes = await Order.countDocuments({
      merchantId: merchant._id,
      status: { $in: ['cancelled', 'refunded', 'disputed'] }
    });

    const disputeRate = orderCount > 0 ? (disputes / orderCount) * 100 : 0;

    // Determine risk score
    let riskScore, riskPercentage;
    let factors = {};

    // 1. Order Volume Factor (0-25 points)
    let volumePoints = 0;
    if (orderCount > 100) {
      volumePoints = 25;
      factors.order_volume = { level: 'critical', description: 'Very high order volume', value: orderCount };
    } else if (orderCount > 50) {
      volumePoints = 15;
      factors.order_volume = { level: 'high', description: 'High order volume', value: orderCount };
    } else if (orderCount > 20) {
      volumePoints = 8;
      factors.order_volume = { level: 'medium', description: 'Moderate order volume', value: orderCount };
    } else {
      factors.order_volume = { level: 'low', description: 'Low order volume', value: orderCount };
    }

    // 2. Dispute Rate Factor (0-25 points)
    let disputePoints = 0;
    if (disputeRate > 20) {
      disputePoints = 25;
      factors.disputes = { level: 'critical', description: 'Critical dispute rate', value: Math.round(disputeRate) };
    } else if (disputeRate > 10) {
      disputePoints = 18;
      factors.disputes = { level: 'high', description: 'High dispute rate', value: Math.round(disputeRate) };
    } else if (disputeRate > 5) {
      disputePoints = 10;
      factors.disputes = { level: 'medium', description: 'Moderate dispute rate', value: Math.round(disputeRate) };
    } else {
      factors.disputes = { level: 'low', description: 'Low dispute rate', value: Math.round(disputeRate) };
    }

    // 3. Account Age Factor (0-15 points)
    const ageInDays = Math.floor((new Date() - merchant.createdAt) / (1000 * 60 * 60 * 24));
    let agePoints = 0;
    if (ageInDays < 30) {
      agePoints = 15;
      factors.account_age = { level: 'critical', description: 'Very new account', value: ageInDays };
    } else if (ageInDays < 90) {
      agePoints = 10;
      factors.account_age = { level: 'high', description: 'New account', value: ageInDays };
    } else if (ageInDays < 180) {
      agePoints = 5;
      factors.account_age = { level: 'medium', description: 'Moderately new account', value: ageInDays };
    } else {
      factors.account_age = { level: 'low', description: 'Established account', value: ageInDays };
    }

    // Total points (max 65 for this simplified version)
    const totalPoints = volumePoints + disputePoints + agePoints;
    const maxPoints = 65;
    riskPercentage = Math.round((totalPoints / maxPoints) * 100);

    // Determine risk level
    if (riskPercentage < 30) {
      riskScore = 'low';
    } else if (riskPercentage < 60) {
      riskScore = 'medium';
    } else {
      riskScore = 'high';
    }

    // Update merchant with new risk score
    const updatedMerchant = await User.findByIdAndUpdate(
      id,
      {
        riskScore: riskScore,
        riskPercentage: riskPercentage,
        riskFactors: factors,
        riskAssessedAt: new Date(),
        riskAssessedBy: adminId,
        $push: {
          riskAssessmentHistory: {
            score: riskScore,
            percentage: riskPercentage,
            factors: factors,
            assessedAt: new Date(),
            assessedBy: adminId
          }
        }
      },
      { new: true }
    ).select('-password');

    // Create notification
    await createAdminNotification(
      `Risk Score Recalculated`,
      `Risk score for ${merchant.businessName || merchant.username} (${merchant.email}) has been recalculated. New score: ${riskScore.toUpperCase()} (${riskPercentage}%)`,
      riskScore === 'high' ? 'alert' : 'info',
      'Risk Management',
      {
        merchantId: merchant._id,
        email: merchant.email,
        riskScore: riskScore,
        riskPercentage: riskPercentage
      }
    );

    res.status(200).json({
      success: true,
      message: 'Risk score recalculated successfully',
      merchant: {
        id: updatedMerchant._id,
        businessName: updatedMerchant.businessName || updatedMerchant.username,
        email: updatedMerchant.email,
        riskScore: updatedMerchant.riskScore,
        riskPercentage: updatedMerchant.riskPercentage,
        riskFactors: updatedMerchant.riskFactors,
        riskAssessedAt: updatedMerchant.riskAssessedAt
      }
    });
  } catch (error) {
    console.error('Error recalculating risk:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Bulk recalculate risk scores
export const bulkRecalculateRisk = async (req, res) => {
  try {
    const { merchantIds } = req.body;
    const adminId = req.user?._id;

    if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Merchant IDs are required'
      });
    }

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const merchantId of merchantIds) {
      try {
        const merchant = await User.findById(merchantId);
        if (!merchant) continue;

        // Calculate risk (same logic as recalculateMerchantRisk)
        const orderCount = await Order.countDocuments({ merchantId: merchant._id });
        const disputes = await Order.countDocuments({
          merchantId: merchant._id,
          status: { $in: ['cancelled', 'refunded', 'disputed'] }
        });

        const disputeRate = orderCount > 0 ? (disputes / orderCount) * 100 : 0;
        const ageInDays = Math.floor((new Date() - merchant.createdAt) / (1000 * 60 * 60 * 24));

        let volumePoints = 0;
        if (orderCount > 100) volumePoints = 25;
        else if (orderCount > 50) volumePoints = 15;
        else if (orderCount > 20) volumePoints = 8;

        let disputePoints = 0;
        if (disputeRate > 20) disputePoints = 25;
        else if (disputeRate > 10) disputePoints = 18;
        else if (disputeRate > 5) disputePoints = 10;

        let agePoints = 0;
        if (ageInDays < 30) agePoints = 15;
        else if (ageInDays < 90) agePoints = 10;
        else if (ageInDays < 180) agePoints = 5;

        const totalPoints = volumePoints + disputePoints + agePoints;
        const maxPoints = 65;
        const riskPercentage = Math.round((totalPoints / maxPoints) * 100);

        let riskScore;
        if (riskPercentage < 30) riskScore = 'low';
        else if (riskPercentage < 60) riskScore = 'medium';
        else riskScore = 'high';

        await User.findByIdAndUpdate(merchantId, {
          riskScore: riskScore,
          riskPercentage: riskPercentage,
          riskAssessedAt: new Date(),
          riskAssessedBy: adminId
        });

        processed++;
        results.push({
          merchantId: merchantId,
          success: true,
          riskScore: riskScore,
          riskPercentage: riskPercentage
        });
      } catch (error) {
        failed++;
        results.push({
          merchantId: merchantId,
          success: false,
          error: error.message
        });
      }
    }

    await createAdminNotification(
      `Bulk Risk Recalculation Completed`,
      `${processed} merchants processed successfully, ${failed} failed.`,
      processed > 0 ? 'success' : 'alert',
      'Risk Management',
      { processed, failed, total: merchantIds.length }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk risk recalculation completed',
      data: {
        processed,
        failed,
        total: merchantIds.length,
        results
      }
    });
  } catch (error) {
    console.error('Error in bulk risk recalculation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};