import Notification from '../models/Notifications.js';

// ==================== CUSTOMER NOTIFICATION TRIGGERS ====================

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
        console.log(`Order shipped notification sent to customer: ${customerId}`);
    } catch (error) {
        console.error('Error creating order shipped notification:', error);
    }
};

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

// ==================== MERCHANT NOTIFICATION TRIGGERS ====================

export const notifyMerchantNewOrder = async (merchantId, orderId, customerName) => {
    try {
        await Notification.create({
            title: 'New Order Received!',
            message: `You have received a new order #${orderId} from ${customerName}. Please process it soon.`,
            type: 'order',
            category: 'Orders',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/orders/${orderId}`,
            actionLabel: 'View Order',
            metadata: { orderId, customerName }
        });
        // console.log(`New order notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating new order notification:', error);
    }
};

export const notifyMerchantProductApproved = async (merchantId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Product Approved!',
            message: `Your product "${productName}" has been approved and is now live in the marketplace.`,
            type: 'success',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
        // console.log(`Product approval notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product approval notification:', error);
    }
};

export const notifyMerchantProductRejected = async (merchantId, productName, productId, reason) => {
    try {
        await Notification.create({
            title: 'Product Rejected',
            message: `Your product "${productName}" was rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Details',
            metadata: { productId, productName, reason }
        });
        // console.log(`Product rejection notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product rejection notification:', error);
    }
};

export const notifyMerchantLowStock = async (merchantId, productName, productId, stock) => {
    try {
        await Notification.create({
            title: 'Low Stock Alert!',
            message: `Your product "${productName}" is running low on stock (${stock} remaining). Please restock soon.`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'Update Stock',
            metadata: { productId, productName, stock }
        });
        // console.log(`Low stock notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating low stock notification:', error);
    }
};