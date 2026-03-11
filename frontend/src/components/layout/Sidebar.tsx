import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <h2>University Club Equipment</h2>
            <ul>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link to="/equipment">Equipment</Link>
                </li>
                <li>
                    <Link to="/requests">My Requests</Link>
                </li>
                <li>
                    <Link to="/admin/users">User Management</Link>
                </li>
                <li>
                    <Link to="/admin/inventory">Inventory Management</Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;