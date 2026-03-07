const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '962548',
  database: 'equipment_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ส่งออกแบบ Promise เพื่อให้ server.js ใช้ await ได้
module.exports = db.promise();