const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db'); // ดึงไฟล์ db.js ที่แก้ใหม่มาใช้

const app = express();
app.use(cors());
app.use(express.json());

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
            res.json({ message: "เข้าสู่ระบบสำเร็จ", user: 
                {   id: user.user_id, 
                    studentId: user.student_id,
                    fullName: user.full_name, 
                    role: user.role } });
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
            res.json({ message: "เข้าสู่ระบบ Admin สำเร็จ", user: { id: admin.user_id, fullName: admin.full_name, role: admin.role } });
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
app.post('/api/borrow', async (req, res) => {  // <-- เติม async ตรงนี้
  const { equipment_id, user_id, borrow_date, return_date, reason } = req.body;

  if (!equipment_id || !user_id || !borrow_date || !return_date || !reason) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sql = `
    INSERT INTO borrow_requests (equipment_id, user_id, borrow_date, return_date, reason) 
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    // เปลี่ยนมาใช้ await เหมือน API ตัวอื่นๆ
    const [result] = await db.query(sql, [equipment_id, user_id, borrow_date, return_date, reason]);
    
    // ตอบกลับหน้าเว็บทันทีเมื่อเสร็จ!
    res.status(201).json({ message: 'บันทึกคำขอยืมสำเร็จ!', requestId: result.insertId });
  } catch (error) {
    console.error('Error inserting borrow request:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ฝั่งเซิร์ฟเวอร์' });
  }
});

// ==========================================
// API ดึงข้อมูลประวัติการยืมของ User แต่ละคน
// ==========================================
app.get('/api/my-requests/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
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
app.put('/api/return/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // อัปเดตสถานะในตารางเป็น 'returned'
    const sql = "UPDATE borrow_requests SET status = 'returned' WHERE id = ?";
    await db.query(sql, [id]);
    res.json({ message: 'บันทึกการคืนอุปกรณ์สำเร็จ' });
  } catch (error) {
    console.error("Error returning equipment:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
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
app.get('/api/admin/dashboard', async (req, res) => {
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
app.get('/api/admin/equipments', async (req, res) => {
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
app.post('/api/admin/equipments', async (req, res) => {
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
app.delete('/api/admin/equipments/:id', async (req, res) => {
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
app.put('/api/admin/equipments/:id', async (req, res) => {
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
app.get('/api/admin/requests', async (req, res) => {
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
// API สำหรับอัปเดตสถานะคำขอยืม (Admin)
// ==========================================
app.put('/api/admin/requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // รับค่า 'approved', 'rejected', หรือ 'returned'
    
    try {
        await db.query("UPDATE borrow_requests SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: "อัปเดตสถานะเรียบร้อย!" });
    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
});
app.listen(5000, () => console.log("Backend runs on port 5000"));