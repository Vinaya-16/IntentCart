import Event from '../models/Event.js';
import eventService from './eventService.js';
import { triggerRecoveryNotification } from '../controllers/customerNotificationController.js';

class AbandonmentService {
    // Detect cart abandonments
    async detectAbandonments(merchantId) {
        const results = {
            cartIdle: 0,
            checkoutAbandoned: 0,
            wishlistAbandoned: 0,
            productObsession: 0,
            total: 0,
            details: []
        };

        try {
            // Get all active sessions with add_to_cart events
            const sessions = await this.getActiveSessions(merchantId);

            for (const session of sessions) {
                const events = await Event.find({
                    sessionId: session.sessionId,
                    merchantId: merchantId
                }).sort({ createdAt: 1 });

                if (events.length === 0) continue;

                // Check each abandonment pattern
                const abandonment = await this.analyzeSession(events);

                if (abandonment) {
                    // Check for duplicates
                    const existingAbandonment = await Event.findOne({
                        sessionId: session.sessionId,
                        merchantId: merchantId,
                        eventType: { $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned'] }
                    });

                    if (existingAbandonment) {
                        // console.log(`⏭Skipping duplicate for session ${session.sessionId}`);
                        continue;
                    }

                    // 1. Create the abandonment event
                    await eventService.trackEvent({
                        sessionId: session.sessionId,
                        customerId: session.customerId,
                        merchantId: merchantId,
                        eventType: abandonment.eventType,
                        abandonmentReason: abandonment.reason,
                        cartItems: abandonment.cartItems || [],
                        cartTotal: abandonment.cartTotal || 0,
                        metadata: abandonment.metadata
                    });

                    // 2. Trigger notification if customer exists
                    if (session.customerId) {
                        await triggerRecoveryNotification(
                            session.customerId,
                            abandonment.cartItems,
                            abandonment.cartTotal,
                            session.sessionId
                        );
                    } else {
                        console.log(`Skipping notification: No customerId linked to session ${session.sessionId}`);
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
    async getActiveSessions(merchantId) {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const sessions = await Event.aggregate([
            {
                $match: {
                    eventType: 'add_to_cart',
                    merchantId: merchantId,
                    createdAt: { $gte: twentyFourHoursAgo }
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    customerId: { $first: '$customerId' },
                    lastEvent: { $max: '$createdAt' }
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
    async analyzeSession(events) {
        const lastEvent = events[events.length - 1];

        // Check if purchase completed
        const hasPurchase = events.some(e => e.eventType === 'purchase_completed');
        if (hasPurchase) return null;

        // Check if add_to_cart exists
        const hasAddToCart = events.some(e => e.eventType === 'add_to_cart');
        const hasCheckoutStart = events.some(e => e.eventType === 'checkout_started');

        // Check patterns
        const now = new Date();
        const lastEventTime = new Date(lastEvent.createdAt);
        const hoursSinceLastEvent = (now - lastEventTime) / (1000 * 60 * 60);

        // --- HELPER: Find the event with the actual items ---
        const findCartWithItems = () => {
            const checkout = events.find(e => e.eventType === 'checkout_started' && e.cartItems && e.cartItems.length > 0);
            if (checkout) return checkout;
            const cart = events.find(e => e.eventType === 'add_to_cart' && e.cartItems && e.cartItems.length > 0);
            if (cart) return cart;
            return { cartItems: [], cartTotal: 0 };
        };
        const cartWithItems = findCartWithItems();

        const productViews = events.filter(e => e.eventType === 'product_viewed');
        const hasWishlistView = events.some(e => e.eventType === 'wishlist_viewed');

        // Pattern 1: Cart Idle (Inactive for more than 5 minutes)
        if (hoursSinceLastEvent > 0.083) {
            return {
                reason: 'cart_aged',
                eventType: 'cart_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hoursSinceLastEvent }
            };
        }

        // Pattern 2: Checkout Abandoned
        if (hasCheckoutStart && !hasPurchase && hoursSinceLastEvent > 0.083) {
            return {
                reason: 'checkout_complex',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hoursSinceLastEvent }
            };
        }

        // Pattern 3: Product Obsession (Viewed 5+ times)
        if (productViews.length >= 5) {
            return {
                reason: 'high_interest_no_purchase',
                eventType: 'product_abandoned',
                cartItems: [],
                cartTotal: 0,
                metadata: { productViews: productViews.length }
            };
        }

        // Pattern 4: Wishlist to Cart
        if (hasWishlistView && hasAddToCart && hoursSinceLastEvent > 0.083) {
            return {
                reason: 'wishlist_abandoned',
                eventType: 'wishlist_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hasWishlistView }
            };
        }

        // 1. JUST BROWSING
        if (productViews.length <= 2 && !hasAddToCart) {
            return {
                reason: 'just_browsing',
                eventType: 'cart_abandoned',
                cartItems: [],
                cartTotal: 0,
                metadata: { views: productViews.length }
            };
        }

        // 2. COMPARING PRODUCTS
        const uniqueProducts = new Set(productViews.map(e => e.productId?.toString()));
        if (uniqueProducts.size >= 3 && !hasAddToCart) {
            return {
                reason: 'comparing_products',
                eventType: 'cart_abandoned',
                cartItems: [],
                cartTotal: 0,
                metadata: { uniqueProducts: uniqueProducts.size }
            };
        }

        // 3. WAITING FOR DISCOUNT
        const viewDays = new Set(events.map(e => new Date(e.createdAt).toDateString()));
        if (viewDays.size >= 3 && !hasAddToCart) {
            return {
                reason: 'waiting_for_discount',
                eventType: 'cart_abandoned',
                cartItems: [],
                cartTotal: 0,
                metadata: { daysVisited: viewDays.size }
            };
        }

        // 4. HIGH PRICE
        const hasCartView = events.some(e => e.eventType === 'cart_viewed');
        if (hasAddToCart && hasCartView && cartWithItems.cartTotal > 5000) {
            return {
                reason: 'high_price',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { cartTotal: cartWithItems.cartTotal }
            };
        }

        // 5. SHIPPING COSTS
        if (hasAddToCart && hasCheckoutStart) {
            return {
                reason: 'shipping_costs',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hasCheckoutStart: true }
            };
        }

        // 6. PAYMENT ISSUE
        const hasPaymentFailed = events.some(e => e.eventType === 'payment_failed');
        if (hasPaymentFailed) {
            return {
                reason: 'payment_issue',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hasPaymentFailed: true }
            };
        }

        // 7. ACCOUNT CREATION
        const hasAccountView = events.some(e => e.eventType === 'account_viewed');
        if (hasAddToCart && hasAccountView && !hasCheckoutStart) {
            return {
                reason: 'account_creation',
                eventType: 'cart_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hasAccountView: true }
            };
        }

        // 8. TECHNICAL ISSUE
        const hasErrorEvent = events.some(e => e.eventType === 'checkout_error' || e.eventType === 'cart_error');
        if (hasErrorEvent) {
            return {
                reason: 'technical_issue',
                eventType: 'checkout_abandoned',
                cartItems: cartWithItems.cartItems || [],
                cartTotal: cartWithItems.cartTotal || 0,
                metadata: { hasErrorEvent: true }
            };
        }

        return null;
    }

    //  * Predict abandonment reason based on event patterns
    predictReason(events) {
        const reasons = [];
        const lastEvent = events[events.length - 1];

        if (events.some(e => e.eventType === 'payment_failed')) {
            reasons.push('payment_issue');
        }

        const cartEvents = events.filter(e => e.eventType === 'cart_viewed' || e.eventType === 'checkout_viewed');
        if (cartEvents.length >= 2) {
            const firstTotal = cartEvents[0].cartTotal || 0;
            const lastTotal = cartEvents[cartEvents.length - 1].cartTotal || 0;
            if (firstTotal > lastTotal && lastTotal > 0) {
                reasons.push('shipping_costs');
            }
        }

        if (events.some(e => e.eventType === 'add_to_cart' && e.metadata?.get('priceChecked'))) {
            reasons.push('high_price');
        }

        const productViews = events.filter(e => e.eventType === 'product_viewed');
        if (productViews.length >= 3) {
            const uniqueProducts = new Set(productViews.map(e => e.productId?.toString()));
            if (uniqueProducts.size >= 2) {
                reasons.push('comparing_products');
            }
        }

        const viewDays = new Set(events.map(e => new Date(e.createdAt).toDateString()));
        if (viewDays.size >= 3) {
            reasons.push('waiting_for_discount');
        }

        if (reasons.length === 0) {
            reasons.push('other');
        }

        return reasons[0];
    }
}

export default new AbandonmentService();