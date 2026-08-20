// Event tracking utility for customer panel
const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

class EventTracker {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.events = [];
        this.batchSize = 10;
        this.batchTimeout = null;
        this.isTracking = true;
        this.trackedPage = '';
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('tracking_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('tracking_session_id', sessionId);
        }
        return sessionId;
    }

    getCurrentUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    }

    getToken() {
        return localStorage.getItem('token');
    }

    async trackEvent(eventData) {
        if (!this.isTracking) return;

        const user = this.getCurrentUser();
        const token = this.getToken();

        const event = {
            sessionId: this.sessionId,
            customerId: user?._id || null,
            eventType: eventData.eventType,
            productId: eventData.productId || null,
            productIds: eventData.productIds || [],
            cartItems: eventData.cartItems || [],
            cartTotal: eventData.cartTotal || 0,
            metadata: eventData.metadata || {},
            url: window.location.href,
            referrer: document.referrer || null
        };

        this.events.push(event);

        if (this.events.length >= this.batchSize) {
            await this.flushEvents();
        } else {
            this.scheduleBatch();
        }

        // Critical events send immediately
        if (['purchase_completed', 'payment_failed', 'checkout_started'].includes(eventData.eventType)) {
            await this.sendEvents([event]);
        }

        return event;
    }

    scheduleBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        this.batchTimeout = setTimeout(() => {
            this.flushEvents();
        }, 3000);
    }

    async flushEvents() {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = [];

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        await this.sendEvents(eventsToSend);
    }

    async sendEvents(events) {
        try {
            const token = this.getToken();
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/events/track-batch`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ events })
            });

            if (!response.ok) {
                console.error('Failed to send events:', response.status);
            }
        } catch (error) {
            console.error('Error sending events:', error);
            this.events = [...events, ...this.events];
        }
    }

    // ==================== TRACKING METHODS ====================

    trackPageView(page, title) {
        // Avoid duplicate page view tracking
        const pageKey = `${page}-${title}`;
        if (this.trackedPage === pageKey) return;
        this.trackedPage = pageKey;

        return this.trackEvent({
            eventType: 'page_view',
            metadata: {
                page,
                title: title || document.title
            }
        });
    }

    trackProductView(productId, productData = {}) {
        return this.trackEvent({
            eventType: 'product_viewed',
            productId,
            metadata: {
                productName: productData.name,
                productPrice: productData.price,
                category: productData.category
            }
        });
    }

    trackProductSearch(query, results) {
        return this.trackEvent({
            eventType: 'product_search',
            metadata: {
                query,
                resultCount: results?.length || 0
            }
        });
    }

    trackCartView(cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'cart_viewed',
            cartItems,
            cartTotal
        });
    }

    trackAddToCart(productId, productData, cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'add_to_cart',
            productId,
            cartItems,
            cartTotal,
            metadata: {
                productName: productData.name,
                productPrice: productData.price,
                quantity: productData.quantity || 1
            }
        });
    }

    trackRemoveFromCart(productId, productData, cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'remove_from_cart',
            productId,
            cartItems,
            cartTotal,
            metadata: {
                productName: productData.name,
                productPrice: productData.price
            }
        });
    }

    trackCheckoutStart(cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'checkout_started',
            cartItems,
            cartTotal,
            metadata: {
                itemCount: cartItems?.length || 0
            }
        });
    }

    trackCheckoutView(cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'checkout_viewed',
            cartItems,
            cartTotal
        });
    }

    trackPaymentSuccess(orderId, cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'payment_success',
            cartItems,
            cartTotal,
            metadata: {
                orderId,
                timestamp: new Date().toISOString()
            }
        });
    }

    trackPaymentFailed(error, cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'payment_failed',
            cartItems,
            cartTotal,
            metadata: {
                error: error?.message || 'Payment failed',
                timestamp: new Date().toISOString()
            }
        });
    }

    trackPurchaseCompleted(orderId, cartItems, cartTotal) {
        return this.trackEvent({
            eventType: 'purchase_completed',
            cartItems,
            cartTotal,
            metadata: {
                orderId,
                timestamp: new Date().toISOString()
            }
        });
    }

    trackWishlistView(items) {
        return this.trackEvent({
            eventType: 'wishlist_viewed',
            productIds: items?.map(item => item.productId || item._id) || [],
            metadata: {
                itemCount: items?.length || 0
            }
        });
    }

    trackWishlistAdd(productId, productData) {
        return this.trackEvent({
            eventType: 'wishlist_added',
            productId,
            metadata: {
                productName: productData.name,
                productPrice: productData.price
            }
        });
    }

    trackWishlistRemove(productId, productData) {
        return this.trackEvent({
            eventType: 'wishlist_removed',
            productId,
            metadata: {
                productName: productData.name,
                productPrice: productData.price
            }
        });
    }

    trackCategoryView(categoryId, categoryName) {
        return this.trackEvent({
            eventType: 'category_viewed',
            metadata: {
                categoryId,
                categoryName
            }
        });
    }

    trackHomepageView() {
        return this.trackEvent({
            eventType: 'homepage_viewed',
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    }

    trackTabHidden() {
        return this.trackEvent({
            eventType: 'tab_hidden'
        });
    }

    trackTabVisible() {
        return this.trackEvent({
            eventType: 'tab_visible'
        });
    }

    trackUserLogin(user) {
        return this.trackEvent({
            eventType: 'user_login',
            metadata: {
                userId: user?._id,
                email: user?.email
            }
        });
    }

    trackUserLogout() {
        return this.trackEvent({
            eventType: 'user_logout'
        });
    }

    trackOrderSuccessView(orderId, total) {
        return this.trackEvent({
            eventType: 'order_success_viewed',
            metadata: {
                orderId,
                total
            }
        });
    }

    stopTracking() {
        this.isTracking = false;
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        this.flushEvents();
    }

    resumeTracking() {
        this.isTracking = true;
    }
}

// Create singleton instance
const eventTracker = new EventTracker();

// Auto-track page views and tab visibility
if (typeof window !== 'undefined') {
    // Track initial page view
    eventTracker.trackPageView(window.location.pathname, document.title);

    // Track SPA navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(() => {
            eventTracker.trackPageView(window.location.pathname, document.title);
        }, 100);
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        setTimeout(() => {
            eventTracker.trackPageView(window.location.pathname, document.title);
        }, 100);
    };

    // Track popstate (back/forward)
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            eventTracker.trackPageView(window.location.pathname, document.title);
        }, 100);
    });

    // Flush events on unload
    window.addEventListener('beforeunload', () => {
        eventTracker.flushEvents();
    });

    // Track tab visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            eventTracker.trackTabHidden();
        } else {
            eventTracker.trackTabVisible();
        }
    });
}

export default eventTracker;