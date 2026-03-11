import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

const roleMiddleware = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(403).json({ message: 'Access denied. No role provided.' });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
        }

        next();
    };
};

export default roleMiddleware;