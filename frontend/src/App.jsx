import React from 'react';
import './App.css';
// ดึงไอคอนมาจาก react-icons
import { FaSignInAlt, FaRegUser } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

function App() {
  
  // ฟังก์ชันจำลองเมื่อกดปุ่ม (เดี๋ยวเราค่อยมาเขียนระบบเชื่อมหน้าทีหลัง)
  const handleUserLogin = () => {
    alert("กำลังไปหน้า Login สำหรับผู้ใช้งาน...");
  };

  const handleAdminLogin = () => {
    alert("กำลังไปหน้า Login สำหรับผู้ดูแลระบบ...");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* โลโก้ด้านบน */}
        <div className="login-logo">
          <FaSignInAlt />
        </div>
        
        {/* ข้อความหัวข้อ */}
        <div className="login-title">ระบบยืม-คืนอุปกรณ์คณะวิศวกรรมศาสตร์</div>
        <div className="login-subtitle">เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ</div>

        {/* ปุ่มเข้าสู่ระบบผู้ใช้งาน */}
        <button className="login-btn" onClick={handleUserLogin}>
          <FaRegUser className="btn-icon" />
          เข้าสู่ระบบผู้ใช้งาน
        </button>

        {/* ปุ่มเข้าสู่ระบบผู้ดูแลระบบ */}
        <button className="login-btn" onClick={handleAdminLogin}>
          <MdOutlineAdminPanelSettings className="btn-icon" />
          เข้าสู่ระบบผู้ดูแลระบบ
        </button>

      </div>
    </div>
  );
}

export default App;