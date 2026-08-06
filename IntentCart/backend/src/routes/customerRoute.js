import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getCustomerNotifications,
    markCustomerNotificationAsRead,
    markAllCustomerNotificationsAsRead,
    deleteCustomerNotification,
    getCustomerUnreadCount
} from '../controllers/categoryController.js';

import {
    getCustomerProfile,
    updateCustomerProfile,
    updateCustomerAvatar,
    addAddress,
    deleteAddress,
    addPaymentMethod,
    deletePaymentMethod
} from '../controllers/customerProfileController.js';

const router = express.Router();

router.use(protect);

// ==================== CUSTOMER NOTIFICATIONS ====================
router.get('/notifications', getCustomerNotifications);
router.get('/notifications/unread-count', getCustomerUnreadCount);
router.put('/notifications/:id/read', markCustomerNotificationAsRead);
router.put('/notifications/read-all', markAllCustomerNotificationsAsRead);
router.delete('/notifications/:id', deleteCustomerNotification);

// ==================== PROFILE ====================
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.put('/avatar', updateCustomerAvatar);

// ==================== ADDRESSES ====================
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);

// ==================== PAYMENTS ====================
router.post('/payments', addPaymentMethod);
router.delete('/payments/:id', deletePaymentMethod);

export default router;