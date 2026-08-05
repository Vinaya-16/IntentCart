import express from 'express';
import { protect } from '../middleware/auth.js';
import {

    // Categories 
    getCategories,
    getCategoriesByLevel,
    getFlatCategories,

    // Products 
    getMerchantProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,

    //dashboard
    getMerchantDashboardStats,

    // Notifications 
    getMerchantNotifications,
    getMerchantUnreadCount,
    createMerchantNotification,
    markMerchantNotificationAsRead,
    markAllMerchantNotificationsAsRead,
    deleteMerchantNotification,

    // Profile 
    getMerchantProfile,
    updateMerchantProfile,
    changeMerchantPassword,
    updateMerchantAvatar,


} from '../controllers/merchantController.js';

const router = express.Router();

// All merchant routes require authentication
router.use(protect);

// ==================== DASHBOARD ====================
router.get('/dashboard-stats', getMerchantDashboardStats);

// ==================== CATEGORY MANAGEMENT ====================
router.get('/categories', getCategories);
router.get('/categories/flat', getFlatCategories);
router.get('/categories/by-level', getCategoriesByLevel);

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', getMerchantProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id/stock', updateProductStock);

// ==================== MERCHANT NOTIFICATIONS ====================
router.get('/notifications', getMerchantNotifications);
router.get('/notifications/unread-count', getMerchantUnreadCount);
router.post('/notifications', createMerchantNotification);
router.put('/notifications/:id/read', markMerchantNotificationAsRead);
router.put('/notifications/read-all', markAllMerchantNotificationsAsRead);
router.delete('/notifications/:id', deleteMerchantNotification);

// ==================== MERCHANT PROFILE ====================
router.get('/profile', getMerchantProfile);
router.put('/profile', updateMerchantProfile);
router.put('/change-password', changeMerchantPassword);
router.put('/avatar', updateMerchantAvatar);

export default router;