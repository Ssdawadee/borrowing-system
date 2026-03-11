import { Router } from 'express';
import { createAuditLog, getAuditLogs } from './auditLogs.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Route to create a new audit log
router.post('/', authenticate, createAuditLog);

// Route to get all audit logs
router.get('/', authenticate, getAuditLogs);

export default router;