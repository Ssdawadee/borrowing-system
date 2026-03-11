import { Router } from 'express';
import { createBorrowRequest, getBorrowRequests, updateBorrowRequest, deleteBorrowRequest } from './borrowRequests.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Route to create a new borrow request
router.post('/', authenticate, createBorrowRequest);

// Route to get all borrow requests (admin only)
router.get('/', authenticate, getBorrowRequests);

// Route to update a borrow request
router.put('/:id', authenticate, updateBorrowRequest);

// Route to delete a borrow request
router.delete('/:id', authenticate, deleteBorrowRequest);

export default router;