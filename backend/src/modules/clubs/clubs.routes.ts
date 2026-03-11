import { Router } from 'express';
import { 
  createClub, 
  getClubs, 
  getClubById, 
  updateClub, 
  deleteClub 
} from './clubs.controller';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

// Route to create a new club
router.post('/', authenticate, authorize('admin'), createClub);

// Route to get all clubs
router.get('/', getClubs);

// Route to get a club by ID
router.get('/:id', getClubById);

// Route to update a club by ID
router.put('/:id', authenticate, authorize('admin'), updateClub);

// Route to delete a club by ID
router.delete('/:id', authenticate, authorize('admin'), deleteClub);

export default router;