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
    getAvailableShippers
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

export default router;