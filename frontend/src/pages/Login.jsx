import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มตัวช่วยเปลี่ยนหน้า
import { FaSignInAlt, FaRegUser, FaRegUserCircle } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

function Login() {
  const [currentView, setCurrentView] = useState('selection');
  const navigate = useNavigate(); // สร้างตัวแปรไว้สั่งเปลี่ยนหน้า

  // ฟังก์ชันจำลองการกดปุ่มเข้าสู่ระบบ
  const handleUserLoginSubmit = () => {
    // เดี๋ยวอนาคตเราจะเขียนเช็ครหัสผ่านตรงนี้
    // ตอนนี้ให้จำลองว่าเข้าระบบผ่าน แล้วเด้งไปหน้า /user เลย
    navigate('/user'); 
  };

  const handleAdminLoginSubmit = () => {
    navigate('/admin');
  };

  return (
    <div className="login-container">
      {currentView === 'selection' && (
        <div className="login-card">
          <div className="login-logo"><FaSignInAlt /></div>
          <div className="login-title">ระบบยืม-คืนอุปกรณ์คณะวิศวกรรมศาสตร์</div>
          <div className="login-subtitle">เลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ</div>

          <button className="login-btn" onClick={() => setCurrentView('userLogin')}>
            <FaRegUser className="btn-icon" /> เข้าสู่ระบบผู้ใช้งาน
          </button>
          <button className="login-btn" onClick={() => setCurrentView('adminLogin')}>
            <MdOutlineAdminPanelSettings className="btn-icon" /> เข้าสู่ระบบผู้ดูแลระบบ
          </button>
        </div>
      )}

      {currentView === 'userLogin' && (
        <div className="login-card">
          <div className="login-logo">
            <FaRegUserCircle />
          </div>
          <div className="login-title">ระบบยืมอุปกรณ์คณะวิศวกรรมศาสตร์</div>
          <div className="login-subtitle">เข้าสู่ระบบเพื่อใช้งานระบบยืมอุปกรณ์</div>

          <form className="login-form">
            <div className="input-group">
              <label>อีเมล / รหัสนักศึกษา</label>
              <input type="text" placeholder="your.email@university.edu" />
            </div>
            <div className="input-group">
              <label>รหัสผ่าน</label>
              <input type="password" placeholder="ใส่รหัสผ่านของคุณ" />
            </div>
            
            <button type="button" className="login-submit-btn" onClick={handleUserLoginSubmit}>
              เข้าสู่ระบบ
            </button>
          </form>

          {/* ข้อความลงทะเบียน */}
          <div className="login-footer">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>
              ลงทะเบียนที่นี่
            </a>
          </div>

          {/* ปุ่มย้อนกลับ (ในรูปไม่มี แต่ผมใส่ไว้ให้เล็กๆ ด้านล่าง เผื่อผู้ใช้กดเข้ามาผิดครับ) */}
          <button className="back-btn" onClick={() => setCurrentView('selection')}>
            กลับไปหน้าเลือกประเภท
          </button>
        </div>
      )}

      {currentView === 'adminLogin' && (
        <div className="login-card">
          <div className="login-logo"><MdOutlineAdminPanelSettings /></div>
          <div className="login-title">ระบบจัดการอุปกรณ์ (Admin)</div>
          <div className="login-subtitle">เข้าสู่ระบบสำหรับเจ้าหน้าที่</div>

          <form className="login-form">
            <div className="input-group">
              <label>Username (Admin)</label>
              <input type="text" placeholder="ชื่อผู้ใช้งาน" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="รหัสผ่าน" />
            </div>
            
            <button type="button" className="login-submit-btn" onClick={handleAdminLoginSubmit}>
              เข้าสู่ระบบผู้ดูแลระบบ
            </button>
          </form>

          <button className="back-btn" onClick={() => setCurrentView('selection')}>
            กลับไปหน้าเลือกประเภท
          </button>
        </div>
      )}
      {/* ------------------------------------------------------------------
          เงื่อนไขที่ 3: หน้าลงทะเบียน (สร้างบัญชีใหม่)
          ------------------------------------------------------------------ */}
      {currentView === 'register' && (
        <div className="login-card">
          <div className="login-logo">
            <FaRegUserCircle />
          </div>
          <div className="login-title" style={{ color: '#7b1113' }}>สร้างบัญชี</div>
          <div className="login-subtitle">ลงทะเบียนเพื่อเข้าใช้งานระบบยืมอุปกรณ์</div>

          <form className="login-form">
            <div className="input-group">
              <label>รหัสประจำตัวนักศึกษา</label>
              <input type="text" placeholder="b1234567890" />
            </div>
            <div className="input-group">
              <label>ชื่อเต็ม</label>
              <input type="text" placeholder="จอห์น สมิธ" />
            </div>
            <div className="input-group">
              <label>อีเมล</label>
              <input type="email" placeholder="your.email@university.edu" />
            </div>
            <div className="input-group">
              <label>รหัสผ่าน</label>
              <input type="password" placeholder="ใส่รหัสผ่านของคุณ" />
            </div>
            <div className="input-group">
              <label>ยืนยันรหัสผ่าน</label>
              <input type="password" placeholder="ยืนยันรหัสผ่านของคุณ" />
            </div>
            
            <button 
              type="button" 
              className="login-submit-btn" 
              onClick={() => {
                alert("จำลองการลงทะเบียนสำเร็จ! กลับไปหน้าเข้าสู่ระบบ");
                setCurrentView('userLogin');
              }}
            >
              ลงทะเบียน
            </button>
          </form>

          {/* ปุ่มกลับไปหน้าเข้าสู่ระบบ */}
          <div className="login-footer">
            มีบัญชีอยู่แล้วใช่ไหม?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('userLogin'); }}>
              เข้าสู่ระบบที่นี่
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;