import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  toggleBlockUser,
  getPendingMerchants,
  approveMerchant,
  rejectMerchant,
  getSystemStats,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

// Admin middleware
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
router.use(protect);  // First: Check if user is logged in
router.use(isAdmin);  // Second: Check if user is admin

// ==================== MERCHANT MANAGEMENT ROUTES ====================
router.get('/users', getAllUsers);                    // GET /api/admin/users?role=merchant
router.put('/merchants/:id/approve', approveMerchant); // PUT /api/admin/merchants/:id/approve
router.put('/merchants/:id/reject', rejectMerchant);   // PUT /api/admin/merchants/:id/reject
router.get('/merchants/pending', getPendingMerchants); // GET /api/admin/merchants/pending

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/block', toggleBlockUser);
router.get('/stats', getSystemStats);

export default router;