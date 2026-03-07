import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มตัวช่วยเปลี่ยนหน้า
import { FaSignInAlt, FaRegUser, FaRegUserCircle } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

function Login() {
  const [currentView, setCurrentView] = useState('selection');
  const navigate = useNavigate(); // สร้างตัวแปรไว้สั่งเปลี่ยนหน้า

  const handleAdminLoginSubmit = () => {
    navigate('/admin');
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState(''); // สำหรับหน้า Register
  const [fullName, setFullName] = useState('');  // สำหรับหน้า Register
  const [confirmPassword, setConfirmPassword] = useState(''); // ตัวนี้สำหรับยืนยันรหัส
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

// 1. ฟังก์ชันสำหรับ Login ผู้ใช้งาน
  const handleUserLoginSubmit = async (e) => {
    // ใช้ email state ที่เรามีอยู่แล้วนั่นแหละครับ แต่ส่งไปในชื่อ studentId
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");

    try {
      const response = await fetch('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: email, // รับค่าจากช่อง "อีเมล/รหัสนักศึกษา"
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`ยินดีต้อนรับคุณ ${data.user.fullName}`);
        // เก็บข้อมูลผู้ใช้ไว้ในเครื่อง (Optional)
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/user'); // ไปหน้ายืมของ
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (อย่าลืมรัน Backend นะครับ)");
    }
  };

  // 2. ฟังก์ชันสำหรับ Register
  const handleRegisterSubmit = async () => {
    if (!studentId || !fullName || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    if (password !== confirmPassword) return alert("รหัสผ่านไม่ตรงกัน");

    try {
      const response = await fetch('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, fullName, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ");
        setCurrentView('userLogin'); // สลับไปหน้า Login อัตโนมัติ
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
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
              <input 
                type="text" 
                placeholder="your.email@university.edu" 
                value={email} // ผูกค่ากับ State
                onChange={(e) => setEmail(e.target.value)} // พิมพ์แล้วให้ไปเก็บใน State
              />
            </div>
            <div className="input-group">
              <label>รหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="ใส่รหัสผ่านของคุณ" 
                value={password} // ผูกค่ากับ State
                onChange={(e) => setPassword(e.target.value)} 
              />
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
              <input 
                type="text" 
                placeholder="ชื่อผู้ใช้งาน" 
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="รหัสผ่าน" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
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
              <input 
                type="text" 
                placeholder="b1234567890" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label>ชื่อเต็ม</label>
              <input 
                type="text" 
                placeholder="จอห์น สมิธ" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>อีเมล</label>
              <input 
                type="email" 
                placeholder="your.email@university.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>รหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="ใส่รหัสผ่านของคุณ" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>ยืนยันรหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="ยืนยันรหัสผ่านของคุณ" 
                value={confirmPassword} // เพิ่ม State ตัวใหม่ไว้เก็บค่าการยืนยัน
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="button" 
              className="login-submit-btn" 
              onClick={handleRegisterSubmit} 
            >
              ลงทะเบียน
            </button>
          </form>

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