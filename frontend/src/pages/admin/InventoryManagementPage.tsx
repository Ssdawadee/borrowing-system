import React, { useEffect, useState } from 'react';
import { fetchInventory, deleteEquipment } from '../../services/equipmentService';
import { Equipment } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const InventoryManagementPage: React.FC = () => {
    const [inventory, setInventory] = useState<Equipment[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadInventory = async () => {
            const data = await fetchInventory();
            setInventory(data);
        };
        loadInventory();
    }, []);

    const handleDelete = async (id: string) => {
        await deleteEquipment(id);
        setInventory(inventory.filter(item => item.id !== id));
    };

    const openModal = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEquipment(null);
    };

    return (
        <div>
            <h1>Inventory Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map(item => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.description}</td>
                            <td>
                                <Button onClick={() => openModal(item)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && selectedEquipment && (
                <Modal onClose={closeModal}>
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete {selectedEquipment.name}?</p>
                    <Button onClick={() => handleDelete(selectedEquipment.id)}>Yes, Delete</Button>
                    <Button onClick={closeModal}>Cancel</Button>
                </Modal>
            )}
        </div>
    );
};

export default InventoryManagementPage;