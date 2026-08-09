import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    trackEvent,
    trackBatchEvents,
    getSessionTimeline,
    getSessionAbandonmentReasons
} from '../controllers/eventController.js';

const router = express.Router();

// Public event tracking (no auth required)
router.post('/track', protect, trackEvent);
router.post('/track-batch', protect, trackBatchEvents);

// Protected routes
router.get('/session/:sessionId', protect, getSessionTimeline);
router.get('/session/:sessionId/abandonment', protect, getSessionAbandonmentReasons);

export default router;