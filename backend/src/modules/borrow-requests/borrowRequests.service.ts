import { getDatabase } from '../../config/database';

export interface BorrowRequest {
    id: number;
    user_id: number;
    equipment_id: number;
    borrow_date: string;
    due_date: string;
    return_date: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    return_confirmed_at: string | null;
    borrow_reason: string | null;
    status: string;
}

export class BorrowRequestService {
    async createBorrowRequest(data: {
        user_id: number;
        equipment_id: number;
        due_date: string;
        borrow_reason?: string;
    }): Promise<BorrowRequest> {
        const db = getDatabase();
        const result = await db.run(
            `INSERT INTO borrows (user_id, equipment_id, borrow_date, due_date, borrow_reason, status)
             VALUES (?, ?, datetime('now'), ?, ?, 'PENDING')`,
            [data.user_id, data.equipment_id, data.due_date, data.borrow_reason || null]
        );
        
        return this.getBorrowRequestById(result.lastID);
    }

    async getBorrowRequests(): Promise<BorrowRequest[]> {
        const db = getDatabase();
        return db.all<BorrowRequest[]>(
            `SELECT * FROM borrows ORDER BY borrow_date DESC`
        );
    }

    async getBorrowRequestById(id: number): Promise<BorrowRequest | null> {
        const db = getDatabase();
        return db.get<BorrowRequest>(
            `SELECT * FROM borrows WHERE id = ?`,
            [id]
        );
    }

    async updateBorrowRequest(
        id: number,
        data: Partial<{
            status: string;
            approved_at: string;
            rejected_at: string;
            return_date: string;
            return_confirmed_at: string;
        }>
    ): Promise<BorrowRequest | null> {
        const db = getDatabase();
        
        const updates: string[] = [];
        const values: unknown[] = [];
        
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }
        if (data.approved_at !== undefined) {
            updates.push('approved_at = ?');
            values.push(data.approved_at);
        }
        if (data.rejected_at !== undefined) {
            updates.push('rejected_at = ?');
            values.push(data.rejected_at);
        }
        if (data.return_date !== undefined) {
            updates.push('return_date = ?');
            values.push(data.return_date);
        }
        if (data.return_confirmed_at !== undefined) {
            updates.push('return_confirmed_at = ?');
            values.push(data.return_confirmed_at);
        }
        
        if (updates.length === 0) {
            return this.getBorrowRequestById(id);
        }
        
        values.push(id);
        
        await db.run(
            `UPDATE borrows SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.getBorrowRequestById(id);
    }

    async deleteBorrowRequest(id: number): Promise<boolean> {
        const db = getDatabase();
        const result = await db.run(
            `DELETE FROM borrows WHERE id = ?`,
            [id]
        );
        
        return (result.changes || 0) > 0;
    }
}