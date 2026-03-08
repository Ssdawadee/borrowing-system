import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, FaThLarge, FaBoxOpen, FaClipboardList, FaUndoAlt,
  FaCube, FaRegClock, FaRegCheckCircle, FaPlus, FaSignOutAlt
} from "react-icons/fa";
import './User.css';
import Swal from 'sweetalert2';
import axios from 'axios';

function User() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: 'ผู้ใช้งาน', id: 'N/A' });
  
  // สร้าง State สำหรับเก็บว่าตอนนี้เปิดหน้าไหนอยู่ (เริ่มต้นที่หน้าแดชบอร์ด)
  const [activeTab, setActiveTab] = useState('dashboard');
  // 💡 ย้าย State 2 ตัวนี้ขึ้นมาไว้บนสุด เพื่อให้เรียกใช้ได้ไม่มีปัญหา
  const [myRequests, setMyRequests] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [dbEquipments, setDbEquipments] = useState([]); // เก็บข้อมูลจาก Database ทับ Mock data
  const [searchQuery, setSearchQuery] = useState(''); // เก็บคำค้นหา
  const [selectedCategory, setSelectedCategory] = useState('ทุกหมวดหมู่'); // เก็บหมวดหมู่ที่เลือก
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

  // ดึงข้อมูลเมื่อผู้ใช้กดเข้ามาหน้า "คำขอยืมของฉัน" หรือ "คืนอุปกรณ์"
  useEffect(() => {
    if ((activeTab === 'myRequests' || activeTab === 'returnEquipment') && userData.id !== 'N/A') {
      setIsLoading(true);
      axios.get(`https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/my-requests/${userData.id}`)
        .then((response) => {
          setMyRequests(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching requests:", error);
          setIsLoading(false);
        });
    }
  }, [activeTab, userData.id]);

  useEffect(() => {
    if (activeTab === 'equipment') {
      setIsLoading(true);
      // เปลี่ยน URL ตรงนี้เป็น API ดึงรายการอุปกรณ์ของคุณ
      axios.get('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/equipments') 
        .then((response) => {
          setDbEquipments(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching equipments:", error);
          setIsLoading(false);
        });
    }
  }, [activeTab]);

  const filteredEquipments = dbEquipments.filter((item) => {
    // ป้องกันกรณี description เป็น null
    const desc = item.description || item.desc || ""; 
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      desc.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'ทุกหมวดหมู่' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

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
        <div className="quick-card" onClick={() => setActiveTab('equipment')}>
          <div className="q-icon q-blue"><FaBoxOpen /></div>
          <h4>ดูรายการอุปกรณ์</h4>
          <p>ดูอุปกรณ์ที่สามารถยืมได้</p>
        </div>
        <div className="quick-card" onClick={() => setActiveTab('equipment')}>
          <div className="q-icon q-green"><FaPlus /></div>
          <h4>ยืมอุปกรณ์</h4>
          <p>ส่งคำขอยืมใหม่</p>
        </div>
        <div className="quick-card" onClick={() => setActiveTab('myRequests')}>
          <div className="q-icon q-purple"><FaClipboardList /></div>
          <h4>คำขอยืมของฉัน</h4>
          <p>ตรวจสอบสถานะการยืม</p>
        </div>
        <div className="quick-card" onClick={() => setActiveTab('returnEquipment')}>
          <div className="q-icon" style={{ backgroundColor: '#ff7eb3', color: 'white' }}><FaUndoAlt /></div>
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
        <input 
          type="text" 
          placeholder="🔍 ค้นหาอุปกรณ์..." 
          className="search-input" 
          value={searchQuery} // 💡 ผูกค่ากับ State
          onChange={(e) => setSearchQuery(e.target.value)} // 💡 อัปเดตเมื่อพิมพ์
        />
        <select 
          className="category-select"
          value={selectedCategory} // 💡 ผูกค่ากับ State
          onChange={(e) => setSelectedCategory(e.target.value)} // 💡 อัปเดตเมื่อเลือก
        >
          <option value="ทุกหมวดหมู่">ทุกหมวดหมู่</option>
          <option value="อุปกรณ์ถ่ายภาพ">อุปกรณ์ถ่ายภาพ</option>
          <option value="อุปกรณ์เสียง">อุปกรณ์เสียง</option>
          <option value="อุปกรณ์นำเสนอ">อุปกรณ์นำเสนอ</option>
          <option value="อุปกรณ์คอมพิวเตอร์">อุปกรณ์คอมพิวเตอร์</option>
        </select>
      </div>

      <div className="equipment-grid">
        {isLoading ? (
           <p style={{ textAlign: 'center', width: '100%', padding: '20px' }}>กำลังโหลดข้อมูลอุปกรณ์...</p>
        ) : filteredEquipments.length > 0 ? (
          filteredEquipments.map((item) => (
            <div className="equipment-card" key={item.id}>
              <div className="equip-img-container">
                <span className="equip-badge">{item.category}</span>
                {/* 💡 ดึงรูปจาก Database (ใช้ image_url) */}
                <img src={item.image_url} alt={item.name} />
              </div>
              <div className="equip-info">
                <h4>{item.name}</h4>
                <p className="equip-desc">{item.description}</p>
                
                <div className="equip-status">
                  <span className="status-label">Available</span>
                  <span className="status-numbers">{item.available} / {item.total}</span>
                </div>
                
                <button 
                  className="borrow-btn" 
                  onClick={() => handleBorrowClick(item)}
                  disabled={item.available <= 0} // 💡 ป้องกันการกดถ้ายอดคงเหลือเป็น 0
                  style={{ opacity: item.available <= 0 ? 0.5 : 1, cursor: item.available <= 0 ? 'not-allowed' : 'pointer' }}
                >
                  {item.available > 0 ? 'Borrow' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', width: '100%', padding: '20px', color: '#888' }}>
            ไม่พบอุปกรณ์ที่ค้นหา
          </p>
        )}
        </div>
    </>
  );
  
  // ฟังก์ชันสำหรับจัดการตอนกดปุ่ม Borrow 
  const handleBorrowClick = (equipment) => {
    const imgUrl = equipment.image_url || equipment.img;
    const desc = equipment.description || equipment.desc;

    Swal.fire({
      width: '600px', 
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: 'ส่งคำขอยืม',
      cancelButtonText: 'ยกเลิก',      
      confirmButtonColor: '#800000', 
      cancelButtonColor: '#f1f5f9',
      customClass: {
        cancelButton: 'text-dark' 
      },
      html: `
        <div style="text-align: left; font-family: 'Kanit', sans-serif;">
          <h2 style="margin-top: 0; margin-bottom: 5px; font-size: 24px; color: #800000;">คำขอยืมอุปกรณ์</h2>
          <p style="color: #666; margin-top: 0; margin-bottom: 20px; font-size: 14px;">กรอกข้อมูลเพื่อส่งคำขอยืมอุปกรณ์</p>

          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; gap: 15px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <img src="${imgUrl}" alt="${equipment.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;" />
            <div style="display: flex; flex-direction: column; justify-content: center;">
              <h4 style="margin: 0; font-size: 18px; color: #1e293b;">${equipment.name}</h4>
              <p style="margin: 4px 0; color: #64748b; font-size: 14px;">${desc}</p>
              <div>
                <span style="display: inline-block; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0;">
                  ${equipment.category}
                </span>
              </div>
            </div>
          </div>

          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fafafa;">
            <h4 style="margin-top: 0; margin-bottom: 5px; color: #1e293b; font-size: 16px;">ข้อมูลการยืม</h4>
            <p style="margin-top: 0; margin-bottom: 15px; color: #64748b; font-size: 13px;">กรุณาระบุวันที่และเหตุผลในการยืมอุปกรณ์</p>

            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: #1e293b;">วันที่ยืม</label>
                <input type="date" id="borrowDate" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-family: 'Kanit', sans-serif;" />
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: #1e293b;">วันที่คืน</label>
                <input type="date" id="returnDate" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-family: 'Kanit', sans-serif;" />
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: #1e293b;">เหตุผลในการยืม</label>
              <textarea id="borrowReason" rows="3" placeholder="กรุณาระบุเหตุผลและวัตถุประสงค์ในการนำอุปกรณ์ชิ้นนี้ไปใช้งาน..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-family: 'Kanit', sans-serif; resize: none;"></textarea>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const borrowDate = document.getElementById('borrowDate').value;
        const returnDate = document.getElementById('returnDate').value;
        const reason = document.getElementById('borrowReason').value;

        if (!borrowDate || !returnDate || !reason) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องครับ');
          return false;
        }

        if (new Date(borrowDate) > new Date(returnDate)) {
          Swal.showValidationMessage('วันที่คืน ต้องอยู่หลังวันที่ยืมครับ');
          return false;
        }

        const requestData = {
          equipment_id: equipment.id, 
          user_id: userData.id,       
          borrow_date: borrowDate, 
          return_date: returnDate, 
          reason: reason          
        };

        try {
          const response = await axios.post('https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/borrow', requestData);
          return response.data;
        } catch (error) {
          Swal.showValidationMessage(`เกิดข้อผิดพลาด: ${error.response?.data?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'ส่งคำขอสำเร็จ!',
          text: 'ระบบได้รับคำขอยืมของคุณเรียบร้อยแล้ว รอแอดมินอนุมัตินะครับ',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
      }
    });
  };

  // ================= ส่วนแสดงผลหน้าจอ คำขอยืมของฉัน =================
  const renderMyRequests = () => {
    const total = myRequests.length;
    const pending = myRequests.filter(r => r.status === 'pending').length;
    const approved = myRequests.filter(r => r.status === 'approved').length;
    const rejected = myRequests.filter(r => r.status === 'rejected').length;

    const getStatusDisplay = (status) => {
      switch(status) {
        case 'approved': return { text: 'อนุมัติแล้ว', className: 'status-approved' };
        case 'rejected': return { text: 'ไม่อนุมัติ', className: 'status-rejected' };
        default: return { text: 'รอการอนุมัติ', className: 'status-pending' };
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    return (
      <div className="my-requests-section">
        <div className="equipment-header-section">
          <h2>คำขอการยืมของฉัน</h2>
          <p>ติดตามสถานะคำขอการยืมอุปกรณ์ของคุณ</p>
        </div>

        <div className="history-container">
          <div className="history-header">
            <h3>ประวัติการขอยืม</h3>
            <p>คำขอยืมทั้งหมดของคุณและสถานะปัจจุบัน</p>
          </div>
          
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>กำลังโหลดข้อมูล...</p>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>อุปกรณ์</th>
                    <th>วันที่ยืม</th>
                    <th>วันที่คืน</th>
                    <th>เหตุผลในการยืม</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.length > 0 ? (
                    myRequests.map((req) => {
                      const statusInfo = getStatusDisplay(req.status);
                      return (
                        <tr key={req.id}>
                          <td style={{ fontWeight: '500' }}>{req.equipment_name}</td>
                          <td>{formatDate(req.borrow_date)}</td>
                          <td>{formatDate(req.return_date)}</td>
                          <td className="reason-cell">{req.reason}</td>
                          <td>
                            <span className={`status-badge ${statusInfo.className}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        ไม่มีประวัติการขอยืม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="summary-cards-container">
          <div className="summary-card">
            <h4>คำขอยืมทั้งหมด</h4>
            <h2>{total}</h2>
          </div>
          <div className="summary-card">
            <h4>รอการอนุมัติ</h4>
            <h2 style={{ color: '#f59e0b' }}>{pending}</h2>
          </div>
          <div className="summary-card">
            <h4>อนุมัติแล้ว</h4>
            <h2 style={{ color: '#10b981' }}>{approved}</h2>
          </div>
          <div className="summary-card">
            <h4>ไม่อนุมัติ</h4>
            <h2 style={{ color: '#ef4444' }}>{rejected}</h2>
          </div>
        </div>
      </div>
    );
  };

  // ================= ส่วนแสดงผลหน้าจอ คืนอุปกรณ์ (แยกออกมาอย่างถูกต้อง) =================
  const renderReturnEquipment = () => {
    const activeBorrows = myRequests.filter(req => req.status === 'approved');

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const handleConfirmReturn = (request) => {
      Swal.fire({
        title: 'ยืนยันการส่งคืน?',
        text: `คุณแน่ใจหรือไม่ว่าได้ส่งคืน "${request.equipment_name}" แล้ว?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#800000',
        cancelButtonColor: '#e2e8f0',
        confirmButtonText: 'ใช่, ส่งคืนแล้ว',
        cancelButtonText: 'ยกเลิก',
        customClass: { cancelButton: 'text-dark' },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await axios.put(`https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev/api/return/${request.id}`);
            return true;
          } catch (error) {
            Swal.showValidationMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            return false;
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('สำเร็จ!', 'บันทึกการคืนอุปกรณ์เรียบร้อยแล้ว', 'success');
          setMyRequests(prev => prev.map(item => item.id === request.id ? { ...item, status: 'returned' } : item));
        }
      });
    };

    return (
      <div className="return-section">
        <div className="equipment-header-section">
          <h2>การคืนอุปกรณ์</h2>
          <p>คืนอุปกรณ์ที่คุณยืมไป</p>
        </div>

        <div className="return-container">
          <div className="return-list-box">
            <h3 className="box-title">รายการที่ยืมอยู่ในปัจจุบัน</h3>
            <p className="box-subtitle">คลิกปุ่มคืนสินค้าเพื่อทำเครื่องหมายว่าได้คืนสินค้าแล้ว</p>
            
            {isLoading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>กำลังโหลดข้อมูล...</p>
            ) : activeBorrows.length > 0 ? (
              activeBorrows.map(req => (
                <div className="return-item-card" key={req.id}>
                  <div className="return-item-info">
                    <h4>{req.equipment_name}</h4>
                    <p>วันที่ยืม: <span>{formatDate(req.borrow_date)}</span></p>
                    <p>กำหนดคืน: <span>{formatDate(req.return_date)}</span></p>
                    <p>เหตุผล: <span>{req.reason}</span></p>
                  </div>
                  <button className="btn-confirm-return" onClick={() => handleConfirmReturn(req)}>
                    <FaRegCheckCircle /> ยืนยันการคืน
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-return-state">
                <p>ไม่มีอุปกรณ์ที่คุณกำลังยืมอยู่ในขณะนี้ 🎉</p>
              </div>
            )}
          </div>

          <div className="return-instructions-box">
            <h3 className="box-title" style={{ fontSize: '15px' }}>คำแนะนำในการส่งคืน</h3>
            <ul>
              <li>โปรดตรวจสอบให้แน่ใจว่าอุปกรณ์ทุกชิ้นอยู่ในสภาพดีก่อนส่งคืน</li>
              <li>โปรดส่งคืนอุปกรณ์ไปยังสำนักงานสโมสรในช่วงเวลาทำการ</li>
              <li>โปรดแนบอุปกรณ์เสริมและบรรจุภัณฑ์เดิม (ถ้ามี) มาด้วย</li>
              <li>คลิก "ยืนยันการส่งคืน" เฉพาะหลังจากส่งคืนอุปกรณ์แล้วเท่านั้น</li>
              <li>การส่งคืนล่าช้าอาจส่งผลต่อสิทธิ์การยืมในอนาคตของคุณ</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

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
          <li 
            className={activeTab === 'myRequests' ? 'active' : ''} 
            onClick={() => setActiveTab('myRequests')}
          >
            <FaClipboardList /> คำขอยืมของฉัน
          </li>
          <li 
            className={activeTab === 'returnEquipment' ? 'active' : ''} 
            onClick={() => setActiveTab('returnEquipment')}
          >
            <FaUndoAlt /> คืนอุปกรณ์
          </li>
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
        {activeTab === 'myRequests' && renderMyRequests()}
        {activeTab === 'returnEquipment' && renderReturnEquipment()}
      </main>
    </div>
  );
}

export default User;