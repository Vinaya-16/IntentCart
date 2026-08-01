import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import {
  getSystemStats,
  getAllUsers,
  getMerchantApplications,
  approveMerchant,
  blockUser,
  deleteUser,
  getProducts,
  approveProduct,
  getOrders,
  updateOrderStatus
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Dashboard
router.get('/stats', getSystemStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);

// Merchant Management
router.get('/merchants/pending', getMerchantApplications);
router.put('/merchants/:id/approve', approveMerchant);

// Product Management
router.get('/products', getProducts);
router.put('/products/:id/approve', approveProduct);

// Order Management
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;