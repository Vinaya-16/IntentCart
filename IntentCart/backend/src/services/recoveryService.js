import Recovery from '../models/Recovery.js';
import Event from '../models/Event.js';
import eventService from './eventService.js';

class RecoveryService {
    /**
     * Trigger recovery for an abandoned cart
     */
    async triggerRecovery(sessionId, customerId, merchantId, method = 'email') {
        try {
            // Find or create recovery record
            let recovery = await Recovery.findOne({
                sessionId,
                merchantId: merchantId,
                recoveryStatus: { $in: ['pending', 'sent', 'opened', 'clicked'] }
            });

            if (!recovery) {
                // Find the abandonment event
                const abandonmentEvent = await Event.findOne({
                    sessionId,
                    merchantId: merchantId,
                    eventType: { $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'] }
                }).sort({ createdAt: -1 });

                if (!abandonmentEvent) {
                    throw new Error('No abandonment event found for this session');
                }

                recovery = new Recovery({
                    sessionId,
                    customerId,
                    merchantId: merchantId,
                    eventId: abandonmentEvent._id,
                    abandonmentReason: abandonmentEvent.abandonmentReason || 'other',
                    cartItems: abandonmentEvent.cartItems || [],
                    cartTotal: abandonmentEvent.cartTotal || 0,
                    recoveryMethod: method
                });
            }

            // Generate recovery content
            const recoveryContent = await this.generateRecoveryContent(recovery);

            // Send recovery notification
            const sent = await this.sendRecoveryNotification(customerId, recoveryContent, method);

            if (sent) {
                recovery.recoveryStatus = 'sent';
                recovery.sentAt = new Date();
                recovery.emailSent = true;
                recovery.emailContent = recoveryContent.content;
                recovery.emailSubject = recoveryContent.subject;

                await recovery.save();

                // Track recovery email sent event
                await eventService.trackEvent({
                    sessionId,
                    customerId,
                    merchantId: merchantId,
                    eventType: 'recovery_email_sent',
                    cartItems: recovery.cartItems,
                    cartTotal: recovery.cartTotal,
                    metadata: {
                        recoveryId: recovery._id,
                        method
                    }
                });

                return recovery;
            }

            throw new Error('Failed to send recovery notification');
        } catch (error) {
            console.error('Error triggering recovery:', error);
            throw error;
        }
    }

    /**
     * Generate recovery email content
     */
    async generateRecoveryContent(recovery) {
        const items = recovery.cartItems || [];
        const itemCount = items.length;
        const total = recovery.cartTotal || 0;
        const reason = recovery.abandonmentReason || 'other';

        let subject = 'You left items in your cart!';
        let content = '';

        switch (reason) {
            case 'cart_aged':
                subject = 'Your cart is waiting for you!';
                content = `You have ${itemCount} items in your cart worth Rs.${total}. Come back and complete your purchase!`;
                break;
            case 'checkout_complex':
                subject = 'Complete your checkout!';
                content = `We noticed you had trouble checking out. Your items (${itemCount}) are still in your cart. Let us help you!`;
                break;
            case 'payment_issue':
                subject = 'Payment issue? We can help!';
                content = `We encountered an issue with your payment. Your ${itemCount} items are still reserved. Try again or use a different payment method.`;
                break;
            case 'shipping_costs':
                subject = 'Shipping costs? We have a special offer!';
                content = `We noticed you were concerned about shipping. Here's a free shipping coupon for your ${itemCount} items!`;
                break;
            case 'high_price':
                subject = 'Price drop on your items!';
                content = `Great news! Some items in your cart (${itemCount}) have been reduced. Check out the new prices!`;
                break;
            case 'waiting_for_discount':
                subject = 'Your discount is ready!';
                content = `We noticed you've been waiting. Here's a 10% discount on your cart of ₹${total}!`;
                break;
            case 'comparing_products':
                subject = 'Compare products easily!';
                content = `Still comparing products? We've added a comparison tool to help you decide. Your ${itemCount} items are waiting!`;
                break;
            default:
                content = `You have ${itemCount} items waiting in your cart. Complete your purchase today!`;
        }

        return {
            subject,
            content,
            items,
            total
        };
    }

    /**
     * Send recovery notification
     */
    async sendRecoveryNotification(customerId, content, method) {
        // console.log(`Sending ${method} recovery notification:`, {
        //     customerId,
        //     subject: content.subject,
        //     content: content.content,
        //     items: content.items
        // });

        // Simulate sending
        return true;
    }

    /**
     * Track recovery email open
     */
    async trackEmailOpen(recoveryId) {
        const recovery = await Recovery.findByIdAndUpdate(
            recoveryId,
            {
                recoveryStatus: 'opened',
                openedAt: new Date(),
                emailOpened: true
            },
            { new: true }
        );

        if (recovery) {
            await eventService.trackEvent({
                sessionId: recovery.sessionId,
                customerId: recovery.customerId,
                merchantId: recovery.merchantId,
                eventType: 'recovery_email_opened',
                metadata: { recoveryId: recovery._id }
            });
        }

        return recovery;
    }

    /**
     * Track recovery email click
     */
    async trackEmailClick(recoveryId) {
        const recovery = await Recovery.findByIdAndUpdate(
            recoveryId,
            {
                recoveryStatus: 'clicked',
                clickedAt: new Date(),
                emailClicked: true
            },
            { new: true }
        );

        if (recovery) {
            await eventService.trackEvent({
                sessionId: recovery.sessionId,
                customerId: recovery.customerId,
                merchantId: recovery.merchantId,
                eventType: 'recovery_email_clicked',
                metadata: { recoveryId: recovery._id }
            });
        }

        return recovery;
    }

    /**
     * Mark recovery as converted
     */
    async markConverted(recoveryId, orderValue) {
        const recovery = await Recovery.findByIdAndUpdate(
            recoveryId,
            {
                recoveryStatus: 'converted',
                convertedAt: new Date(),
                converted: true,
                recoveryValue: orderValue || recovery.cartTotal || 0
            },
            { new: true }
        );

        if (recovery) {
            await eventService.trackEvent({
                sessionId: recovery.sessionId,
                customerId: recovery.customerId,
                merchantId: recovery.merchantId,
                eventType: 'recovery_converted',
                cartTotal: orderValue || recovery.cartTotal || 0,
                metadata: {
                    recoveryId: recovery._id,
                    originalAbandonment: recovery.abandonmentReason
                }
            });

            // Also track cart restored
            await eventService.trackEvent({
                sessionId: recovery.sessionId,
                customerId: recovery.customerId,
                merchantId: recovery.merchantId,
                eventType: 'cart_restored',
                cartItems: recovery.cartItems,
                cartTotal: orderValue || recovery.cartTotal || 0
            });
        }

        return recovery;
    }

    /**
     * Get recovery statistics
     */
    async getRecoveryStats(merchantId, period = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const stats = await Recovery.aggregate([
            {
                $match: {
                    merchantId: merchantId,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    sent: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'sent'] }, 1, 0] }
                    },
                    opened: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'opened'] }, 1, 0] }
                    },
                    clicked: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'clicked'] }, 1, 0] }
                    },
                    converted: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: { $cond: [{ $eq: ['$recoveryStatus', 'converted'] }, '$recoveryValue', 0] }
                    },
                    avgRecoveryTime: {
                        $avg: {
                            $subtract: ['$convertedAt', '$createdAt']
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || {};
        return {
            totalAttempts: result.totalAttempts || 0,
            sent: result.sent || 0,
            opened: result.opened || 0,
            clicked: result.clicked || 0,
            converted: result.converted || 0,
            totalRevenue: result.totalRevenue || 0,
            avgRecoveryTime: result.avgRecoveryTime || 0,
            recoveryRate: result.totalAttempts > 0
                ? ((result.converted || 0) / result.totalAttempts) * 100
                : 0
        };
    }

    /**
     * Get recovery details
     */
    async getRecoveryDetails(merchantId, filters = {}, limit = 100, page = 1) {
        const query = { merchantId: merchantId };

        if (filters.sessionId) query.sessionId = filters.sessionId;
        if (filters.customerId) query.customerId = filters.customerId;
        if (filters.recoveryStatus) query.recoveryStatus = filters.recoveryStatus;
        if (filters.abandonmentReason) query.abandonmentReason = filters.abandonmentReason;
        if (filters.fromDate || filters.toDate) {
            query.createdAt = {};
            if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
            if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
        }

        const skip = (page - 1) * limit;

        const [recoveries, total] = await Promise.all([
            Recovery.find(query)
                .populate('customerId', 'name email username')
                .populate('eventId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Recovery.countDocuments(query)
        ]);

        return {
            data: recoveries,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}

export default new RecoveryService();