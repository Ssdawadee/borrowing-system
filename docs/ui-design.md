# แนวทาง UI ของระบบ

เอกสารนี้สรุปโครงสร้าง UI, component และ flow ที่ใช้งานจริงใน frontend (อัปเดต มี.ค. 2026)

## โครงหน้าหลัก

- ใช้ layout หลักผ่าน `AppLayout` (sidebar + content)
- sidebar เปลี่ยนเมนูตาม role (`user`, `admin`)
- Routing หลักจัดการผ่าน React Router

## หน้าจอสำคัญ (Flow)

### นักศึกษา (user)
- หน้าเลือกประเภทการใช้งาน (LoginSelectPage)
- หน้าเข้าสู่ระบบ (LoginPage)
- หน้าสมัครสมาชิก (RegisterPage)
- dashboard นักศึกษา (UserDashboardResponse)
- รายการอุปกรณ์ (EquipmentPage)
- ประวัติการยืม (BorrowHistoryPage)
- หน้าคืนอุปกรณ์ (BorrowReturn)

### ผู้ดูแล (admin)
- dashboard ผู้ดูแล (AdminDashboardResponse)
- อนุมัติ/ปฏิเสธคำขอยืม (BorrowApprove/Reject)
- ยืนยันการคืน (BorrowConfirmReturn)
- ประวัติการยืม-คืนทั้งหมด (BorrowHistoryPage)
- จัดการหมวดหมู่ (CategoryManage)
- จัดการอุปกรณ์ (EquipmentManage)
- จัดการผู้ใช้ (UserManage)

## Component หลักที่ใช้งานจริง

- `AppLayout` — layout หลัก
- `StatCard` — การ์ดสถิติ
- `FloatingAlerts` — แจ้งเตือนลอย
- `Modal` — ยืนยัน/แจ้งเตือน
- `Table` — ตารางข้อมูล
- `Form` — ฟอร์มสมัคร/เข้าสู่ระบบ/เพิ่มข้อมูล

## พฤติกรรม UI สำคัญ

- ปุ่ม/เมนูแสดงตาม role
- หน้า admin ถูกป้องกันด้วย route guard (ตรวจ role)
- alert รองรับการแสดงซ้ำแม้ข้อความเดิม
- รองรับการค้นหา/เรียงลำดับ/กรองในหน้ารายการ
- responsive layout รองรับมือถือและ desktop

## สไตล์โดยรวม

- ธีมโทนมหาวิทยาลัย ใช้สีแดงเป็นสีหลัก
- ฟอร์มและตารางใช้รูปแบบสอดคล้องกันทั้งระบบ
- ใช้ responsive layout เพื่อรองรับหน้าจอหลายขนาด