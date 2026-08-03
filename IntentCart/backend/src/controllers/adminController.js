import User from '../models/User.js';
import Notification from '../models/Notifications.js';

// ==================== HELPER: Create Notification ====================

const createNotification = async (title, message, type, category, metadata = {}) => {
  try {
    await Notification.create({
      title,
      message,
      type: type || 'info',
      category: category || 'General',
      isGlobal: true,
      metadata
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
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
    
    // ✅ Create notification for user deletion
    await createNotification(
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

    // ✅ Create notification for block/unblock
    if (!isActive) {
      await createNotification(
        `User Blocked: ${user.username}`,
        `User ${user.username} (${user.email}) has been blocked. Reason: ${reason || 'No reason provided'}`,
        'alert',
        'Alerts',
        { userId: user._id, email: user.email, reason }
      );
    } else {
      await createNotification(
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

    // ✅ Create notification for merchant approval
    await createNotification(
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

    // ✅ Create notification for merchant rejection
    await createNotification(
      `Merchant Rejected: ${user.businessName || user.username}`,
      `Merchant ${user.businessName || user.username} (${user.email}) has been rejected. Reason: ${reason || 'No reason provided'}`,
      'alert',
      'Alerts',
      { merchantId: user._id, email: user.email, reason }
    );

    console.log('Merchant rejected successfully:', user.email);

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

    // ✅ Create notification for merchant status reset
    await createNotification(
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

    // ✅ Create notification for profile update
    await createNotification(
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

    // ✅ Create notification for password change
    await createNotification(
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

// ==================== NOTIFICATION MANAGEMENT ====================

export const getNotifications = async (req, res) => {
  try {
    const { limit = 50, page = 1, read, type } = req.query;
    
    let query = { isGlobal: true };
    
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    if (type) {
      query.type = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ read: false, isGlobal: true });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
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

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
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

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { read: false, isGlobal: true },
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
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    
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

// @desc    Create notification (manual)
// @route   POST /api/admin/notifications
// @access  Admin only
export const createManualNotification = async (req, res) => {
  try {
    const { title, message, type, category, actionLink, actionLabel, metadata } = req.body;
    
    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      category: category || 'General',
      isGlobal: true,
      actionLink,
      actionLabel,
      metadata
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false, isGlobal: true });
    
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