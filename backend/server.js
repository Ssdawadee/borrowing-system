// ไฟล์ server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); // ดึงไฟล์เชื่อมต่อฐานข้อมูลมาใช้

const app = express();

// อนุญาตให้ Frontend (React) เชื่อมต่อมาหา Backend ได้
app.use(cors());
// อนุญาตให้รับข้อมูลที่ส่งมาเป็นแบบ JSON
app.use(express.json()); 

// ==========================================
// API Endpoint สำหรับดึงข้อมูลอุปกรณ์ทั้งหมด
// ==========================================
app.get('/api/equipments', (req, res) => {
  const sql = "SELECT * FROM equipments";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
    // ส่งข้อมูลกลับไปให้ React เป็น JSON
    res.json(results); 
  });
});

// สั่งให้ Server เริ่มทำงานที่ Port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend Server รันอยู่บนพอร์ต ${PORT} 🚀`);
});