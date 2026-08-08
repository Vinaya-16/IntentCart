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

import {
    getMerchantOrders,
    getMerchantOrderById,
    updateOrderStatus,
    getOrderStats
} from '../controllers/merchantOrderController.js';

import {
    getCustomers,
    getCustomerDetails,
    getCustomerStats
} from '../controllers/customerAnalysisController.js';

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

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', getMerchantOrders);
router.get('/orders/stats', getOrderStats);
router.get('/orders/:id', getMerchantOrderById);
router.put('/orders/:id/status', updateOrderStatus);

// ==================== CUSTOMER ANALYSIS ====================
router.get('/customers', getCustomers);
router.get('/customers/stats', getCustomerStats);
router.get('/customers/:id', getCustomerDetails);

export default router;