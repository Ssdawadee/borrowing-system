import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types';
import { config } from '../config/env';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded as AuthenticatedUser;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

export default authMiddleware;