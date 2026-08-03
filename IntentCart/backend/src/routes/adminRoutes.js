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

// All routes need authentication
router.use(protect);

// Admin only middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      currentRole: req.user.role
    });
  }
  next();
};

// Apply admin check to all routes
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

// ==================== STATISTICS ====================
router.get('/stats', getSystemStats);

export default router;