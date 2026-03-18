// Normalize category name: trim and lowercase
function normalizeCategory(name: string): string {
	return name.trim().toLowerCase();
}
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import { config } from '../config/env';
import { getDatabase } from '../config/database';
import { AuthenticatedUser, BorrowStatus, EquipmentCondition, UserRole } from '../types';

const router = express.Router();

const buildToken = (user: AuthenticatedUser) =>
	jwt.sign(normalizeUser(user), config.JWT_SECRET, {
		expiresIn: config.TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
	});

const normalizeUser = (user: AuthenticatedUser) => ({
	id: user.id,
	student_id: user.student_id,
	name: user.name,
	email: user.email,
	phone: user.phone,
	role: user.role,
});

const isValidStudentId = (value: string) => /^b\d{10}$/i.test(value);
const isValidPhone = (value: string) => /^\d{10}$/.test(value);

router.get('/categories', async (_req, res, next) => {
	try {
		const db = getDatabase();
		const categories = await db.all<Array<{ id: number; name: string }>>(
			'SELECT id, name FROM categories ORDER BY name ASC'
		);

		return res.json(categories);
	} catch (error) {
		next(error);
	}
});

router.post('/categories', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const { name } = req.body as { name?: string };

		if (!name?.trim()) {
			return res.status(400).json({ message: 'Category name is required.' });
		}

		const categoryName = normalizeCategory(name);
		const db = getDatabase();
		const existingCategory = await db.get<{ id: number }>(
			'SELECT id FROM categories WHERE name = ?',
			categoryName
		);

		if (existingCategory) {
			return res.status(409).json({ message: 'Category already exists.' });
		}

		const result = await db.run('INSERT INTO categories (name) VALUES (?)', categoryName);
		const category = await db.get<{ id: number; name: string }>(
			'SELECT id, name FROM categories WHERE id = ?',
			result.lastID
		);

		return res.status(201).json(category);
	} catch (error) {
		next(error);
	}
});

router.delete('/categories/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const categoryId = Number(req.params.id);

		if (!Number.isInteger(categoryId) || categoryId <= 0) {
			return res.status(400).json({ message: 'Invalid category id.' });
		}

		const db = getDatabase();
		const category = await db.get<{ id: number; name: string }>(
			'SELECT id, name FROM categories WHERE id = ?',
			categoryId
		);

		if (!category) {
			return res.status(404).json({ message: 'Category not found.' });
		}

		const usage = await db.get<{ count: number }>(
			'SELECT COUNT(*) as count FROM equipment WHERE LOWER(category) = LOWER(?)',
			category.name
		);

		if ((usage?.count || 0) > 0) {
			return res.status(400).json({ message: 'ไม่สามารถลบหมวดหมู่นี้ได้ เพราะยังมีอุปกรณ์ใช้งานอยู่ในหมวดหมู่นี้' });
		}

		await db.run('DELETE FROM categories WHERE id = ?', categoryId);
		return res.status(204).send();
	} catch (error) {
		next(error);
	}
});

router.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

router.post('/auth/register', async (req, res, next) => {
	try {
		const { student_id, name, email, phone, password } = req.body as {
			student_id?: string;
			name?: string;
			email?: string;
			phone?: string;
			password?: string;
		};

		if (!student_id || !name || !phone || !password) {
			return res.status(400).json({ message: 'Student ID, name, phone, and password are required.' });
		}

		const normalizedStudentId = student_id.trim().toLowerCase();
		const normalizedPhone = phone.trim();

		if (!isValidStudentId(normalizedStudentId)) {
			return res.status(400).json({ message: 'รหัสนักศึกษาต้องขึ้นต้นด้วย b และตามด้วยตัวเลข 10 หลัก' });
		}

		if (!isValidPhone(normalizedPhone)) {
			return res.status(400).json({ message: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก' });
		}

		const normalizedEmail = email?.trim().toLowerCase() || `${normalizedStudentId}@student.local`;

		const db = getDatabase();
		const existingUser = await db.get(
			'SELECT id FROM users WHERE email = ? OR student_id = ?',
			normalizedEmail,
			normalizedStudentId
		);

		if (existingUser) {
			return res.status(409).json({ message: 'อีเมลหรือรหัสนักศึกษานี้มีอยู่ในระบบแล้ว' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await db.run(
			`INSERT INTO users (student_id, name, email, phone, password, role)
			 VALUES (?, ?, ?, ?, ?, 'user')`,
			normalizedStudentId,
			name.trim(),
			normalizedEmail,
			normalizedPhone,
			hashedPassword
		);

		const user = await db.get<AuthenticatedUser>(
			'SELECT id, student_id, name, email, phone, role FROM users WHERE id = ?',
			result.lastID
		);

		if (!user) {
			return res.status(500).json({ message: 'Unable to create user.' });
		}

		return res.status(201).json({ token: buildToken(user), user: normalizeUser(user) });
	} catch (error) {
		next(error);
	}
});

router.post('/auth/login', async (req, res, next) => {
	try {
		const { email, student_id, password, role } = req.body as {
			email?: string;
			student_id?: string;
			password?: string;
			role?: UserRole;
		};

		const normalizedStudentId = student_id?.trim().toLowerCase();
		const identifier = normalizedStudentId || email?.trim().toLowerCase();

		if (!identifier || !password) {
			return res.status(400).json({ message: 'Student ID or email and password are required.' });
		}

		if (normalizedStudentId && !isValidStudentId(normalizedStudentId)) {
			return res.status(400).json({ message: 'รหัสนักศึกษาต้องขึ้นต้นด้วย b และตามด้วยตัวเลข 10 หลัก' });
		}

		const db = getDatabase();
		const user = await db.get<(AuthenticatedUser & { password: string; is_active: number })>(
			'SELECT id, student_id, name, email, phone, password, role, is_active FROM users WHERE email = ? OR student_id = ?',
			identifier,
			identifier
		);

		if (!user) {
			return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return res.status(401).json({ message: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง' });
		}

		if (!user.is_active) {
			return res.status(403).json({ message: 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
		}

		if (role && user.role !== role) {
			return res.status(403).json({ message: 'This account does not match the selected role.' });
		}

		return res.json({ token: buildToken(user), user: normalizeUser(user) });
	} catch (error) {
		next(error);
	}
});

router.get('/equipment', async (req, res, next) => {
	try {
		const db = getDatabase();
		const search = String(req.query.search || '').trim().toLowerCase();
		// ใช้ normalizeCategory กับค่าที่รับมา
		const category = req.query.category ? normalizeCategory(String(req.query.category)) : '';

		const conditions: string[] = [];
		const params: Array<string | number> = [];

		if (search) {
			conditions.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
			params.push(`%${search}%`, `%${search}%`);
		}

		if (category) {
			conditions.push('category = ?');
			params.push(category);
		}

		const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
		const equipment = await db.all(
			`SELECT * FROM equipment ${whereClause} ORDER BY name ASC`,
			...params
		);

		return res.json(equipment);
	} catch (error) {
		next(error);
	}
});

router.post('/equipment', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const { name, category, description, total_quantity, available_quantity, damaged_quantity, image_url, status } = req.body as {
			name?: string;
			category?: string;
			description?: string;
			total_quantity?: number;
			available_quantity?: number;
			damaged_quantity?: number;
			image_url?: string;
			status?: EquipmentCondition;
		};

		if (!name || !category || typeof total_quantity !== 'number') {
			return res.status(400).json({ message: 'Name, category, and total quantity are required.' });
		}

		if (total_quantity < 0) {
			return res.status(400).json({ message: 'Total quantity must be greater than or equal to 0.' });
		}

		const db = getDatabase();
		const damagedQuantity =
			typeof damaged_quantity === 'number' ? damaged_quantity : 0;

		if (damagedQuantity < 0 || damagedQuantity > total_quantity) {
			return res.status(400).json({ message: 'Damaged quantity must be between 0 and total quantity.' });
		}

		const maxAvailableQuantity = total_quantity - damagedQuantity;
		const availableQuantity =
			typeof available_quantity === 'number' ? available_quantity : maxAvailableQuantity;

		if (availableQuantity < 0 || availableQuantity > maxAvailableQuantity) {
			return res.status(400).json({ message: 'Available quantity must be between 0 and (total quantity - damaged quantity).' });
		}

		const result = await db.run(
			`INSERT INTO equipment
			 (name, category, description, total_quantity, available_quantity, damaged_quantity, image_url, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			name.trim(),
			category.trim(),
			description?.trim() || '',
			total_quantity,
			availableQuantity,
			damagedQuantity,
			image_url?.trim() || '',
			status || 'NORMAL'
		);

		await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', normalizeCategory(category));

		const equipment = await db.get('SELECT * FROM equipment WHERE id = ?', result.lastID);
		return res.status(201).json(equipment);
	} catch (error) {
		next(error);
	}
});

router.put('/equipment/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const existing = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);

		if (!existing) {
			return res.status(404).json({ message: 'Equipment not found.' });
		}

		const payload = {
			name: req.body.name ?? existing.name,
			category: req.body.category ?? existing.category,
			description: req.body.description ?? existing.description,
			total_quantity: Number(req.body.total_quantity ?? existing.total_quantity),
			available_quantity: Number(req.body.available_quantity ?? existing.available_quantity),
			damaged_quantity: Number(req.body.damaged_quantity ?? existing.damaged_quantity ?? 0),
			image_url: req.body.image_url ?? existing.image_url,
			status: (req.body.status ?? existing.status) as EquipmentCondition,
		};

		if (payload.total_quantity < 0) {
			return res.status(400).json({ message: 'Total quantity must be greater than or equal to 0.' });
		}

		if (payload.damaged_quantity < 0 || payload.damaged_quantity > payload.total_quantity) {
			return res.status(400).json({ message: 'Damaged quantity must be between 0 and total quantity.' });
		}

		if (
			payload.available_quantity < 0 ||
			payload.available_quantity > (payload.total_quantity - payload.damaged_quantity)
		) {
			return res.status(400).json({ message: 'Available quantity must be between 0 and (total quantity - damaged quantity).' });
		}

		await db.run(
			`UPDATE equipment
			 SET name = ?, category = ?, description = ?, total_quantity = ?, available_quantity = ?, damaged_quantity = ?, image_url = ?, status = ?
			 WHERE id = ?`,
			payload.name,
			payload.category,
			payload.description,
			payload.total_quantity,
			payload.available_quantity,
			payload.damaged_quantity,
			payload.image_url,
			payload.status,
			req.params.id
		);

		await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', normalizeCategory(payload.category));

		const equipment = await db.get('SELECT * FROM equipment WHERE id = ?', req.params.id);
		return res.json(equipment);
	} catch (error) {
		next(error);
	}
});

router.delete('/equipment/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const result = await db.run('DELETE FROM equipment WHERE id = ?', req.params.id);

		if (!result.changes) {
			return res.status(404).json({ message: 'Equipment not found.' });
		}

		return res.status(204).send();
	} catch (error) {
		next(error);
	}
});

router.post('/borrow/request', authMiddleware, async (req, res, next) => {
	try {
		const user = req.user;
		const { equipmentId, borrowDate, dueDate, reason, quantity } = req.body as {
			equipmentId?: number;
			borrowDate?: string;
			dueDate?: string;
			reason?: string;
			quantity?: number;
		};

		if (!user) {
			return res.status(401).json({ message: 'Unauthorized.' });
		}

		if (!equipmentId || !borrowDate || !dueDate || !reason?.trim()) {
			return res.status(400).json({ message: 'Equipment ID, borrow date, due date, and reason are required.' });
		}

		const requestQuantity = Number(quantity ?? 1);
		if (!Number.isInteger(requestQuantity) || requestQuantity < 1) {
			return res.status(400).json({ message: 'จำนวนอุปกรณ์ที่ขอยืมต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' });
		}

		const borrowDateValue = new Date(borrowDate);
		const dueDateValue = new Date(dueDate);

		if (Number.isNaN(borrowDateValue.getTime()) || Number.isNaN(dueDateValue.getTime())) {
			return res.status(400).json({ message: 'Borrow date and due date must be valid dates.' });
		}

		if (dueDateValue <= borrowDateValue) {
			return res.status(400).json({ message: 'Due date must be later than borrow date.' });
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (borrowDateValue < today) {
			return res.status(400).json({ message: 'วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว' });
		}

		const maxAdvanceDate = new Date(today);
		maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 7);
		if (borrowDateValue > maxAdvanceDate) {
			return res.status(400).json({ message: 'จองอุปกรณ์ล่วงหน้าได้ไม่เกิน 7 วัน' });
		}

		const diffDays = (dueDateValue.getTime() - borrowDateValue.getTime()) / (1000 * 60 * 60 * 24);
		if (diffDays > 5) {
			return res.status(400).json({ message: 'ระยะเวลายืมต้องไม่เกิน 5 วัน' });
		}

		const db = getDatabase();
		const equipment = await db.get<{ available_quantity: number; total_quantity: number }>(
			'SELECT available_quantity, total_quantity FROM equipment WHERE id = ?',
			equipmentId
		);

		if (!equipment) {
			return res.status(404).json({ message: 'Equipment not found.' });
		}

		if (requestQuantity > equipment.total_quantity) {
			return res.status(400).json({ message: 'จำนวนที่ยืมต้องไม่เกินจำนวนอุปกรณ์ทั้งหมด' });
		}

		if (equipment.available_quantity < requestQuantity) {
			return res.status(400).json({ message: 'This equipment is currently unavailable.' });
		}

		const existingSameEquipmentQty = await db.get<{ total: number }>(
			`SELECT COALESCE(SUM(quantity), 0) as total
			 FROM borrows
			 WHERE user_id = ?
				AND equipment_id = ?
				AND status IN ('PENDING', 'APPROVED', 'RETURN_PENDING')`,
			user.id,
			equipmentId
		);

		const currentQty = existingSameEquipmentQty?.total || 0;
		const maxByPolicy = Math.max(0, 3 - currentQty);
		const maxAllowableQty = Math.min(maxByPolicy, equipment.available_quantity);

		if (maxAllowableQty <= 0) {
			return res.status(400).json({ message: 'คุณยืมอุปกรณ์ชนิดนี้ครบจำนวนสูงสุดแล้ว (ไม่เกิน 3 ชิ้นต่อบัญชี)' });
		}

		if (requestQuantity > maxAllowableQty) {
			return res.status(400).json({
				message: `คุณสามารถยืมอุปกรณ์ชนิดนี้ได้สูงสุด ${maxAllowableQty} ชิ้นในคำขอนี้`,
			});
		}

		const result = await db.run(
			`INSERT INTO borrows (user_id, equipment_id, quantity, borrow_date, due_date, borrow_reason, status)
			 VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
			user.id,
			equipmentId,
			requestQuantity,
			new Date().toISOString(),
			dueDateValue.toISOString(),
			reason.trim()
		);

		const borrow = await db.get('SELECT * FROM borrows WHERE id = ?', result.lastID);
		return res.status(201).json(borrow);
	} catch (error) {
		next(error);
	}
});

router.get('/borrow/user', authMiddleware, async (req, res, next) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ message: 'Unauthorized.' });
		}

		const db = getDatabase();
		const records = await db.all(
			`SELECT b.*, e.name as equipment_name, e.category, e.image_url,
							CASE
								WHEN b.status = 'APPROVED' AND julianday(b.due_date) - julianday('now') <= ? THEN 1
								ELSE 0
							END as due_soon
			 FROM borrows b
			 JOIN equipment e ON e.id = b.equipment_id
			 WHERE b.user_id = ?
			 ORDER BY b.id DESC`,
			config.REMINDER_DAYS,
			user.id
		);

		return res.json(records);
	} catch (error) {
		next(error);
	}
});

router.get('/borrow/all', authMiddleware, roleMiddleware(['admin']), async (_req, res, next) => {
	try {
		const db = getDatabase();
		const records = await db.all(
			`SELECT b.*, u.name as user_name, u.student_id, u.email, e.name as equipment_name, e.category,
					e.available_quantity as equipment_available_quantity, e.total_quantity as equipment_total_quantity,
					CASE
						WHEN b.status = 'APPROVED' THEN b.approved_at
						WHEN b.status = 'REJECTED' THEN b.rejected_at
						WHEN b.status = 'RETURNED' THEN b.return_confirmed_at
						ELSE NULL
					END as admin_action_at
			 FROM borrows b
			 JOIN users u ON u.id = b.user_id
			 JOIN equipment e ON e.id = b.equipment_id
			 ORDER BY datetime(COALESCE(
				CASE
					WHEN b.status = 'APPROVED' THEN b.approved_at
					WHEN b.status = 'REJECTED' THEN b.rejected_at
					WHEN b.status = 'RETURNED' THEN b.return_confirmed_at
					ELSE NULL
				END,
				b.borrow_date
			)) DESC, b.id DESC`
		);

		return res.json(records);
	} catch (error) {
		next(error);
	}
});

router.get('/borrows/history', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const rawPage = Number(req.query.page);
		const rawLimit = Number(req.query.limit);

		const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
		const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10;
		const safeLimit = Math.min(limit, 100);
		const offset = (page - 1) * safeLimit;

		const totalRow = await db.get<{ total: number }>(
			`SELECT COUNT(*) as total
			 FROM borrows
			 WHERE status IN ('RETURNED', 'REJECTED')`
		);

		const total = Number(totalRow?.total || 0);
		const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

		const records = await db.all(
			`SELECT b.*, u.name as user_name, u.student_id, u.email, e.name as equipment_name, e.category,
					e.available_quantity as equipment_available_quantity, e.total_quantity as equipment_total_quantity,
					CASE
						WHEN b.status = 'APPROVED' THEN b.approved_at
						WHEN b.status = 'REJECTED' THEN b.rejected_at
						WHEN b.status = 'RETURNED' THEN b.return_confirmed_at
						ELSE NULL
					END as admin_action_at
			 FROM borrows b
			 JOIN users u ON u.id = b.user_id
			 JOIN equipment e ON e.id = b.equipment_id
			 WHERE b.status IN ('RETURNED', 'REJECTED')
			 ORDER BY datetime(COALESCE(
				CASE
					WHEN b.status = 'APPROVED' THEN b.approved_at
					WHEN b.status = 'REJECTED' THEN b.rejected_at
					WHEN b.status = 'RETURNED' THEN b.return_confirmed_at
					ELSE NULL
				END,
				b.borrow_date
			)) DESC, b.id DESC
			 LIMIT ? OFFSET ?`,
			safeLimit,
			offset
		);

		return res.json({
			data: records,
			pagination: {
				page,
				limit: safeLimit,
				total,
				totalPages,
			},
		});
	} catch (error) {
		next(error);
	}
});

router.delete('/borrow/completed', authMiddleware, roleMiddleware(['admin']), async (_req, res, next) => {
	try {
		const db = getDatabase();
		const result = await db.run(
			"DELETE FROM borrows WHERE status IN ('RETURNED', 'REJECTED')"
		);

		return res.json({
			message: 'Completed borrow history has been cleared.',
			deletedCount: result.changes || 0,
		});
	} catch (error) {
		next(error);
	}
});

router.put('/borrow/approve/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const borrow = await db.get<{ id: number; status: BorrowStatus; equipment_id: number; quantity: number }>(
			'SELECT id, status, equipment_id, quantity FROM borrows WHERE id = ?',
			req.params.id
		);

		if (!borrow) {
			return res.status(404).json({ message: 'Borrow request not found.' });
		}

		if (borrow.status !== 'PENDING') {
			return res.status(400).json({ message: 'Only pending requests can be approved.' });
		}

		await db.exec('BEGIN IMMEDIATE');
		const equipmentUpdate = await db.run(
			'UPDATE equipment SET available_quantity = available_quantity - ? WHERE id = ? AND available_quantity >= ?',
			borrow.quantity,
			borrow.equipment_id,
			borrow.quantity
		);

		if (!equipmentUpdate.changes) {
			await db.exec('ROLLBACK');
			return res.status(400).json({ message: 'อุปกรณ์นี้หมด ไม่พร้อมให้อนุมัติ' });
		}

		const borrowUpdate = await db.run(
			`UPDATE borrows
			 SET status = 'APPROVED', approved_at = ?, rejected_at = NULL
			 WHERE id = ? AND status = 'PENDING'`,
			new Date().toISOString(),
			borrow.id
		);

		if (!borrowUpdate.changes) {
			await db.exec('ROLLBACK');
			return res.status(400).json({ message: 'Only pending requests can be approved.' });
		}

		await db.exec('COMMIT');

		const updated = await db.get('SELECT * FROM borrows WHERE id = ?', borrow.id);
		return res.json(updated);
	} catch (error) {
		const db = getDatabase();
		await db.exec('ROLLBACK');
		next(error);
	}
});

router.put('/borrow/reject/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const borrow = await db.get<{ id: number; status: BorrowStatus }>(
			'SELECT id, status FROM borrows WHERE id = ?',
			req.params.id
		);

		if (!borrow) {
			return res.status(404).json({ message: 'Borrow request not found.' });
		}

		if (borrow.status !== 'PENDING') {
			return res.status(400).json({ message: 'Only pending requests can be rejected.' });
		}

		await db.run(
			"UPDATE borrows SET status = 'REJECTED', rejected_at = ?, approved_at = NULL WHERE id = ?",
			new Date().toISOString(),
			borrow.id
		);
		const updated = await db.get('SELECT * FROM borrows WHERE id = ?', borrow.id);
		return res.json(updated);
	} catch (error) {
		next(error);
	}
});

router.put('/borrow/return/:id', authMiddleware, async (req, res, next) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ message: 'Unauthorized.' });
		}

		const db = getDatabase();
		const borrow = await db.get<{ id: number; status: BorrowStatus; user_id: number }>(
			'SELECT id, status, user_id FROM borrows WHERE id = ?',
			req.params.id
		);

		if (!borrow) {
			return res.status(404).json({ message: 'Borrow record not found.' });
		}

		if (borrow.user_id !== user.id) {
			return res.status(403).json({ message: 'You can only return your own borrowed items.' });
		}

		if (borrow.status !== 'APPROVED') {
			return res.status(400).json({ message: 'Only approved borrows can be returned.' });
		}

		await db.run(
			`UPDATE borrows
			 SET status = 'RETURN_PENDING', return_date = ?
			 WHERE id = ?`,
			new Date().toISOString(),
			borrow.id
		);

		const updated = await db.get('SELECT * FROM borrows WHERE id = ?', borrow.id);
		return res.json(updated);
	} catch (error) {
		next(error);
	}
});

router.put('/borrow/confirm-return/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const borrow = await db.get<{ id: number; status: BorrowStatus; equipment_id: number; quantity: number }>(
			'SELECT id, status, equipment_id, quantity FROM borrows WHERE id = ?',
			req.params.id
		);

		if (!borrow) {
			return res.status(404).json({ message: 'Borrow record not found.' });
		}

		if (borrow.status !== 'RETURN_PENDING') {
			return res.status(400).json({ message: 'สามารถยืนยันการคืนได้เฉพาะรายการที่ผู้ใช้ส่งคำขอคืนแล้วเท่านั้น' });
		}

		await db.exec('BEGIN');
		await db.run(
			`UPDATE borrows
			 SET status = 'RETURNED', return_confirmed_at = ?
			 WHERE id = ?`,
			new Date().toISOString(),
			borrow.id
		);
		await db.run(
			`UPDATE equipment
			 SET available_quantity = CASE
				WHEN available_quantity + ? > total_quantity THEN total_quantity
				ELSE available_quantity + ?
			 END
			 WHERE id = ?`,
			borrow.quantity,
			borrow.quantity,
			borrow.equipment_id
		);
		await db.exec('COMMIT');

		const updated = await db.get('SELECT * FROM borrows WHERE id = ?', borrow.id);
		return res.json(updated);
	} catch (error) {
		const db = getDatabase();
		await db.exec('ROLLBACK');
		next(error);
	}
});

router.get('/dashboard/user', authMiddleware, async (req, res, next) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ message: 'Unauthorized.' });
		}

		const db = getDatabase();
		const stats = await db.get<{
			borrowedCount: number;
			pendingCount: number;
			availableEquipment: number;
		}>(
			`SELECT
				 SUM(CASE WHEN b.status = 'APPROVED' THEN 1 ELSE 0 END) as borrowedCount,
				 SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
				 (SELECT COUNT(*) FROM equipment WHERE available_quantity > 0) as availableEquipment
			 FROM borrows b
			 WHERE b.user_id = ?`,
			user.id
		);

		const reminders = await db.all(
			`SELECT b.id, e.name as equipment_name, b.due_date,
				CASE
					WHEN date(b.due_date) = date('now', '+1 day') THEN 'ONE_DAY_BEFORE'
					WHEN date(b.due_date) = date('now') THEN 'DUE_TODAY'
					WHEN date(b.due_date) < date('now') THEN 'OVERDUE'
					ELSE 'NONE'
				END as reminder_type
			 FROM borrows b
			 JOIN equipment e ON e.id = b.equipment_id
			 WHERE b.user_id = ?
				 AND b.status = 'APPROVED'
				 AND (
					date(b.due_date) = date('now', '+1 day')
					OR date(b.due_date) = date('now')
					OR date(b.due_date) < date('now')
				 )
			 ORDER BY datetime(b.due_date) ASC`,
			user.id
		);

		const recentBorrows = await db.all(
			`SELECT b.id, b.status, b.borrow_date, b.due_date, e.name as equipment_name
			 FROM borrows b
			 JOIN equipment e ON e.id = b.equipment_id
			 WHERE b.user_id = ?
			 ORDER BY b.id DESC
			 LIMIT 5`,
			user.id
		);

		return res.json({
			stats: {
				borrowedCount: stats?.borrowedCount || 0,
				pendingCount: stats?.pendingCount || 0,
				availableEquipment: stats?.availableEquipment || 0,
			},
			reminders,
			recentBorrows,
		});
	} catch (error) {
		next(error);
	}
});

router.get('/dashboard/admin', authMiddleware, roleMiddleware(['admin']), async (_req, res, next) => {
	try {
		const db = getDatabase();
		const stats = await db.get<{
			totalEquipment: number;
			availableUnits: number;
			pendingRequests: number;
			damagedItems: number;
			totalUsers: number;
		}>(
			`SELECT
				 COUNT(*) as totalEquipment,
				 SUM(available_quantity) as availableUnits,
				 SUM(CASE WHEN damaged_quantity > 0 THEN 1 ELSE 0 END) as damagedItems,
				 (SELECT COUNT(*) FROM borrows WHERE status = 'PENDING') as pendingRequests,
				 (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers
			 FROM equipment`
		);

		const pendingRequests = await db.all(
			`SELECT b.id, b.status, b.borrow_date, b.due_date, b.borrow_reason, u.name as user_name, u.student_id, e.name as equipment_name
			 FROM borrows b
			 JOIN users u ON u.id = b.user_id
			 JOIN equipment e ON e.id = b.equipment_id
			 WHERE b.status IN ('PENDING', 'RETURN_PENDING')
			 ORDER BY datetime(b.borrow_date) DESC
			 LIMIT 8`
		);

		return res.json({
			stats: {
				totalEquipment: stats?.totalEquipment || 0,
				availableUnits: stats?.availableUnits || 0,
				pendingRequests: stats?.pendingRequests || 0,
				damagedItems: stats?.damagedItems || 0,
				totalUsers: stats?.totalUsers || 0,
			},
			pendingRequests,
		});
	} catch (error) {
		next(error);
	}
});

router.get('/admin/users', authMiddleware, roleMiddleware(['admin']), async (_req, res, next) => {
	try {
		const db = getDatabase();
		const users = await db.all(
			`SELECT
				u.id,
				u.student_id,
				u.name,
				u.email,
				u.phone,
				u.role,
				u.created_at,
				COUNT(b.id) as borrow_count,
				MAX(b.borrow_date) as latest_borrow_date,
				MAX(CASE WHEN b.status IN ('APPROVED', 'RETURN_PENDING') THEN 1 ELSE 0 END) as has_unreturned,
				MAX(CASE WHEN b.status IN ('APPROVED', 'RETURN_PENDING') AND datetime(b.due_date) < datetime('now') THEN 1 ELSE 0 END) as has_overdue
			 FROM users u
			 LEFT JOIN borrows b ON b.user_id = u.id
			 WHERE u.role = 'user'
			 GROUP BY u.id, u.student_id, u.name, u.email, u.phone, u.role, u.created_at
			 ORDER BY datetime(u.created_at) DESC, u.id DESC`
		);

		return res.json(users);
	} catch (error) {
		next(error);
	}
});

router.delete('/admin/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res, next) => {
	try {
		const db = getDatabase();
		const user = await db.get<{ id: number; role: UserRole; name: string }>(
			'SELECT id, role, name FROM users WHERE id = ?',
			req.params.id
		);

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		if (user.role !== 'user') {
			return res.status(400).json({ message: 'Only student accounts can be deleted from this screen.' });
		}

		const activeBorrow = await db.get<{ count: number }>(
			`SELECT COUNT(*) as count
			 FROM borrows
			 WHERE user_id = ?
			   AND status IN ('PENDING', 'APPROVED', 'RETURN_PENDING')`,
			req.params.id
		);

		if ((activeBorrow?.count || 0) > 0) {
			return res.status(400).json({ message: 'ไม่สามารถลบผู้ใช้ที่มีรายการยืมหรือคืนค้างอยู่ได้' });
		}

		await db.run('DELETE FROM users WHERE id = ?', req.params.id);

		return res.json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
	} catch (error) {
		next(error);
	}
});

export default router;