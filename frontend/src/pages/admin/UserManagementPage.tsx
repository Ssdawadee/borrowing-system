import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { fetchUsers, deleteUser } from '../../services/authService';
import { Button } from '../../components/ui/Modal';

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const fetchedUsers = await fetchUsers();
                setUsers(fetchedUsers);
            } catch (err) {
                setError('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        try {
            await deleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>User Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <Button onClick={() => handleDelete(user.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementPage;