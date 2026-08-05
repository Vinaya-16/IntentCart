import express from 'express';
import {
  getTopCategories,
  getAllCategories,
  getCategoryBySlug,
  getCategoryByPath 
} from '../controllers/categoryController.js';

const router = express.Router();

// Public category routes
router.get('/categories/top', getTopCategories);
router.get('/categories', getAllCategories);
router.get('/categories/:slug', getCategoryBySlug);
router.get('/categories/path/:path(*)', getCategoryByPath);

export default router;