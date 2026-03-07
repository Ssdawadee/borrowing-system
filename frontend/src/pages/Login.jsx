import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaRegUser, FaRegUserCircle } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2 ตรงนี้

function Login() {
  const [currentView, setCurrentView] = useState('selection');
  const navigate = useNavigate();

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState(''); 
  const [fullName, setFullName] = useState('');  
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // 1. ฟังก์ชันสำหรับ Login ผู้ใช้งาน (User)
  const handleUserLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกอีเมล/รหัสนักศึกษา และรหัสผ่านให้ครบครับ',
        confirmButtonColor: '#7b1113'
      });
    }

    try {
      const response = await fetch('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: email, 
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: `ยินดีต้อนรับคุณ ${data.user.fullName}`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/user'); 
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบล้มเหลว',
          text: data.error,
          confirmButtonColor: '#7b1113'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (อย่าลืมเปิดรัน Backend และตั้ง Port เป็น Public นะครับ)',
        confirmButtonColor: '#7b1113'
      });
    }
  };

  // 2. ฟังก์ชันสำหรับ Login ผู้ดูแลระบบ (Admin)
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอก Username และ Password ให้ครบครับ',
        confirmButtonColor: '#7b1113'
      });
    }

    try {
      const response = await fetch('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: adminUsername, 
          password: adminPassword 
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'ยืนยันตัวตนสำเร็จ!',
          text: `ยินดีต้อนรับผู้ดูแลระบบ: ${data.user.fullName}`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/admin');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'สิทธิ์การเข้าถึงถูกปฏิเสธ',
          text: data.error,
          confirmButtonColor: '#7b1113'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#7b1113'
      });
    }
  };

  // 3. ฟังก์ชันสำหรับ Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !fullName || !password || !confirmPassword) {
      return Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูลให้ครบทุกช่องครับ',
        confirmButtonColor: '#7b1113'
      });
    }
    
    if (password !== confirmPassword) {
      return Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านและการยืนยันรหัสผ่านอีกครั้ง',
        confirmButtonColor: '#7b1113'
      });
    }

    try {
      const response = await fetch('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, fullName, password })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสำเร็จ!',
          text: 'สร้างบัญชีเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
          confirmButtonColor: '#28a745'
        }).then(() => {
          // ล้างค่าฟอร์มหลังจากสมัครเสร็จ
          setStudentId('');
          setFullName('');
          setPassword('');
          setConfirmPassword('');
          setCurrentView('userLogin');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ลงทะเบียนไม่สำเร็จ',
          text: data.error,
          confirmButtonColor: '#7b1113'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'การเชื่อมต่อขัดข้อง',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        confirmButtonColor: '#7b1113'
      });
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
            
            <button type="button" className="login-submit-btn" onClick={handleUserLoginSubmit}>
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="login-footer">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>
              ลงทะเบียนที่นี่
            </a>
          </div>

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
                value={confirmPassword} 
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