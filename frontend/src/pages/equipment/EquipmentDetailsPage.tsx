import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { equipmentService } from '../../services/equipmentService';
import { Equipment } from '../../types';

const EquipmentDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEquipmentDetails = async () => {
            try {
                const data = await equipmentService.getEquipmentById(id);
                setEquipment(data);
            } catch (err) {
                setError('Failed to fetch equipment details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEquipmentDetails();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!equipment) {
        return <div>No equipment found.</div>;
    }

    return (
        <div>
            <h1>{equipment.name}</h1>
            <p>{equipment.description}</p>
            <p>Available Quantity: {equipment.availableQuantity}</p>
            <p>Category: {equipment.category}</p>
            <button onClick={() => {/* Logic to borrow equipment */}}>Borrow Equipment</button>
        </div>
    );
};

export default EquipmentDetailsPage;