import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, FaThLarge, FaBoxOpen, FaClipboardList, FaUndoAlt,
  FaCube, FaRegClock, FaRegCheckCircle, FaPlus, FaSignOutAlt
} from "react-icons/fa";
import './User.css';

function User() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: 'ผู้ใช้งาน', id: 'N/A' });
  
  // สร้าง State สำหรับเก็บว่าตอนนี้เปิดหน้าไหนอยู่ (เริ่มต้นที่หน้าแดชบอร์ด)
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        fullName: parsedUser.fullName,
        id: parsedUser.studentId || parsedUser.id || 'N/A'
      });
    } else {
      navigate('/');
    }
  }, [navigate]);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // --- ข้อมูลจำลองสำหรับหน้าอุปกรณ์ (Mock Data) ---
  const equipments = [
    { id: 1, name: 'กล้องถ่ายภาพ', desc: 'Canon EOS 80D พร้อมเลนส์ 18-135 มม.', category: 'อุปกรณ์ถ่ายภาพ', available: 3, total: 5, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80' },
    { id: 2, name: 'ขาตั้งกล้อง', desc: 'ขาตั้งกล้องอลูมิเนียมระดับมืออาชีพ', category: 'อุปกรณ์ถ่ายภาพ', available: 8, total: 10, img: 'https://images.unsplash.com/photo-1527011045970-1a73cb95c968?w=400&q=80' },
    { id: 3, name: 'ไมโครโฟน', desc: 'ไมโครโฟนไร้สาย', category: 'อุปกรณ์เสียง', available: 5, total: 6, img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80' },
    { id: 4, name: 'โปรเจกเตอร์', desc: 'โปรเจกเตอร์พกพา 4K พร้อม HDMI', category: 'อุปกรณ์นำเสนอ', available: 2, total: 4, img: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80' },
    { id: 5, name: 'ลำโพงพกพา', desc: 'ลำโพงบลูทูธพกพา 100 วัตต์', category: 'อุปกรณ์เสียง', available: 6, total: 8, img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80' },
    { id: 6, name: 'ไวท์บอร์ด', desc: 'ไวท์บอร์ดแม่เหล็กแบบพกพา', category: 'อุปกรณ์นำเสนอ', available: 3, total: 5, img: 'https://images.unsplash.com/photo-1531347625515-081498b35062?w=400&q=80' },
    { id: 7, name: 'ชุดไฟสตูดิโอ', desc: 'ชุดไฟ LED พร้อมขาตั้ง', category: 'อุปกรณ์ถ่ายภาพ', available: 2, total: 3, img: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=400&q=80' },
    { id: 8, name: 'แล็ปท็อป', desc: 'MacBook Pro 14 นิ้ว ชิป M1', category: 'อุปกรณ์คอมพิวเตอร์', available: 4, total: 8, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
  ];

  // ================= ส่วนแสดงผลหน้าจอ แดชบอร์ด =================
  const renderDashboard = () => (
    <>
      <div className="welcome-section">
        <h1>ยินดีต้อนรับกลับมา {userData.fullName}!</h1>
        <p>รหัสนักศึกษา: {userData.id}</p>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <FaCube className="stat-icon" />
          <h3>อุปกรณ์ที่พร้อมให้ยืม</h3>
          <h2>8</h2>
          <p>พร้อมสำหรับการยืม</p>
        </div>
        <div className="stat-card">
          <FaRegClock className="stat-icon" />
          <h3>คำขอที่รอการอนุมัติ</h3>
          <h2>2</h2>
          <p>กำลังรอการอนุมัติ</p>
        </div>
        <div className="stat-card">
          <FaRegCheckCircle className="stat-icon" />
          <h3>คำขอที่ได้รับอนุมัติ</h3>
          <h2>2</h2>
          <p>กำลังยืมอยู่</p>
        </div>
      </section>

      <h3 className="section-title">Quick Menu</h3>
      <section className="quick-menu-grid">
        {/* กดปุ่มนี้แล้วสลับไปหน้า equipment */}
        <div className="quick-card" onClick={() => setActiveTab('equipment')}>
          <div className="q-icon q-blue"><FaBoxOpen /></div>
          <h4>ดูรายการอุปกรณ์</h4>
          <p>ดูอุปกรณ์ที่สามารถยืมได้</p>
        </div>
        {/* กดปุ่มนี้แล้วสลับไปหน้า equipment */}
        <div className="quick-card" onClick={() => setActiveTab('equipment')}>
          <div className="q-icon q-green"><FaPlus /></div>
          <h4>ยืมอุปกรณ์</h4>
          <p>ส่งคำขอยืมใหม่</p>
        </div>
        <div className="quick-card">
          <div className="q-icon q-purple"><FaClipboardList /></div>
          <h4>คำขอยืมของฉัน</h4>
          <p>ตรวจสอบสถานะการยืม</p>
        </div>
        <div className="quick-card">
          <div className="q-icon q-orange"><FaUndoAlt /></div>
          <h4>คืนอุปกรณ์</h4>
          <p>คืนอุปกรณ์ที่ยืม</p>
        </div>
      </section>

      <div className="recent-list">
        <h3 className="section-title">คำขอยืมล่าสุด</h3>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '-10px', marginBottom: '15px' }}>รายการคำขอยืมอุปกรณ์ล่าสุดของคุณ</p>
        
        <div className="list-item">
          <div className="list-info">
            <h4>กล้องถ่ายภาพ</h4>
            <p>2026-03-06 ถึง 2026-03-10</p>
          </div>
          <span className="badge approved">อนุมัติแล้ว</span>
        </div>

        <div className="list-item">
          <div className="list-info">
            <h4>โปรเจกเตอร์</h4>
            <p>2026-03-08 ถึง 2026-03-12</p>
          </div>
          <span className="badge pending">รอการอนุมัติ</span>
        </div>
      </div>
    </>
  );

  // ================= ส่วนแสดงผลหน้าจอ รายการอุปกรณ์ =================
  const renderEquipmentList = () => (
    <>
      <div className="equipment-header-section">
        <h2>รายการอุปกรณ์</h2>
        <p>เลือกดูและยืมอุปกรณ์ที่พร้อมใช้งาน</p>
      </div>

      <div className="controls">
        <input type="text" placeholder="🔍 ค้นหาอุปกรณ์..." className="search-input" />
        <select className="category-select">
          <option>ทุกหมวดหมู่</option>
          <option>อุปกรณ์ถ่ายภาพ</option>
          <option>อุปกรณ์เสียง</option>
          <option>อุปกรณ์นำเสนอ</option>
          <option>อุปกรณ์คอมพิวเตอร์</option>
        </select>
      </div>

      <div className="equipment-grid">
          {equipments.map((item) => (
            <div className="equipment-card" key={item.id}>
              <div className="equip-img-container">
                <span className="equip-badge">{item.category}</span>
                <img src={item.image_url} alt={item.name} />
              </div>
              <div className="equip-info">
                <h4>{item.name}</h4>
                <p className="equip-desc">{item.description}</p>
                
                <div className="equip-status">
                  <span className="status-label">Available</span>
                  <span className="status-numbers">{item.available} / {item.total}</span>
                </div>
                
                <button className="borrow-btn">Borrow</button>
              </div>
            </div>
          ))}
        </div>
    </>
  );

  return (
    <div className="dashboard-container">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon"><FaGraduationCap /></div>
          <div>
            <div className="system-name">Equipment<br/>System</div>
            <div className="system-sub">University Club</div>
          </div>
        </div>

        <div className="user-profile-sidebar">
          <div className="avatar">{getInitial(userData.fullName)}</div>
          <div className="user-info">
            <p>{userData.fullName}</p>
            <span>รหัสนักศึกษา: {userData.id}</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            <FaThLarge /> แดชบอร์ด
          </li>
          <li 
            className={activeTab === 'equipment' ? 'active' : ''} 
            onClick={() => setActiveTab('equipment')}
          >
            <FaBoxOpen /> รายการอุปกรณ์
          </li>
          <li><FaClipboardList /> คำขอยืมของฉัน</li>
          <li><FaUndoAlt /> คืนอุปกรณ์</li>
        </ul>

        {/* ปุ่ม Logout ดันไปอยู่ล่างสุด */}
        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee' }}>
          <div 
            style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={handleLogout}
          >
             <FaSignOutAlt /> ออกจากระบบ
          </div>
        </div>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="main-content">
        {/* เช็คว่า activeTab คืออะไร ก็ให้ Render ส่วนนั้นออกมา */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'equipment' && renderEquipmentList()}
      </main>
    </div>
  );
}

export default User;