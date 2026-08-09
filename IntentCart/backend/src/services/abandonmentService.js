import Event from '../models/Event.js';
import eventService from './eventService.js';
import { triggerRecoveryNotification } from '../controllers/customerNotificationController.js';

class AbandonmentService {
    /**
     * Detect cart abandonments
     */
    async detectAbandonments() {
        const results = {
            cartIdle: 0,
            checkoutAbandoned: 0,
            wishlistToCart: 0,
            productObsession: 0,
            total: 0,
            details: []
        };

        try {
            // Get all active sessions with add_to_cart events
            const sessions = await this.getActiveSessions();

            for (const session of sessions) {
                const events = await Event.find({
                    sessionId: session.sessionId
                }).sort({ createdAt: 1 });

                if (events.length === 0) continue;

                // Check each abandonment pattern
                const abandonment = await this.analyzeSession(events);

                if (abandonment) {
                    // 1. Create the abandonment event in your Events collection
                    await eventService.trackEvent({
                        sessionId: session.sessionId,
                        customerId: session.customerId,
                        eventType: abandonment.eventType,
                        abandonmentReason: abandonment.reason,
                        cartItems: abandonment.cartItems || [],
                        cartTotal: abandonment.cartTotal || 0,
                        metadata: abandonment.metadata
                    });

                    // 2. TRIGGER THE CUSTOMER NOTIFICATION HERE
                    // We only send if we have a valid customerId (not null)
                    if (session.customerId) {
                        await triggerRecoveryNotification(
                            session.customerId,
                            abandonment.cartItems,
                            abandonment.cartTotal,
                            session.sessionId
                        );
                    } else {
                        alert(`Skipping notification: No customerId linked to session ${session.sessionId}`);
                    }

                    results[abandonment.reason] = (results[abandonment.reason] || 0) + 1;
                    results.total++;
                    results.details.push(abandonment);
                }
            }

            return results;
        } catch (error) {
            console.error('Error detecting abandonments:', error);
            throw error;
        }
    }

    /**
     * Get active sessions with add_to_cart
     */
    async getActiveSessions() {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const sessions = await Event.aggregate([
            {
                $match: {
                    eventType: 'add_to_cart',
                    createdAt: { $gte: twentyFourHoursAgo }
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    customerId: { $first: '$customerId' },
                    lastEvent: { $max: '$createdAt' },
                    events: { $push: '$$ROOT' }
                }
            },
            {
                $match: {
                    lastEvent: { $gte: twentyFourHoursAgo }
                }
            }
        ]);

        return sessions.map(s => ({
            sessionId: s._id,
            customerId: s.customerId,
            lastEvent: s.lastEvent
        }));
    }

    /**
     * Analyze session for abandonment patterns
     */
    /**
     * Analyze session for abandonment patterns
     */
    async analyzeSession(events) {
        const lastEvent = events[events.length - 1];

        // Check if purchase completed
        const hasPurchase = events.some(e => e.eventType === 'purchase_completed');
        if (hasPurchase) return null;

        // Check if add_to_cart exists
        const hasAddToCart = events.some(e => e.eventType === 'add_to_cart');
        if (!hasAddToCart) return null;

        // Check patterns
        const now = new Date();
        const lastEventTime = new Date(lastEvent.createdAt);
        const hoursSinceLastEvent = (now - lastEventTime) / (1000 * 60 * 60);

        // --- HELPER: Find the event with the actual items ---
        const findCartWithItems = () => {
            // 1. Prefer checkout_started (it has the final cart)
            const checkout = events.find(e => e.eventType === 'checkout_started' && e.cartItems && e.cartItems.length > 0);
            if (checkout) return checkout;
            // 2. Fallback to original add_to_cart
            const cart = events.find(e => e.eventType === 'add_to_cart' && e.cartItems && e.cartItems.length > 0);
            if (cart) return cart;
            // 3. Final fallback to last event
            return lastEvent;
        };
        const cartWithItems = findCartWithItems();

        // Pattern 1: Cart Idle (30 minutes)
        if (hoursSinceLastEvent > 0.5 && ['cart_viewed', 'add_to_cart'].includes(lastEvent.eventType)) {
            return {
                reason: 'cart_aged',
                eventType: 'cart_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: {
                    hoursSinceLastEvent,
                    lastEventType: lastEvent.eventType
                }
            };
        }

        // Pattern 2: Checkout Abandoned (30 minutes)
        const hasCheckoutStart = events.some(e => e.eventType === 'checkout_started');
        const hasPaymentFailed = events.some(e => e.eventType === 'payment_failed');
        const hasCheckoutView = events.some(e => e.eventType === 'checkout_viewed');

        if (hasCheckoutStart && !hasPurchase && (hasPaymentFailed || hoursSinceLastEvent > 0.5)) {
            return {
                reason: hasPaymentFailed ? 'payment_issue' : 'checkout_complex',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: {
                    hasPaymentFailed,
                    hasCheckoutView,
                    hoursSinceLastEvent
                }
            };
        }

        // Pattern 3: High product views (5+ times)
        const productViews = events.filter(e => e.eventType === 'product_viewed');
        if (productViews.length >= 5) {
            const productIds = [...new Set(productViews.map(e => e.productId?.toString()))];
            if (productIds.length > 0) {
                return {
                    reason: 'high_interest_no_purchase',
                    eventType: 'product_abandoned',
                    cartItems: [],
                    cartTotal: 0,
                    metadata: {
                        productViews: productViews.length,
                        uniqueProducts: productIds.length,
                        productIds
                    }
                };
            }
        }

        // Pattern 4: Wishlist to Cart (30 minutes)
        const hasWishlistView = events.some(e => e.eventType === 'wishlist_viewed');
        if (hasWishlistView && hasAddToCart && hoursSinceLastEvent > 0.5) {
            return {
                reason: 'wishlist_abandoned',
                eventType: 'wishlist_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: {
                    hasWishlistView,
                    hoursSinceLastEvent
                }
            };
        }

        return null;
    }

    /**
     * Predict abandonment reason based on event patterns
     */
    predictReason(events) {
        const reasons = [];
        const lastEvent = events[events.length - 1];

        // Check for payment issues
        if (events.some(e => e.eventType === 'payment_failed')) {
            reasons.push('payment_issue');
        }

        // Check for shipping cost concerns
        const cartEvents = events.filter(e => e.eventType === 'cart_viewed' || e.eventType === 'checkout_viewed');
        if (cartEvents.length >= 2) {
            const firstTotal = cartEvents[0].cartTotal || 0;
            const lastTotal = cartEvents[cartEvents.length - 1].cartTotal || 0;
            if (firstTotal > lastTotal && lastTotal > 0) {
                reasons.push('shipping_costs');
            }
        }

        // Check for price concerns
        if (events.some(e => e.eventType === 'add_to_cart' && e.metadata?.get('priceChecked'))) {
            reasons.push('high_price');
        }

        // Check for comparing products
        const productViews = events.filter(e => e.eventType === 'product_viewed');
        if (productViews.length >= 3) {
            const uniqueProducts = new Set(productViews.map(e => e.productId?.toString()));
            if (uniqueProducts.size >= 2) {
                reasons.push('comparing_products');
            }
        }

        // Check for waiting for discount
        const viewDays = new Set(events.map(e => new Date(e.createdAt).toDateString()));
        if (viewDays.size >= 3) {
            reasons.push('waiting_for_discount');
        }

        // Default reason
        if (reasons.length === 0) {
            reasons.push('other');
        }

        return reasons[0];
    }
}

export default new AbandonmentService();