import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Equipment } from '../../types';
import { fetchEquipmentList } from '../../services/equipmentService';
import './EquipmentListPage.css';

const EquipmentListPage: React.FC = () => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEquipment = async () => {
            try {
                const data = await fetchEquipmentList();
                setEquipmentList(data);
            } catch (err) {
                setError('Failed to load equipment list.');
            } finally {
                setLoading(false);
            }
        };

        loadEquipment();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="equipment-list">
            <h1>Available Equipment</h1>
            <ul>
                {equipmentList.map((equipment) => (
                    <li key={equipment.id}>
                        <Link to={`/equipment/${equipment.id}`}>
                            {equipment.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EquipmentListPage;