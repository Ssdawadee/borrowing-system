import { Request, Response } from 'express';
import EquipmentService from './equipment.service';

class EquipmentController {
    async getAllEquipment(req: Request, res: Response) {
        try {
            const equipment = await EquipmentService.getAllEquipment();
            res.status(200).json(equipment);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving equipment', error });
        }
    }

    async getEquipmentById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const equipment = await EquipmentService.getEquipmentById(id);
            if (!equipment) {
                return res.status(404).json({ message: 'Equipment not found' });
            }
            res.status(200).json(equipment);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving equipment', error });
        }
    }

    async createEquipment(req: Request, res: Response) {
        try {
            const newEquipment = await EquipmentService.createEquipment(req.body);
            res.status(201).json(newEquipment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating equipment', error });
        }
    }

    async updateEquipment(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const updatedEquipment = await EquipmentService.updateEquipment(id, req.body);
            if (!updatedEquipment) {
                return res.status(404).json({ message: 'Equipment not found' });
            }
            res.status(200).json(updatedEquipment);
        } catch (error) {
            res.status(500).json({ message: 'Error updating equipment', error });
        }
    }

    async deleteEquipment(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const deleted = await EquipmentService.deleteEquipment(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Equipment not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting equipment', error });
        }
    }
}

export default new EquipmentController();