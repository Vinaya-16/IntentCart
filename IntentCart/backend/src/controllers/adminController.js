import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin only
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin only
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Admin only
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
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'unblocked' : 'blocked'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get pending merchant applications
// @route   GET /api/admin/merchants/pending
// @access  Admin only
export const getPendingMerchants = async (req, res) => {
  try {
    const merchants = await User.find({
      role: 'merchant',
      isApproved: false
    }).select('-password');
    
    res.status(200).json({
      success: true,
      count: merchants.length,
      merchants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve merchant
// @route   PUT /api/admin/merchants/:id/approve
// @access  Admin only
export const approveMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        isApproved: true,
        approvedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Merchant approved successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reject merchant
// @route   PUT /api/admin/merchants/:id/reject
// @access  Admin only
export const rejectMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        isApproved: false,
        rejectedAt: new Date(),
        rejectionReason: reason || 'No reason provided'
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Merchant rejected',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Admin only
export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingMerchants = await User.countDocuments({ role: 'merchant', isApproved: false });
    const blockedUsers = await User.countDocuments({ isActive: false });
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalMerchants,
        totalCustomers,
        pendingMerchants,
        blockedUsers,
        activeUsers: totalUsers - blockedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};