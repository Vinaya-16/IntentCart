import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getCustomerNotifications,
    markCustomerNotificationAsRead,
    markAllCustomerNotificationsAsRead,
    deleteCustomerNotification,
    getCustomerUnreadCount
} from '../controllers/categoryController.js';

const router = express.Router();

router.use(protect);

// ==================== CUSTOMER NOTIFICATIONS ====================
router.get('/notifications', getCustomerNotifications);
router.get('/notifications/unread-count', getCustomerUnreadCount);
router.put('/notifications/:id/read', markCustomerNotificationAsRead);
router.put('/notifications/read-all', markAllCustomerNotificationsAsRead);
router.delete('/notifications/:id', deleteCustomerNotification);

export default router;