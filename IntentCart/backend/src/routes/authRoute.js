import express from 'express';
import {
  signup,
  signin,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/signup', signup);
router.post('/signin', signin);

// ==================== PROTECTED ROUTES ====================
router.use(protect); // All routes below need authentication

router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;