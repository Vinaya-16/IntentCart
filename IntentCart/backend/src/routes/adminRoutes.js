import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  toggleBlockUser,
  getPendingMerchants,
  approveMerchant,
  rejectMerchant,
  resetMerchantStatus,
  getSystemStats,
  deleteUser,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  updateAdminAvatar,
  getDashboardStats,
  getAdminNotifications,
  // createAdminNotification,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  getAdminUnreadCount  
} from '../controllers/adminController.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

// Apply middleware to all routes
router.use(protect);
router.use(isAdmin);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/block', toggleBlockUser);

// ==================== MERCHANT MANAGEMENT ====================
router.get('/merchants/pending', getPendingMerchants);
router.put('/merchants/:id/approve', approveMerchant);
router.put('/merchants/:id/reject', rejectMerchant);
router.put('/merchants/:id/reset', resetMerchantStatus);

// ==================== ADMIN PROFILE ====================
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changeAdminPassword);
router.put('/avatar', updateAdminAvatar);

// ==================== DASHBOARD STATISTICS ====================
router.get('/dashboard-stats', getDashboardStats);

// ==================== ADMIN NOTIFICATIONS ====================
router.get('/notifications', protect, isAdmin, getAdminNotifications);
router.get('/notifications/unread-count', protect, isAdmin, getAdminUnreadCount);
// router.post('/notifications', protect, isAdmin, createAdminNotification);
router.put('/notifications/:id/read', protect, isAdmin, markAdminNotificationAsRead);
router.put('/notifications/read-all', protect, isAdmin, markAllAdminNotificationsAsRead);
router.delete('/notifications/:id', protect, isAdmin, deleteAdminNotification);

// ==================== STATISTICS ====================
router.get('/stats', getSystemStats);

export default router;