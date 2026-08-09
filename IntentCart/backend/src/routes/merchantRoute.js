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

import {
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
    validateCoupon,
    applyCoupon,
    getCampaignStats
} from '../controllers/campaignController.js';

import {
    getRecoveryStats,
    getAllRecoveryEvents,
    detectAbandonments,
    triggerRecovery,
    trackEmailOpen,
    trackEmailClick,
    markRecoveryConverted,
    getAbandonmentReasons,
    getRecoveryTrends
} from '../controllers/recoveryController.js';

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

// ==================== CAMPAIGN MANAGEMENT ====================
router.post('/campaigns', createCampaign);
router.get('/campaigns', getCampaigns);
router.get('/campaigns/stats', getCampaignStats);
router.get('/campaigns/:id', getCampaignById);
router.put('/campaigns/:id', updateCampaign);
router.put('/campaigns/:id/status', updateCampaignStatus);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/campaigns/validate-coupon', validateCoupon);
router.post('/campaigns/apply-coupon', applyCoupon);

// ==================== RECOVERY DASHBOARD ====================
// Get recovery statistics
router.get('/recovery/stats', getRecoveryStats);

// Get all recovery events with pagination and filters
router.get('/recovery/events', getAllRecoveryEvents);

// Get abandonment reasons distribution
router.get('/recovery/abandonment-reasons', getAbandonmentReasons);

// Get recovery trends data
router.get('/recovery/trends', getRecoveryTrends);

// Detect abandonments (manual trigger)
router.post('/recovery/detect-abandonments', detectAbandonments);

// Trigger recovery for a specific session
router.post('/recovery/trigger', triggerRecovery);

// Track email open (webhook/pixel)
router.post('/recovery/open/:recoveryId', trackEmailOpen);

// Track email click (webhook)
router.post('/recovery/click/:recoveryId', trackEmailClick);

// Mark recovery as converted (when purchase is completed)
router.post('/recovery/convert/:recoveryId', markRecoveryConverted);

export default router;