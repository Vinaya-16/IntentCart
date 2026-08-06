import express from 'express';
import {
    getProductBySlug,
    getRelatedProducts,
    getProductReviews
} from '../controllers/productController.js';

const router = express.Router();

// Product routes
router.get('/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id/reviews', getProductReviews);

export default router;