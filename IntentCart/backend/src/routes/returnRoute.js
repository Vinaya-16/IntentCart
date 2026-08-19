import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createReturn,
    getAllReturns,
    getCustomerReturns,
    getReturnById,
    updateReturnStatus,
    getReturnStats
} from '../controllers/returnController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Return routes
router.post('/', createReturn);
router.get('/', getAllReturns);
router.get('/my-returns', getCustomerReturns);  
router.get('/stats', getReturnStats);
router.get('/:id', getReturnById);
router.put('/:id/status', updateReturnStatus);

export default router;