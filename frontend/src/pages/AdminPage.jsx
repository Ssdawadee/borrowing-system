import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css"; 
import Swal from 'sweetalert2';
import { FaSignOutAlt } from 'react-icons/fa';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('equipment'); 

  // State สำหรับหน้า Dashboard
  const [stats, setStats] = useState({
    equipmentStats: { total: 0, available: 0, inUse: 0 },
    totalRequests: 0,
    pendingApprovals: 0,
    currentlyBorrowed: 0,
    recentRequests: []
  });
  
  // State สำหรับหน้าจัดการอุปกรณ์
  const [equipments, setEquipments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', description: '', image_url: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', name: '', category: '', description: '', image_url: '' });

  // 💡 [เพิ่มใหม่] State สำหรับหน้าอนุมัติคำขอ
  const [borrowRequests, setBorrowRequests] = useState([]);

  // 💡 [เพิ่มใหม่] State สำหรับหน้า Report
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    equipmentId: '',
    studentId: ''
  });
  const [reportRows, setReportRows] = useState([]);

  // URL หลักของ API
  const API_BASE_URL = 'https://stunning-system-5gx6ww6vjxqw37gwj-5000.app.github.dev';

  const authAxios = axios.create();
  const token = localStorage.getItem('token');
  if (token) {
    authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const fetchEquipments = () => {
    authAxios.get(`${API_BASE_URL}/api/admin/equipments`)
      .then(res => setEquipments(res.data))
      .catch(err => console.error(err));
  };

  // 💡 [เพิ่มใหม่] ฟังก์ชันดึงข้อมูลคำขอยืมทั้งหมด
  const fetchBorrowRequests = () => {
    authAxios.get(`${API_BASE_URL}/api/admin/requests`)
      .then(res => setBorrowRequests(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      authAxios.get(`${API_BASE_URL}/api/admin/dashboard`)
        .then(res => setStats(res.data))
        .catch(err => console.error(err));
    } else if (activeTab === 'equipment') {
      fetchEquipments();
    } else if (activeTab === 'approvals') {
      fetchBorrowRequests(); // 💡 โหลดข้อมูลเมื่อเปิดหน้า "อนุมัติคำขอ"
    } else if (activeTab === 'reports') {
      handleFetchReports();
    }
  }, [activeTab]);

  // ==================================================
  // ฟังก์ชันหมวดจัดการอุปกรณ์ (เหมือนเดิม)
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAxios.post(`${API_BASE_URL}/api/admin/equipments`, formData);
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'เพิ่มอุปกรณ์เรียบร้อยแล้ว', confirmButtonColor: '#8B1E0F', timer: 2000 });
      setIsModalOpen(false);
      setFormData({ name: '', category: '', description: '', image_url: '' });
      fetchEquipments();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเพิ่มอุปกรณ์ได้ ลองใหม่อีกครั้ง', confirmButtonColor: '#8B1E0F' });
    }
  };

  const openEditModal = (item) => {
    setEditFormData({ id: item.id, name: item.name, category: item.category, description: item.description || '', image_url: item.image_url || '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAxios.put(`${API_BASE_URL}/api/admin/equipments/${editFormData.id}`, editFormData);
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'ปรับปรุงข้อมูลอุปกรณ์เรียบร้อยแล้ว', confirmButtonColor: '#8B1E0F', timer: 2000 });
      setIsEditModalOpen(false); 
      fetchEquipments(); 
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถแก้ไขข้อมูลได้ ลองใหม่อีกครั้ง', confirmButtonColor: '#8B1E0F' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'แน่ใจหรือไม่?', text: "คุณต้องการลบอุปกรณ์ชิ้นนี้ใช่ไหม? (ลบแล้วกู้คืนไม่ได้นะ!)", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', cancelButtonColor: '#888', confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      try {
        await authAxios.delete(`${API_BASE_URL}/api/admin/equipments/${id}`);
        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'อุปกรณ์ถูกลบออกจากระบบแล้ว', confirmButtonColor: '#8B1E0F', timer: 2000 });
        fetchEquipments();
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'ลบไม่ได้!', text: error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบอุปกรณ์', confirmButtonColor: '#8B1E0F' });
      }
    }
  };

  // ==================================================
  // 💡 [เพิ่มใหม่] ฟังก์ชันจัดการสถานะคำขอยืม (อนุมัติ / ปฏิเสธ / คืนของ)
  // ==================================================
  const handleUpdateStatus = async (id, newStatus) => {
    let actionText = newStatus === 'approved' ? 'อนุมัติคำขอยืม' : newStatus === 'rejected' ? 'ไม่อนุมัติคำขอยืม' : 'รับคืนอุปกรณ์';
    let confirmColor = newStatus === 'approved' ? '#28a745' : newStatus === 'rejected' ? '#d33' : '#007bff';

    const result = await Swal.fire({
      title: `ยืนยันการ${actionText}?`,
      text: `คุณต้องการ${actionText}รายการนี้ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#888',
      confirmButtonText: `ใช่, ${actionText}`,
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await authAxios.put(`${API_BASE_URL}/api/admin/requests/${id}`, { status: newStatus });
        Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: `บันทึกการ${actionText}เรียบร้อยแล้ว`, confirmButtonColor: '#8B1E0F', timer: 2000 });
        fetchBorrowRequests(); // โหลดข้อมูลตารางใหม่
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถอัปเดตสถานะได้', confirmButtonColor: '#8B1E0F' });
      }
    }
  };

  // ==================================================
  // ฟังก์ชันออกจากระบบ
  // ==================================================
  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#888',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        // เคลียร์ข้อมูลผู้ใช้ (ถ้ามีการเก็บ Token ไว้ใน localStorage)
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
        
        // เด้งกลับไปหน้า Login (เปลี่ยน '/' เป็น path หน้าล็อกอินของคุณได้เลย)
        window.location.href = '/'; 
      }
    });
  };

  const translateStatus = (status) => {
    const statusMap = { 'pending': 'รออนุมัติ', 'approved': 'อนุมัติแล้ว', 'borrowed': 'กำลังยืม', 'returned': 'คืนแล้ว', 'rejected': 'ไม่อนุมัติ' };
    return statusMap[status] || status || 'รออนุมัติ';
  };

  // ==================================================
  // ฟังก์ชันดึงข้อมูลรายงานการยืม
  // ==================================================
  const handleFetchReports = () => {
    const params = {};
    if (reportFilters.startDate) params.startDate = reportFilters.startDate;
    if (reportFilters.endDate) params.endDate = reportFilters.endDate;
    if (reportFilters.status && reportFilters.status !== 'all') params.status = reportFilters.status;
    if (reportFilters.equipmentId) params.equipmentId = reportFilters.equipmentId;
    if (reportFilters.studentId) params.studentId = reportFilters.studentId;

    authAxios
      .get(`${API_BASE_URL}/api/admin/reports/borrows`, { params })
      .then((res) => setReportRows(res.data))
      .catch((err) => console.error('Fetch reports error', err));
  };

  // ==================================================
  // ส่วนแสดงผลหน้าจอ (Render)
  // ==================================================
  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <>
          <header>
            <h1>แดชบอร์ดผู้ดูแลระบบ</h1>
            <p>ภาพรวมสรุปข้อมูลระบบยืม-คืนอุปกรณ์</p>
          </header>
          <div className="stat-cards">
            <div className="card"><h3>อุปกรณ์ทั้งหมดในระบบ</h3><h2>{stats.equipmentStats.total}</h2><p>ชิ้น (1 รายการ = 1 ชิ้น)</p></div>
            <div className="card"><h3>คำขอยืมทั้งหมด</h3><h2>{stats.totalRequests}</h2><p>รายการในระบบ</p></div>
            <div className="card"><h3>รอการอนุมัติ</h3><h2 className="text-orange">{stats.pendingApprovals}</h2><p>รอตรวจสอบการยืม</p></div>
            <div className="card"><h3>กำลังถูกยืมไป</h3><h2 className="text-green">{stats.equipmentStats.inUse}</h2><p>ไม่อยู่ในคลัง</p></div>
          </div>
          <div className="recent-requests-section">
            <h3>รายการคำขอล่าสุด</h3>
            <div className="request-list">
              {stats.recentRequests.length > 0 ? (
                  stats.recentRequests.map(req => (
                      <div key={req.id} className="request-item">
                          <div className="req-info">
                              <h4>{req.student_id} - {req.full_name}</h4>
                              <p>{req.equipment_name} • {new Date(req.borrow_date).toLocaleDateString('th-TH')}</p>
                          </div>
                          <span className={`status-badge ${req.status || 'pending'}`}>{translateStatus(req.status)}</span>
                      </div>
                  ))
              ) : <p>ยังไม่มีรายการคำขอล่าสุด</p>}
            </div>
          </div>
        </>
      );
    } else if (activeTab === 'equipment') {
      return (
        <div className="equipment-management">
          <header className="page-header flex-between">
            <div><h1>จัดการอุปกรณ์</h1><p>เพิ่ม แก้ไข หรือลบอุปกรณ์ในระบบ</p></div>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ เพิ่มอุปกรณ์</button>
          </header>

          <div className="card table-card">
            <div className="table-header"><h3>รายการอุปกรณ์</h3><p>อุปกรณ์ทั้งหมดในระบบ</p></div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ชื่ออุปกรณ์</th><th>ประเภท</th><th>รายละเอียด</th><th>สถานะ</th><th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {equipments && equipments.length > 0 ? (
                  equipments.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="badge-gray">{item.category}</span></td>
                      <td className="desc-text">{item.description}</td>
                      <td><span className={`badge ${item.current_status === 'ว่าง' ? 'badge-green' : 'badge-orange'}`}>{item.current_status}</span></td>
                      <td className="actions">
                        <button className="icon-btn edit" onClick={() => openEditModal(item)}>✏️</button>
                        <button className="icon-btn delete" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                ) : ( <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดข้อมูล หรือยังไม่มีอุปกรณ์...</td></tr> )}
              </tbody>
            </table>
          </div>

          {/* Modal เพิ่มอุปกรณ์ */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>เพิ่มอุปกรณ์ใหม่ (1 ชิ้น)</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><label>ชื่ออุปกรณ์:</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="form-group">
                    <label>หมวดหมู่:</label>
                    <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="" disabled>-- กรุณาเลือกหมวดหมู่ --</option>
                      <option value="อุปกรณ์ถ่ายภาพ">อุปกรณ์ถ่ายภาพ</option><option value="อุปกรณ์เสียง">อุปกรณ์เสียง</option><option value="อุปกรณ์นำเสนอ">อุปกรณ์นำเสนอ</option><option value="อุปกรณ์คอมพิวเตอร์">อุปกรณ์คอมพิวเตอร์</option><option value="อุปกรณ์ทั่วไป">อุปกรณ์ทั่วไป</option>
                    </select>
                  </div>
                  <div className="form-group"><label>รายละเอียด:</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
                  <div className="form-group"><label>ลิงก์รูปภาพ (ไม่ใส่ก็ได้):</label><input type="text" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} /></div>
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                    <button type="submit" className="btn-save">บันทึกข้อมูล</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal แก้ไขอุปกรณ์ */}
          {isEditModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content edit-modal">
                <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
                <div className="modal-header"><h2 style={{ color: '#333', marginTop: '0', marginBottom: '20px' }}>แก้ไขข้อมูลอุปกรณ์</h2></div>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-grid">
                    <div className="form-group-gray"><label>ชื่ออุปกรณ์</label><input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} /></div>
                    <div className="form-group-gray">
                      <label>ประเภทอุปกรณ์</label>
                      <select required value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}>
                        <option value="อุปกรณ์ถ่ายภาพ">อุปกรณ์ถ่ายภาพ</option><option value="อุปกรณ์เสียง">อุปกรณ์เสียง</option><option value="อุปกรณ์นำเสนอ">อุปกรณ์นำเสนอ</option><option value="อุปกรณ์คอมพิวเตอร์">อุปกรณ์คอมพิวเตอร์</option><option value="อุปกรณ์ทั่วไป">อุปกรณ์ทั่วไป</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group-gray"><label>รายละเอียด</label><input type="text" value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} /></div>
                  <div className="form-group-gray"><label>ลิงก์รูปภาพ</label><input type="text" value={editFormData.image_url} onChange={(e) => setEditFormData({...editFormData, image_url: e.target.value})} /></div>
                  <div className="modal-actions edit-actions">
                    <button type="button" className="btn-cancel-gray" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</button>
                    <button type="submit" className="btn-save-red">บันทึกการแก้ไข</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    } 
    // 💡 โค้ดสำหรับหน้า "อนุมัติคำขอ"
    else if (activeTab === 'approvals') {
      return (
        <div className="approval-management">
          <header className="page-header">
            <div>
              <h1>อนุมัติคำขอยืม</h1>
              <p>จัดการคำขอยืมอุปกรณ์จากนักศึกษา</p>
            </div>
          </header>

          <div className="card table-card">
            <div className="table-header">
              <h3>รายการคำขอ</h3>
              <p>เรียงลำดับจากรายการที่รออนุมัติ</p>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ผู้ยืม</th>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม - คืน</th>
                  <th>เหตุผล</th>
                  <th>สถานะ</th>
                  <th style={{textAlign: 'center'}}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {borrowRequests && borrowRequests.length > 0 ? (
                  borrowRequests.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.student_id}</strong><br/><small style={{color: '#666'}}>{req.full_name}</small></td>
                      <td>{req.equipment_name}</td>
                      <td>
                        <small>ยืม: {new Date(req.borrow_date).toLocaleDateString('th-TH')}</small><br/>
                        <small>คืน: {new Date(req.return_date).toLocaleDateString('th-TH')}</small>
                      </td>
                      <td className="desc-text" style={{maxWidth: '150px'}}>{req.reason}</td>
                      <td><span className={`status-badge ${req.status || 'pending'}`}>{translateStatus(req.status)}</span></td>
                      
                      {/* 💡 เปลี่ยนปุ่มตรงนี้เป็น Class ใหม่ที่เพิ่งเพิ่มใน CSS */}
                      <td className="actions" style={{ verticalAlign: 'middle' }}>
                        <div className="action-group">
                          {/* แสดงปุ่ม อนุมัติ / ไม่อนุมัติ ถ้าสถานะคือ pending */}
                          {(req.status === 'pending' || !req.status) && (
                            <>
                              <button className="btn-approve" onClick={() => handleUpdateStatus(req.id, 'approved')}>✔️ อนุมัติ</button>
                              <button className="btn-reject" onClick={() => handleUpdateStatus(req.id, 'rejected')}>✖️ ปฏิเสธ</button>
                            </>
                          )}

                          {/* แสดงปุ่ม คืนของ ถ้านักศึกษายืมไปแล้ว (approved) */}
                          {req.status === 'approved' && (
                            <button className="btn-return" onClick={() => handleUpdateStatus(req.id, 'returned')}>📦 รับคืนของ</button>
                          )}

                          {/* ถ้าสถานะจบไปแล้ว (returned หรือ rejected) ไม่ต้องแสดงปุ่ม */}
                          {(req.status === 'returned' || req.status === 'rejected') && (
                            <span style={{ color: '#888', fontSize: '13px', fontWeight: 'bold', background: '#f1f1f1', padding: '6px 12px', borderRadius: '20px' }}>
                              ✓ เสร็จสิ้น
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>ไม่มีรายการคำขอยืม</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    // 💡 หน้าแสดงรายงานการยืม
    else if (activeTab === 'reports') {
      return (
        <div className="approval-management">
          <header className="page-header">
            <div>
              <h1>รายงานการยืมอุปกรณ์</h1>
              <p>กรองและดูประวัติการยืมอุปกรณ์ทั้งหมดในระบบ</p>
            </div>
          </header>

          <div className="card table-card">
            <div className="table-header">
              <h3>ตัวกรองรายงาน</h3>
              <p>เลือกช่วงวันที่ สถานะ และข้อมูลที่ต้องการ</p>
            </div>

            <div className="report-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>วันที่ยืม (เริ่มต้น)</label>
                  <input
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label>วันที่ยืม (สิ้นสุด)</label>
                  <input
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label>สถานะคำขอ</label>
                  <select
                    value={reportFilters.status}
                    onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">รออนุมัติ</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ไม่อนุมัติ</option>
                    <option value="returned">คืนแล้ว</option>
                  </select>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>รหัสอุปกรณ์ (ID)</label>
                  <input
                    type="text"
                    placeholder="เช่น 1, 2, 3"
                    value={reportFilters.equipmentId}
                    onChange={(e) => setReportFilters({ ...reportFilters, equipmentId: e.target.value })}
                  />
                </div>
                <div className="filter-group">
                  <label>รหัสนักศึกษา</label>
                  <input
                    type="text"
                    placeholder="เช่น b1234567890"
                    value={reportFilters.studentId}
                    onChange={(e) => setReportFilters({ ...reportFilters, studentId: e.target.value })}
                  />
                </div>
                <div className="filter-actions">
                  <button className="btn-primary" onClick={handleFetchReports}>
                    ดึงรายงาน
                  </button>
                  <button
                    className="btn-cancel-gray"
                    onClick={() => {
                      setReportFilters({
                        startDate: '',
                        endDate: '',
                        status: 'all',
                        equipmentId: '',
                        studentId: ''
                      });
                      setReportRows([]);
                    }}
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            </div>

            <div className="table-header" style={{ marginTop: '10px' }}>
              <h3>ผลลัพธ์รายงาน</h3>
              <p>{reportRows.length} รายการ</p>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ผู้ยืม</th>
                  <th>อุปกรณ์</th>
                  <th>วันที่ยืม - คืน</th>
                  <th>สถานะ</th>
                  <th>วันที่คืนจริง</th>
                </tr>
              </thead>
              <tbody>
                {reportRows && reportRows.length > 0 ? (
                  reportRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.student_id}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{row.full_name}</small>
                      </td>
                      <td>{row.equipment_name}</td>
                      <td>
                        <small>
                          ยืม: {new Date(row.borrow_date).toLocaleDateString('th-TH')}
                        </small>
                        <br />
                        <small>
                          กำหนดคืน: {new Date(row.return_date).toLocaleDateString('th-TH')}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge ${row.status || 'pending'}`}>
                          {translateStatus(row.status)}
                        </span>
                      </td>
                      <td>
                        {row.actual_return_date
                          ? new Date(row.actual_return_date).toLocaleDateString('th-TH')
                          : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      ยังไม่มีข้อมูลรายงานตามตัวกรองที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div>
          <div className="logo-section"><h2>ระบบจัดการอุปกรณ์</h2><p>ศูนย์ส่วนกลาง</p></div>
          <div className="admin-profile"><div className="avatar">A</div><div><h4>Admin User</h4><p>ADMIN001</p></div></div>
          <nav className="menu">
            <button className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>หน้าหลัก (Dashboard)</button>
            <button className={`menu-item ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>จัดการคลังอุปกรณ์</button>
            <button className={`menu-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>อนุมัติคำขอ</button>
            <button className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>รายงานการยืม</button>
          </nav>
        </div>

        {/* 💡 [เพิ่มใหม่] ปุ่มออกจากระบบ แยกมาอยู่ด้านล่าง */}
        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee' }}>
                  <div 
                    style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }} 
                    onClick={handleLogout}
                  >
                     <FaSignOutAlt /> ออกจากระบบ
                  </div>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminDashboard;