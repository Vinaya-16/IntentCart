// routes/authRoutes.js
import express from 'express';
import {
    updateShipperStatus,
    updateShipperLocation,
    getShipperDashboard,
    getShipperProfile,
    getAllShippers,
    approveShipper
} from '../controllers/shippingAuthController.js';
import {
    signup,
    signin,
    getCurrentUser,
    logout,
    updateProfile,
    changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

import {
    getShippingOrders,
    getShippingOrderById,
    updateShippingStatus,
    updateTrackingNumber,
    assignShipperToOrder,
    getShippingStats,
    getAvailableShippers,

    //notifications
    getShipperNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getUnreadCount,

    // tracking 
    searchOrderByOrderId,

    //driver M
    getAllDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    updateDriverStatus,
    assignOrderToDriver,
    deleteDriver

} from '../controllers/shippingController.js';

const router = express.Router();

router.use(protect);

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes (all users)
router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Shipper specific routes
router.put('/shipper/status', updateShipperStatus);
router.put('/shipper/location', updateShipperLocation);
router.get('/shipper/dashboard', getShipperDashboard);
router.get('/shipper/profile', getShipperProfile);

// Admin routes
router.get('/admin/shippers', getAllShippers);
router.put('/admin/shippers/:shipperId/approve', approveShipper);

// Shipping order routes
router.get('/orders', getShippingOrders);
router.get('/stats', getShippingStats);
router.get('/available-shippers', getAvailableShippers);

// Parameter routes (must come AFTER specific routes)
router.get('/orders/:id', getShippingOrderById);
router.put('/orders/:id/status', updateShippingStatus);
router.put('/orders/:id/tracking', updateTrackingNumber);
router.put('/orders/:id/assign', assignShipperToOrder);

// ==================== SHIPPER NOTIFICATION ROUTES ====================
router.get('/notifications/shipper', getShipperNotifications);
router.get('/notifications/shipper/unread-count', getUnreadCount);
router.put('/notifications/shipper/:id/read', markNotificationAsRead);
router.put('/notifications/shipper/mark-all-read', markAllNotificationsAsRead);
router.delete('/notifications/shipper/:id', deleteNotification);


// ======================= Tracking Orders ============================= 
router.get('/orders/search/:orderId', searchOrderByOrderId);

// ============================= Driver Management ======================== 
router.get('/drivers', getAllDrivers);
router.get('/drivers/:id', getDriverById);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.put('/drivers/:id/status', updateDriverStatus);
router.put('/drivers/:id/assign-order', assignOrderToDriver);
router.delete('/drivers/:id', deleteDriver);

export default router;