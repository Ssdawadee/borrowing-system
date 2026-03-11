import { Router } from 'express';
import { 
  getAllEquipment, 
  getEquipmentById, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment 
} from './equipment.controller';

const router = Router();

// Route to get all equipment
router.get('/', getAllEquipment);

// Route to get equipment by ID
router.get('/:id', getEquipmentById);

// Route to create new equipment
router.post('/', createEquipment);

// Route to update equipment by ID
router.put('/:id', updateEquipment);

// Route to delete equipment by ID
router.delete('/:id', deleteEquipment);

export default router;