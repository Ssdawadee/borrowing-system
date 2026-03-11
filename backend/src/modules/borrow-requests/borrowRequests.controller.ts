import { Request, Response } from 'express';
import { BorrowRequestService } from './borrowRequests.service';

const borrowRequestService = new BorrowRequestService();

export const createBorrowRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { equipment_id, due_date, borrow_reason } = req.body;

        if (!equipment_id || !due_date) {
            res.status(400).json({ message: 'Missing required fields: equipment_id, due_date' });
            return;
        }

        const newRequest = await borrowRequestService.createBorrowRequest({
            user_id: user.id,
            equipment_id,
            due_date,
            borrow_reason,
        });

        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error creating borrow request', error });
    }
};

export const getBorrowRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await borrowRequestService.getBorrowRequests();
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching borrow requests', error });
    }
};

export const getBorrowRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const request = await borrowRequestService.getBorrowRequestById(Number(id));
        if (request) {
            res.status(200).json(request);
        } else {
            res.status(404).json({ message: 'Borrow request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching borrow request', error });
    }
};

export const updateBorrowRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updatedRequest = await borrowRequestService.updateBorrowRequest(Number(id), updatedData);
        if (updatedRequest) {
            res.status(200).json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Borrow request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating borrow request', error });
    }
};

export const deleteBorrowRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await borrowRequestService.deleteBorrowRequest(Number(id));
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Borrow request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting borrow request', error });
    }
};