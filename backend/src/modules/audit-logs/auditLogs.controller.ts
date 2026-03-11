import { Request, Response } from 'express';
import { AuditLogService } from './auditLogs.service';

class AuditLogsController {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    public async getAllLogs(req: Request, res: Response): Promise<void> {
        try {
            const logs = await this.auditLogService.getAllLogs();
            res.status(200).json(logs);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving audit logs', error });
        }
    }

    public async createLog(req: Request, res: Response): Promise<void> {
        try {
            const logData = req.body;
            const newLog = await this.auditLogService.createLog(logData);
            res.status(201).json(newLog);
        } catch (error) {
            res.status(500).json({ message: 'Error creating audit log', error });
        }
    }

    public async deleteLog(req: Request, res: Response): Promise<void> {
        try {
            const logId = req.params.id;
            await this.auditLogService.deleteLog(logId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting audit log', error });
        }
    }
}

export const auditLogsController = new AuditLogsController();