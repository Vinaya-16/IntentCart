import Notification from '../models/Notifications.js';

// ==================== CUSTOMER NOTIFICATIONS ====================

// @desc    Get customer notifications
// @route   GET /api/customer/notifications
// @access  Private (Customer)
export const getCustomerNotifications = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { limit = 50, page = 1, read, type } = req.query;

        // console.log(`Fetching notifications for customer: ${customerId}`);

        let query = {
            panel: 'customer',
            customerId: customerId
        };

        if (read !== undefined) {
            query.read = read === 'true';
        }

        if (type) {
            query.type = type;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            panel: 'customer',
            customerId: customerId,
            read: false
        });

        // Count by type
        const orderCount = await Notification.countDocuments({
            panel: 'customer',
            customerId: customerId,
            type: 'order'
        });
        const promoCount = await Notification.countDocuments({
            panel: 'customer',
            customerId: customerId,
            type: { $in: ['promo', 'price'] }
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            orderCount,
            promoCount,
            notifications
        });
    } catch (error) {
        console.error('Error fetching customer notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark customer notification as read
// @route   PUT /api/customer/notifications/:id/read
// @access  Private (Customer)
export const markCustomerNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, panel: 'customer', customerId: customerId },
            {
                read: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking customer notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark all customer notifications as read
// @route   PUT /api/customer/notifications/read-all
// @access  Private (Customer)
export const markAllCustomerNotificationsAsRead = async (req, res) => {
    try {
        const customerId = req.user._id;

        await Notification.updateMany(
            { panel: 'customer', customerId: customerId, read: false },
            {
                read: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all customer notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete customer notification
// @route   DELETE /api/customer/notifications/:id
// @access  Private (Customer)
export const deleteCustomerNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            panel: 'customer',
            customerId: customerId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get customer unread count
// @route   GET /api/customer/notifications/unread-count
// @access  Private (Customer)
export const getCustomerUnreadCount = async (req, res) => {
    try {
        const customerId = req.user._id;

        const count = await Notification.countDocuments({
            panel: 'customer',
            customerId: customerId,
            read: false
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error getting customer unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== CUSTOMER NOTIFICATION TRIGGERS ====================

// @desc    Create notification for customer (internal use)
export const createCustomerNotification = async (customerId, title, message, type, category, metadata = {}) => {
    try {
        await Notification.create({
            title,
            message,
            type: type || 'info',
            category: category || 'General',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            metadata
        });
        // console.log(`Customer notification created: ${title}`);
    } catch (error) {
        console.error('Error creating customer notification:', error);
    }
};

// @desc    Trigger: Order Placed
export const triggerOrderPlacedNotification = async (customerId, orderId, orderTotal) => {
    try {
        await Notification.create({
            title: 'Order Placed Successfully!',
            message: `Your order #${orderId} for Rs. ${orderTotal} has been placed successfully. We'll notify you when it ships.`,
            type: 'order',
            category: 'Orders',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/orders/${orderId}`,
            actionLabel: 'View Order',
            metadata: { orderId, orderTotal }
        });
        // console.log(`Order placed notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating order placed notification:', error);
    }
};

// @desc    Trigger: Order Shipped
export const triggerOrderShippedNotification = async (customerId, orderId, trackingNumber) => {
    try {
        await Notification.create({
            title: 'Order Shipped!',
            message: `Your order #${orderId} has been shipped. Tracking Number: ${trackingNumber || 'Not available'}`,
            type: 'order',
            category: 'Orders',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/orders/${orderId}`,
            actionLabel: 'Track Order',
            metadata: { orderId, trackingNumber }
        });
        // console.log(`Order shipped notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating order shipped notification:', error);
    }
};

// @desc    Trigger: Order Delivered
export const triggerOrderDeliveredNotification = async (customerId, orderId) => {
    try {
        await Notification.create({
            title: 'Order Delivered!',
            message: `Your order #${orderId} has been successfully delivered. Thank you for shopping with us!`,
            type: 'order',
            category: 'Orders',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/orders/${orderId}`,
            actionLabel: 'Review Order',
            metadata: { orderId }
        });
        // console.log(`Order delivered notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating order delivered notification:', error);
    }
};

// @desc    Trigger: Price Drop Alert
export const triggerPriceDropNotification = async (customerId, productName, productId, oldPrice, newPrice) => {
    try {
        await Notification.create({
            title: 'Price Drop Alert!',
            message: `Great news! "${productName}" is now available at Rs. ${newPrice} (was Rs. ${oldPrice}). Don't miss out!`,
            type: 'price',
            category: 'Offers',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/product/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName, oldPrice, newPrice }
        });
        // console.log(`Price drop notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating price drop notification:', error);
    }
};

// @desc    Trigger: Promo Offer
export const triggerPromoOfferNotification = async (customerId, offerTitle, offerDescription, code) => {
    try {
        await Notification.create({
            title: `${offerTitle}`,
            message: `${offerDescription} Use code: ${code || 'N/A'}`,
            type: 'promo',
            category: 'Offers',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: '/cart',
            actionLabel: 'Shop Now',
            metadata: { offerTitle, code }
        });
        // console.log(`Promo offer notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating promo offer notification:', error);
    }
};

// @desc    Trigger: Security Alert
export const triggerSecurityAlertNotification = async (customerId, alertMessage) => {
    try {
        await Notification.create({
            title: 'Security Alert',
            message: alertMessage || 'We detected unusual activity on your account. Please review your recent activity.',
            type: 'system',
            category: 'Security',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: '/profile',
            actionLabel: 'Review Activity',
            metadata: { alertMessage }
        });
        // console.log(`Security alert notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating security alert notification:', error);
    }
};

// @desc    Trigger: Back in Stock
export const triggerBackInStockNotification = async (customerId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Back in Stock!',
            message: `Good news! "${productName}" is back in stock. Hurry before it sells out again!`,
            type: 'price',
            category: 'Offers',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/product/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
        // console.log(`Back in stock notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating back in stock notification:', error);
    }
};

// @desc    Trigger: Welcome Notification
export const triggerWelcomeNotification = async (customerId, username) => {
    try {
        await Notification.create({
            title: 'Welcome to IntentCart!',
            message: `Welcome ${username}! Start exploring amazing products and exclusive deals. Happy shopping! 🎉`,
            type: 'success',
            category: 'Updates',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: '/',
            actionLabel: 'Start Shopping',
            metadata: { username }
        });
        // console.log(`Welcome notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating welcome notification:', error);
    }
};

// @desc    Trigger: Abandoned Cart Recovery
export const triggerRecoveryNotification = async (customerId, cartItems, cartTotal, sessionId) => {
    try {
        if (!customerId) return; // Don't send if no customer ID

        // Calculate number of items
        const itemCount = cartItems?.length || 0;
        
        // Build the message
        const message = itemCount > 0 
            ? `You left ${itemCount} item${itemCount > 1 ? 's' : ''} worth ${cartTotal ? 'Rs. ' + cartTotal : ''} in your cart! Complete your purchase before they run out.` 
            : 'You left items in your cart! Complete your purchase today!';

        await Notification.create({
            title: 'Complete Your Purchase!',
            message: message,
            type: 'recovery', 
            category: 'Carts',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false,
            actionLink: `/cart?session=${sessionId}`,
            actionLabel: 'View My Cart',
            metadata: { 
                cartItems, 
                cartTotal, 
                sessionId,
                itemCount
            }
        });
        
        // console.log(`Recovery notification saved for customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating recovery notification:', error);
    }
};