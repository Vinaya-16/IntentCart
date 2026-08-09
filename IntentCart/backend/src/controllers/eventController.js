import eventService from '../services/eventService.js';
import abandonmentService from '../services/abandonmentService.js';

/**
 * Track a single event
 */
export const trackEvent = async (req, res) => {
    try {
        const {
            sessionId,
            eventType,
            productId,
            productIds,
            cartItems,
            cartTotal,
            metadata,
            url
        } = req.body;

        // Get user info from request (if authenticated)
        const customerId = req.user?._id || sessionId;

        // Validate required fields
        if (!sessionId || !eventType) {
            return res.status(400).json({
                success: false,
                message: 'Session ID and Event Type are required'
            });
        }

        // Get IP and user agent from request
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'] || req.headers['origin'];

        // Track the event
        const event = await eventService.trackEvent({
            sessionId,
            customerId,
            eventType,
            productId,
            productIds,
            cartItems,
            cartTotal,
            metadata,
            userAgent,
            ipAddress,
            referrer,
            url: url || req.headers['referer']
        });

        res.json({
            success: true,
            message: 'Event tracked successfully',
            data: event
        });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track event'
        });
    }
};

/**
 * Track multiple events at once (batch)
 */
export const trackBatchEvents = async (req, res) => {
    try {
        const { events } = req.body;

        if (!events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Events array is required'
            });
        }

        const customerId = req.user?._id || null;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'] || req.headers['origin'];

        // Track each event
        const trackedEvents = [];
        const errors = [];

        for (const eventData of events) {
            try {
                const event = await eventService.trackEvent({
                    ...eventData,
                    customerId,
                    userAgent,
                    ipAddress,
                    referrer
                });
                trackedEvents.push(event);
            } catch (err) {
                console.error('Error tracking individual event:', err);
                errors.push({
                    event: eventData,
                    error: err.message
                });
            }
        }

        res.json({
            success: true,
            message: `${trackedEvents.length} events tracked successfully`,
            data: trackedEvents,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error tracking batch events:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to track events'
        });
    }
};

/**
 * Get session timeline
 */
export const getSessionTimeline = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const events = await eventService.getSessionTimeline(sessionId);

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error getting session timeline:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get session timeline'
        });
    }
};

/**
 * Get abandonment reasons for a session
 */
export const getSessionAbandonmentReasons = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const events = await eventService.getSessionTimeline(sessionId);
        const reason = abandonmentService.predictReason(events);

        res.json({
            success: true,
            data: {
                reason,
                events: events.length
            }
        });
    } catch (error) {
        console.error('Error getting session abandonment reasons:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get abandonment reasons'
        });
    }
};