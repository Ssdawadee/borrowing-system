// ไฟล์ db.js
const mysql = require('mysql2');

// ตั้งค่าการเชื่อมต่อ
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '962548', // รหัสผ่านที่เราตั้งไว้ในขั้นตอนที่ 1
  database: 'equipment_system'
});

// ทำการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จแล้ว! 🎉');
});

module.exports = db;