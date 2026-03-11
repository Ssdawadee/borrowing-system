/// <reference path="./express.d.ts" />
import cors from 'cors';
import express from 'express';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import errorMiddleware from './middleware/errorMiddleware';
import routes from './routes';

const app = express();

const allowedOrigins = config.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.json({
        name: 'University Club Equipment Borrowing System API',
        status: 'running',
    });
});

app.use('/api', routes);
app.use(errorMiddleware);

const start = async () => {
    await initializeDatabase();

    app.listen(config.PORT, () => {
        console.log(`Backend running on http://localhost:${config.PORT}`);
    });
};

start().catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
});