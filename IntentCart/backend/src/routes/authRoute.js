import express from 'express';
import {
  signup,
  signin,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword,
  getMerchants
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateSignup,
  validateSignin,
  handleValidationErrors
} from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, handleValidationErrors, signup);
router.post('/signin', validateSignin, handleValidationErrors, signin);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/merchants', protect, getMerchants);

export default router;