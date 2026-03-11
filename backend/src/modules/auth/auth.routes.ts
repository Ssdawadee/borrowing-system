import { Router } from 'express';
import { register, login, logout } from './auth.controller';

const router = Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for user logout
router.post('/logout', logout);

export default router;