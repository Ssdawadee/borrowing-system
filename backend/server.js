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
app.listen(5000, () => console.log("Backend runs on port 5000"));