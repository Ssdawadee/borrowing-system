import React, { useEffect, useState } from 'react';
import { fetchMyRequests } from '../../services/requestService';
import { Request } from '../../types';

const MyRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getRequests = async () => {
            try {
                const data = await fetchMyRequests();
                setRequests(data);
            } catch (err) {
                setError('Failed to fetch requests');
            } finally {
                setLoading(false);
            }
        };

        getRequests();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>My Borrow Requests</h1>
            {requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <ul>
                    {requests.map((request) => (
                        <li key={request.id}>
                            <h2>{request.equipmentName}</h2>
                            <p>Status: {request.status}</p>
                            <p>Requested on: {new Date(request.requestedAt).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyRequestsPage;