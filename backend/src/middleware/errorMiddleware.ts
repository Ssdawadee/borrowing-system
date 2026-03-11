import { Request, Response, NextFunction } from 'express';

const errorMiddleware = (err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        message,
        statusCode,
    });
};

export default errorMiddleware;