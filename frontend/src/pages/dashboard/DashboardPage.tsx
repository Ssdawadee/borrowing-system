import React from 'react';
import { useEffect, useState } from 'react';
import { fetchUserStatistics } from '../../services/api';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';

const DashboardPage = () => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getStatistics = async () => {
            try {
                const data = await fetchUserStatistics();
                setStatistics(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getStatistics();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="dashboard">
            <Navbar />
            <Sidebar />
            <div className="dashboard-content">
                <h1>Dashboard</h1>
                {statistics && (
                    <div>
                        <h2>Your Statistics</h2>
                        <p>Borrowed Equipment: {statistics.borrowedEquipment}</p>
                        <p>Pending Requests: {statistics.pendingRequests}</p>
                        <p>Total Equipment: {statistics.totalEquipment}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;