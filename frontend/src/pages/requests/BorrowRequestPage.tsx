import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { Button } from '../../components/ui/Button';
import './BorrowRequestPage.css';

const BorrowRequestPage = () => {
    const [equipmentId, setEquipmentId] = useState('');
    const [borrowDate, setBorrowDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [message, setMessage] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await requestService.createBorrowRequest({ equipmentId, borrowDate, returnDate });
            setMessage('Borrow request submitted successfully!');
            history.push('/requests/my-requests');
        } catch (error) {
            setMessage('Failed to submit borrow request. Please try again.');
        }
    };

    return (
        <div className="borrow-request-page">
            <h1>Borrow Equipment</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="equipmentId">Equipment ID:</label>
                    <input
                        type="text"
                        id="equipmentId"
                        value={equipmentId}
                        onChange={(e) => setEquipmentId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="borrowDate">Borrow Date:</label>
                    <input
                        type="date"
                        id="borrowDate"
                        value={borrowDate}
                        onChange={(e) => setBorrowDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="returnDate">Return Date:</label>
                    <input
                        type="date"
                        id="returnDate"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit">Submit Request</Button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default BorrowRequestPage;