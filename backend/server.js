const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); // ดึงไฟล์ db.js ที่แก้ใหม่มาใช้

const app = express();
app.use(cors());
app.use(express.json());

// ================================
// JWT Config & Auth Middlewares
// ================================

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function generateToken(user) {
    return jwt.sign(
        {
            userId: user.user_id,
            studentId: user.student_id,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        console.error('JWT Verify Error:', err);
        return res.status(401).json({ error: 'สิทธิ์การเข้าถึงไม่ถูกต้อง หรือหมดอายุ' });
    }
}

function authorizeAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'อนุญาตเฉพาะผู้ดูแลระบบเท่านั้น' });
    }
    next();
}

// API: ลงทะเบียน
app.post('/api/register', async (req, res) => {
    const { studentId, fullName, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (student_id, full_name, password, role) VALUES (?, ?, ?, 'user')";
        await db.query(sql, [studentId, fullName, hashedPassword]);
        res.status(201).json({ message: "ลงทะเบียนสำเร็จ!" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด หรือรหัสนี้มีในระบบแล้ว" });
    }
});

// API: เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE student_id = ?", [studentId]);
        
        if (rows.length === 0) return res.status(401).json({ error: "ไม่พบรหัสนักศึกษานี้" });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = generateToken(user);
            res.json({
                message: "เข้าสู่ระบบสำเร็จ",
                user: {
                    id: user.user_id,
                    studentId: user.student_id,
                    fullName: user.full_name,
                    role: user.role
                },
                token
            });
        } else {
            res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server ขัดข้อง" });
    }
});

// --- 3. API สำหรับเข้าสู่ระบบ (Admin) ---
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // ค้นหาใน DB โดยบังคับว่า role ต้องเป็น 'admin' เท่านั้น
        const [rows] = await db.query("SELECT * FROM users WHERE student_id = ? AND role = 'admin'", [username]);
        
        if (rows.length === 0) return res.status(401).json({ error: "ไม่พบบัญชีผู้ดูแลระบบนี้ หรือคุณไม่มีสิทธิ์" });

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            const token = generateToken(admin);
            res.json({
                message: "เข้าสู่ระบบ Admin สำเร็จ",
                user: {
                    id: admin.user_id,
                    fullName: admin.full_name,
                    role: admin.role,
                    studentId: admin.student_id
                },
                token
            });
        } else {
            res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }
    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ error: "Server ขัดข้อง" });
    }
});

// ==========================================
// API สำหรับรับคำขอยืมอุปกรณ์จากหน้า User
// ==========================================
app.post('/api/borrow', authenticate, async (req, res) => {
  const { equipment_id, user_id, borrow_date, return_date, reason } = req.body;

  if (!equipment_id || !user_id || !borrow_date || !return_date || !reason) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // ตรวจสอบความถูกต้องของช่วงวันที่อย่างง่าย ๆ
  if (new Date(borrow_date) > new Date(return_date)) {
    return res.status(400).json({ message: 'วันที่คืนต้องอยู่หลังวันที่ยืม' });
  }

  try {
    // เช็คก่อนว่าอุปกรณ์ชิ้นนี้กำลังถูกยืมอยู่หรือไม่ (สถานะ approved / borrowed)
    const [inUseRows] = await db.query(
      `
        SELECT id 
        FROM borrow_requests 
        WHERE equipment_id = ? 
          AND status IN ('approved', 'borrowed')
        LIMIT 1
      `,
      [equipment_id]
    );

    if (inUseRows.length > 0) {
      return res
        .status(400)
        .json({ message: 'ไม่สามารถยืมอุปกรณ์ชิ้นนี้ได้ เนื่องจากกำลังถูกยืมอยู่' });
    }

    const sql = `
      INSERT INTO borrow_requests (equipment_id, user_id, borrow_date, return_date, reason) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [equipment_id, user_id, borrow_date, return_date, reason]);
    
    // ตอบกลับหน้าเว็บทันทีเมื่อเสร็จ!
    return res.status(201).json({ message: 'บันทึกคำขอยืมสำเร็จ!', requestId: result.insertId });
  } catch (error) {
    console.error('Error inserting borrow request:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ฝั่งเซิร์ฟเวอร์' });
  }
});

// ==========================================
// API ดึงข้อมูลประวัติการยืมของ User แต่ละคน
// ==========================================
app.get('/api/my-requests/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  try {
    // อนุญาตให้เข้าถึงเฉพาะเจ้าของข้อมูล หรือ Admin
    if (req.user.role !== 'admin' && req.user.studentId !== userId) {
      return res.status(403).json({ error: 'ไม่สามารถเข้าถึงประวัติของผู้อื่นได้' });
    }
    // ดึงข้อมูลจากตาราง borrow_requests เชื่อมกับ equipments เพื่อเอาชื่ออุปกรณ์
    const sql = `
      SELECT r.*, e.name as equipment_name 
      FROM borrow_requests r 
      JOIN equipments e ON r.equipment_id = e.id 
      WHERE r.user_id = ? 
      ORDER BY r.borrow_date DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
  }
});

// ==========================================
// API สำหรับทำรายการคืนอุปกรณ์
// ==========================================
app.put('/api/return/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    // อนุญาตให้คืนได้เฉพาะคำขอที่อยู่ในสถานะ approved / borrowed เท่านั้น
    const [result] = await db.query(
      "UPDATE borrow_requests SET status = 'returned', actual_return_date = NOW() WHERE id = ? AND status IN ('approved', 'borrowed')",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'ไม่สามารถทำการคืนอุปกรณ์ในสถานะปัจจุบันได้' });
    }

    return res.json({ message: 'บันทึกการคืนอุปกรณ์สำเร็จ' });
  } catch (error) {
    console.error("Error returning equipment:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
});

// API สำหรับดึงรายการอุปกรณ์ทั้งหมดไปแสดงหน้าเว็บ
app.get('/api/equipments', async (req, res) => { // <-- เติม async ตรงนี้
  try {
    const sql = "SELECT * FROM equipments"; 
    // ใช้ await แบบเดียวกับ API ตัวอื่นๆ
    const [rows] = await db.query(sql); 
    
    // ส่งข้อมูลกลับไปให้ Frontend
    res.json(rows);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้" });
  }
});

// ==========================================
// API สำหรับหน้า Admin Dashboard (สรุปข้อมูลแบบ 1 ชิ้น/อุปกรณ์)
// ==========================================
app.get('/api/admin/dashboard', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // 1. จำนวนอุปกรณ์ทั้งหมด (นับจำนวนรายการเลย เพราะ 1 ชื่อ = 1 ชิ้น)
        const [equipStats] = await db.query("SELECT COUNT(*) as total_items FROM equipments");
        const totalItems = equipStats[0].total_items || 0;

        // 2. จำนวนอุปกรณ์ที่กำลังถูกยืมไป (สถานะ approved หรือ borrowed)
        const [borrowedReqs] = await db.query("SELECT COUNT(*) as count FROM borrow_requests WHERE status IN ('approved', 'borrowed')");
        const inUseCount = borrowedReqs[0].count || 0;

        // 3. จำนวนคำขอยืมทั้งหมดในระบบ
        const [totalReqs] = await db.query("SELECT COUNT(*) as count FROM borrow_requests");

        // 4. จำนวนคำขอที่รอการอนุมัติ
        const [pendingReqs] = await db.query("SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'pending' OR status IS NULL");

        // 5. ดึงข้อมูลรายการคำขอล่าสุด 5 รายการ
        const [recentRequests] = await db.query(`
            SELECT 
                b.id, 
                b.user_id as student_id, 
                u.full_name, 
                e.name as equipment_name, 
                b.borrow_date, 
                b.status
            FROM borrow_requests b
            LEFT JOIN users u ON b.user_id = u.student_id 
            LEFT JOIN equipments e ON b.equipment_id = e.id
            ORDER BY b.id DESC LIMIT 5
        `);

        // ส่งข้อมูลกลับไปให้หน้าเว็บ
        res.json({
            equipmentStats: {
                total: totalItems,
                inUse: inUseCount,
                // คำนวณของที่ว่าง = ของทั้งหมด ลบ ของที่ถูกยืมไป
                available: totalItems - inUseCount > 0 ? totalItems - inUseCount : 0 
            },
            totalRequests: totalReqs[0].count || 0,
            pendingApprovals: pendingReqs[0].count || 0,
            currentlyBorrowed: inUseCount,
            recentRequests: recentRequests
        });
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูล Dashboard ได้" });
    }
});

// ==========================================
// API สำหรับหน้าจัดการคลังอุปกรณ์ (Admin)
// ==========================================
app.get('/api/admin/equipments', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // 💡 แก้ไข SQL ให้ถูกต้อง: ดึง image_url มาด้วย และใช้ Alias (e.) ให้ถูกต้อง
        const [equipments] = await db.query(`
            SELECT 
                e.id, 
                e.name, 
                e.category, 
                e.description, 
                e.image_url, 
                CASE WHEN COUNT(b.id) > 0 THEN 'ถูกยืม' ELSE 'ว่าง' END as current_status
            FROM equipments e
            LEFT JOIN borrow_requests b 
                   ON e.id = b.equipment_id AND b.status IN ('approved', 'borrowed')
            GROUP BY e.id
        `);
        res.json(equipments);
    } catch (error) {
        console.error("Fetch Equipments Error:", error);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลอุปกรณ์ได้" });
    }
});
// ==========================================
// API สำหรับเพิ่มอุปกรณ์ใหม่ (Admin)
// ==========================================
app.post('/api/admin/equipments', authenticate, authorizeAdmin, async (req, res) => {
    // รับค่าที่ส่งมาจากหน้าเว็บ
    const { name, category, description, image_url } = req.body;
    
    try {
        // เพิ่มลง Database (จำไว้ว่าระบบเรา 1 แถว = 1 ชิ้น)
        await db.query(
            "INSERT INTO equipments (name, category, description, image_url) VALUES (?, ?, ?, ?)",
            [name, category, description, image_url || 'https://images.unsplash.com/photo-1580828369019-2238b6938e21?w=300'] // ถ้าไม่ได้ใส่รูป ให้ใช้รูป default
        );
        res.status(201).json({ message: "เพิ่มอุปกรณ์เรียบร้อย!" });
    } catch (error) {
        console.error("Add Equipment Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์" });
    }
});

// ==========================================
// API สำหรับลบอุปกรณ์ (Admin)
// ==========================================
app.delete('/api/admin/equipments/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. เช็คก่อนว่าอุปกรณ์ชิ้นนี้ "กำลังถูกยืม" อยู่หรือไม่
        const [checkBorrow] = await db.query(
            "SELECT id FROM borrow_requests WHERE equipment_id = ? AND status IN ('approved', 'borrowed')", 
            [id]
        );

        if (checkBorrow.length > 0) {
            // ถ้ามีคนยืมอยู่ จะไม่ให้ลบ
            return res.status(400).json({ error: "ไม่สามารถลบได้ เนื่องจากอุปกรณ์ชิ้นนี้กำลังถูกยืมอยู่!" });
        }

        // 2. ถ้าไม่มีคนยืม ก็สั่งลบออกจากตาราง equipments ได้เลย
        await db.query("DELETE FROM equipments WHERE id = ?", [id]);
        
        res.json({ message: "ลบอุปกรณ์เรียบร้อยแล้ว" });
    } catch (error) {
        console.error("Delete Equipment Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบอุปกรณ์" });
    }
});
// ==========================================
// API สำหรับแก้ไขข้อมูลอุปกรณ์ (Admin)
// ==========================================
app.put('/api/admin/equipments/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, category, description, image_url } = req.body;
    
    try {
        await db.query(
            "UPDATE equipments SET name = ?, category = ?, description = ?, image_url = ? WHERE id = ?",
            [name, category, description, image_url, id]
        );
        res.json({ message: "แก้ไขข้อมูลอุปกรณ์เรียบร้อย!" });
    } catch (error) {
        console.error("Edit Equipment Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการแก้ไขอุปกรณ์" });
    }
});

// ==========================================
// API สำหรับดึงรายการคำขอยืมทั้งหมด (Admin)
// ==========================================
app.get('/api/admin/requests', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // ดึงข้อมูลคำขอ พร้อมชื่อคนยืม และชื่ออุปกรณ์ (เรียงให้ 'pending' ขึ้นก่อน)
        const sql = `
            SELECT r.id, r.user_id as student_id, u.full_name, e.name as equipment_name,
                   r.borrow_date, r.return_date, r.reason, r.status
            FROM borrow_requests r
            LEFT JOIN users u ON r.user_id = u.student_id
            LEFT JOIN equipments e ON r.equipment_id = e.id
            ORDER BY CASE WHEN r.status = 'pending' THEN 1 ELSE 2 END, r.borrow_date DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error("Fetch Requests Error:", error);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลคำขอได้" });
    }
});

// ==========================================
// API สำหรับจัดการผู้ใช้งาน (Admin)
// ==========================================

// ดึงรายการผู้ใช้ทั้งหมด พร้อมตัวกรอง role / is_active
app.get('/api/admin/users', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { role, isActive } = req.query;

        let sql = `
            SELECT 
                user_id, 
                student_id, 
                full_name, 
                role,
                IFNULL(is_active, 1) AS is_active
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            sql += ' AND role = ?';
            params.push(role);
        }

        if (typeof isActive !== 'undefined') {
            sql += ' AND IFNULL(is_active, 1) = ?';
            params.push(isActive === '0' || isActive === 'false' ? 0 : 1);
        }

        sql += ' ORDER BY created_at DESC, user_id DESC';

        const [rows] = await db.query(sql, params);
        return res.json(rows);
    } catch (error) {
        console.error('Fetch Admin Users Error:', error);
        return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
});

// อัปเดต role / is_active ของผู้ใช้
app.patch('/api/admin/users/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { role, is_active } = req.body;

    if (typeof role === 'undefined' && typeof is_active === 'undefined') {
        return res.status(400).json({ error: 'กรุณาระบุข้อมูลที่ต้องการอัปเดตอย่างน้อยหนึ่งค่า (role หรือ is_active)' });
    }

    const fields = [];
    const params = [];

    if (typeof role !== 'undefined') {
        const allowedRoles = ['user', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'ค่า role ไม่ถูกต้อง' });
        }
        fields.push('role = ?');
        params.push(role);
    }

    if (typeof is_active !== 'undefined') {
        const activeValue = is_active === 0 || is_active === false || is_active === '0' || is_active === 'false' ? 0 : 1;
        fields.push('is_active = ?');
        params.push(activeValue);
    }

    params.push(id);

    try {
        const [result] = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการอัปเดต' });
        }

        return res.json({ message: 'อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Update Admin User Error:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้' });
    }
});

// ดูประวัติการยืมของผู้ใช้รายคน (Admin)
app.get('/api/admin/users/:id/requests', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params; // user_id จากตาราง users

    try {
        const sql = `
            SELECT 
                r.id,
                r.user_id AS student_id,
                u.full_name,
                e.name AS equipment_name,
                r.borrow_date,
                r.return_date,
                r.reason,
                r.status,
                r.actual_return_date
            FROM users u
            JOIN borrow_requests r ON r.user_id = u.student_id
            LEFT JOIN equipments e ON r.equipment_id = e.id
            WHERE u.user_id = ?
            ORDER BY r.borrow_date DESC, r.id DESC
        `;

        const [rows] = await db.query(sql, [id]);
        return res.json(rows);
    } catch (error) {
        console.error('Fetch Admin User Requests Error:', error);
        return res.status(500).json({ error: 'ไม่สามารถดึงประวัติการยืมของผู้ใช้นี้ได้' });
    }
});

// ==========================================
// API สำหรับอัปเดตสถานะคำขอยืม (Admin)
// ==========================================
app.put('/api/admin/requests/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // รับค่า 'approved', 'rejected', หรือ 'returned'
    
    try {
        const allowedStatuses = ['approved', 'rejected', 'returned'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
        }

        // ดึงสถานะปัจจุบันเพื่อเช็คการเปลี่ยนสถานะให้ปลอดภัยขึ้น
        const [rows] = await db.query("SELECT status FROM borrow_requests WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบคำขอยืมนี้' });
        }

        const currentStatus = rows[0].status || 'pending';

        // กำหนดกฎการเปลี่ยนสถานะอย่างง่าย:
        // pending -> approved / rejected
        // approved -> returned
        // rejected / returned -> ห้ามเปลี่ยนแล้ว
        const isValidTransition =
            (currentStatus === 'pending' && (status === 'approved' || status === 'rejected')) ||
            (currentStatus === 'approved' && status === 'returned');

        if (!isValidTransition) {
            return res.status(400).json({ error: 'ไม่สามารถเปลี่ยนสถานะจากสถานะปัจจุบันเป็นสถานะที่ต้องการได้' });
        }

        if (status === 'returned') {
            await db.query(
                "UPDATE borrow_requests SET status = ?, actual_return_date = NOW() WHERE id = ?",
                [status, id]
            );
        } else {
            await db.query("UPDATE borrow_requests SET status = ? WHERE id = ?", [status, id]);
        }

        return res.json({ message: "อัปเดตสถานะเรียบร้อย!" });
    } catch (error) {
        console.error("Update Request Status Error:", error);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
});

// ==========================================
// API รายงานสถิติการยืมอุปกรณ์ (Admin)
// ==========================================
app.get('/api/admin/reports/borrows', authenticate, authorizeAdmin, async (req, res) => {
    const { startDate, endDate, status, equipmentId, studentId } = req.query;

    try {
        let sql = `
            SELECT 
                b.id,
                b.user_id AS student_id,
                u.full_name,
                e.name AS equipment_name,
                b.borrow_date,
                b.return_date,
                b.reason,
                b.status,
                b.created_at,
                b.updated_at,
                b.actual_return_date
            FROM borrow_requests b
            LEFT JOIN users u ON b.user_id = u.student_id
            LEFT JOIN equipments e ON b.equipment_id = e.id
            WHERE 1=1
        `;

        const params = [];

        if (startDate) {
            sql += ' AND b.borrow_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND b.borrow_date <= ?';
            params.push(endDate);
        }

        if (status && status !== 'all') {
            sql += ' AND b.status = ?';
            params.push(status);
        }

        if (equipmentId) {
            sql += ' AND b.equipment_id = ?';
            params.push(equipmentId);
        }

        if (studentId) {
            sql += ' AND b.user_id = ?';
            params.push(studentId);
        }

        sql += ' ORDER BY b.borrow_date DESC, b.id DESC';

        const [rows] = await db.query(sql, params);
        return res.json(rows);
    } catch (error) {
        console.error('Admin Reports Error:', error);
        return res.status(500).json({ error: 'ไม่สามารถดึงรายงานการยืมได้' });
    }
});
app.listen(5000, () => console.log("Backend runs on port 5000"));