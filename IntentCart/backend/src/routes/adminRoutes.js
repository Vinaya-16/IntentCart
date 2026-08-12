import express from 'express';
import { protect } from '../middleware/auth.js';
import {

  // userM & merchantM
  getAllUsers,
  getUserById,
  toggleBlockUser,
  getPendingMerchants,
  approveMerchant,
  rejectMerchant,
  resetMerchantStatus,
  getSystemStats,
  deleteUser,

  // Profile 
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  updateAdminAvatar,
  getDashboardStats,

  // Notifications 
  // createAdminNotification,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  getAdminUnreadCount,

  // productM 
  getAdminProducts,
  getAdminProductById,
  approveProduct,
  rejectProduct,
  getProductStats,
  bulkApproveProducts,
  bulkRejectProducts,
  resetProductStatus,

  // merchant risk
  getRiskMerchants,
  getRiskStats,
  recalculateMerchantRisk,
  updateMerchantStatus,
  bulkRecalculateRisk,
  getMerchantRiskDetails,


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

// ==================== PRODUCT MODERATION ====================
router.get('/products', getAdminProducts);
router.get('/products/:id', getAdminProductById);
router.get('/products/stats', getProductStats);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);
router.put('/products/bulk-approve', bulkApproveProducts);
router.put('/products/bulk-reject', bulkRejectProducts);
router.put('/products/:id/reset', resetProductStatus);

// ==================== RISK MANAGEMENT ROUTES ====================

// Get risk statistics
router.get('/risk/stats', getRiskStats);

// Get all merchants with risk scores
router.get('/risk/merchants', getRiskMerchants);

// Get single merchant risk details
router.get('/risk/merchant/:id', getMerchantRiskDetails);

// Update merchant status
router.put('/risk/merchant/:id/status', updateMerchantStatus);

// Recalculate merchant risk
router.post('/risk/merchant/:id/recalculate', recalculateMerchantRisk);

// Bulk recalculate risk scores
router.post('/risk/bulk-recalculate', bulkRecalculateRisk);

export default router;