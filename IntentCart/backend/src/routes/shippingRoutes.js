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

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes (all users)
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Shipper specific routes
router.put('/shipper/status', protect, updateShipperStatus);
router.put('/shipper/location', protect, updateShipperLocation);
router.get('/shipper/dashboard', protect, getShipperDashboard);
router.get('/shipper/profile', protect, getShipperProfile);

// Admin routes
router.get('/admin/shippers', protect, getAllShippers);
router.put('/admin/shippers/:shipperId/approve', protect, approveShipper);

export default router;