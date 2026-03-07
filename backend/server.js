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
            res.json({ message: "เข้าสู่ระบบสำเร็จ", user: { id: user.user_id, fullName: user.full_name, role: user.role } });
        } else {
            res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server ขัดข้อง" });
    }
});

app.listen(5000, () => console.log("Backend runs on port 5000"));