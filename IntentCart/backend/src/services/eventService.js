import Event from '../models/Event.js';
import Recovery from '../models/Recovery.js';

class EventService {
    //  * Track an event
    async trackEvent(data) {
        try {
            const allowedEventTypes = [
                'product_viewed', 'add_to_cart', 'cart_viewed',
                'checkout_started', 'wishlist_viewed', 'payment_failed',
                'purchase_completed', 'cart_restored', 'cart_abandoned',
                'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned',
                'recovery_email_sent',
                'recovery_email_opened', 'recovery_email_clicked',
                'recovery_converted', 'order_placed', 'order_cancelled', 'coupon_applied', 'coupon_converted'
            ];

            // If the event type is NOT in the allowed list, ignore it silently.
            if (!allowedEventTypes.includes(data.eventType)) {
                // console.warn(`Ignoring unsupported event type: ${data.eventType}`);
                return null;
            }
            // ==========================================

            const event = new Event({
                sessionId: data.sessionId,
                customerId: data.customerId,
                merchantId: data.merchantId,
                eventType: data.eventType,
                productId: data.productId,
                productIds: data.productIds,
                cartItems: data.cartItems,
                cartTotal: data.cartTotal,
                abandonmentReason: data.abandonmentReason,
                recoveryStatus: data.recoveryStatus,
                metadata: data.metadata,
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                referrer: data.referrer
            });

            await event.save();

            // If this is an abandonment event, create recovery record
            if (['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'].includes(data.eventType)) {
                await this.createRecoveryRecord(event);
            }

            return event;
        } catch (error) {
            console.error('Error tracking event:', error);
            throw error;
        }
    }

    /**
     * Create recovery record for abandoned event
     */
    async createRecoveryRecord(event) {
        const recovery = new Recovery({
            sessionId: event.sessionId,
            customerId: event.customerId,
            merchantId: event.merchantId,
            eventId: event._id,
            abandonmentReason: event.abandonmentReason || 'other',
            cartItems: event.cartItems,
            cartTotal: event.cartTotal,
            recoveryStatus: 'pending'
        });

        await recovery.save();
        return recovery;
    }

    /**
     * Get events with filters
     */
    async getEvents(filters = {}, limit = 100, page = 1) {
        const query = {};

        if (filters.merchantId) query.merchantId = filters.merchantId;
        if (filters.sessionId) query.sessionId = filters.sessionId;
        if (filters.customerId) query.customerId = filters.customerId;
        if (filters.eventType) query.eventType = filters.eventType;
        if (filters.recoveryStatus) query.recoveryStatus = filters.recoveryStatus;
        if (filters.fromDate || filters.toDate) {
            query.createdAt = {};
            if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
            if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
        }

        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            Event.find(query)
                .populate('customerId', 'name email username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Event.countDocuments(query)
        ]);

        return {
            data: events,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get event statistics
     */
    async getEventStats(period = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const match = {
            createdAt: { $gte: startDate }
        };

        const stats = await Event.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {};
        stats.forEach(stat => {
            result[stat._id] = stat.count;
        });

        return result;
    }

    /**
     * Get abandonment statistics
     */
    async getAbandonmentStats(period = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const abandonmentEvents = ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'];

        const stats = await Event.aggregate([
            {
                $match: {
                    eventType: { $in: abandonmentEvents },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {};
        stats.forEach(stat => {
            result[stat._id] = stat.count;
        });

        return result;
    }

    /**
     * Get abandonment reasons distribution
     */
    async getAbandonmentReasons(period = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const stats = await Event.aggregate([
            {
                $match: {
                    eventType: { $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'] },
                    createdAt: { $gte: startDate },
                    abandonmentReason: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$abandonmentReason',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return stats;
    }

    /**
     * Get session timeline
     */
    async getSessionTimeline(sessionId) {
        const events = await Event.find({ sessionId })
            .populate('customerId', 'name email username')
            .sort({ createdAt: 1 });

        return events;
    }

    /**
     * Update event status
     */
    async updateEventStatus(eventId, updates) {
        const event = await Event.findByIdAndUpdate(
            eventId,
            { $set: updates },
            { new: true }
        );
        return event;
    }
}

export default new EventService();