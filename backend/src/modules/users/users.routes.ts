import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from './users.controller';
import { validateUser } from './users.middleware';

const router = Router();

// Route to get all users
router.get('/', getAllUsers);

// Route to get a user by ID
router.get('/:id', getUserById);

// Route to create a new user
router.post('/', validateUser, createUser);

// Route to update a user by ID
router.put('/:id', validateUser, updateUser);

// Route to delete a user by ID
router.delete('/:id', deleteUser);

export default router;