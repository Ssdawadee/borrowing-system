import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">University Club Equipment Borrowing System</Link>
            </div>
            <div className="navbar-menu">
                <ul className="navbar-items">
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
                        <Link to="/auth/login">Login</Link>
                    </li>
                    <li>
                        <Link to="/auth/register">Register</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;