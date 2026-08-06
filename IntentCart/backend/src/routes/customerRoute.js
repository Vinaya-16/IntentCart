import express from 'express';
import { protect } from '../middleware/auth.js';

import {
  getCustomerNotifications,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
  deleteCustomerNotification,
  getCustomerUnreadCount
} from '../controllers/customerNotificationController.js';

import {
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerAvatar,
  addAddress,
  deleteAddress,
  addPaymentMethod,
  deletePaymentMethod
} from '../controllers/customerProfileController.js';

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} from '../controllers/wishlistController.js';

import {
  createOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder
} from '../controllers/orderController.js';

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

// ==================== CART ====================
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:itemId', updateCartItem);
router.delete('/cart/:itemId', removeFromCart);
router.delete('/cart/clear', clearCart);

// ==================== WISHLIST ====================
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.get('/wishlist/check/:productId', checkWishlist);

// ==================== ORDERS ====================
router.post('/orders', createOrder);
router.get('/orders', getCustomerOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/cancel', cancelOrder);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', getCustomerNotifications);
router.get('/notifications/unread-count', getCustomerUnreadCount);
router.put('/notifications/:id/read', markCustomerNotificationAsRead);
router.put('/notifications/read-all', markAllCustomerNotificationsAsRead);
router.delete('/notifications/:id', deleteCustomerNotification);

export default router;