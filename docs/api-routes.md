
# API Routes (Base: `/api`)

## Health
- `GET /health` — ตรวจสอบสถานะ API

## Authentication
- `POST /auth/register` — สมัครสมาชิก (user)
- `POST /auth/login` — เข้าสู่ระบบ (user, admin)

## Categories (หมวดหมู่อุปกรณ์)
- `GET /categories` — ดูหมวดหมู่ทั้งหมด
- `POST /categories` — เพิ่มหมวดหมู่ (admin)
- `DELETE /categories/:id` — ลบหมวดหมู่ (admin)

## Equipment (อุปกรณ์)
- `GET /equipment?search=&category=` — ค้นหา/กรองอุปกรณ์ (รองรับ query param)
- `POST /equipment` — เพิ่มอุปกรณ์ (admin)
- `PUT /equipment/:id` — แก้ไขอุปกรณ์ (admin)
- `DELETE /equipment/:id` — ลบอุปกรณ์ (admin)

## Borrow (การยืม-คืน)
- `POST /borrow/request` — ส่งคำขอยืม (user)
- `GET /borrow/user` — ดูประวัติยืมของตนเอง (user)
- `GET /borrow/all` — ดูคำขอยืมทั้งหมด (admin)
- `GET /borrows/history?page=&limit=` — ดูประวัติยืม-คืนที่เสร็จสิ้น (admin, รองรับ pagination)
- `DELETE /borrow/completed` — ลบประวัติยืม-คืนที่เสร็จสิ้น (admin)
- `PUT /borrow/approve/:id` — อนุมัติคำขอยืม (admin)
- `PUT /borrow/reject/:id` — ปฏิเสธคำขอยืม (admin)
- `PUT /borrow/return/:id` — แจ้งคืนอุปกรณ์ (user)
- `PUT /borrow/confirm-return/:id` — ยืนยันการคืน (admin)

## Dashboards (สรุปข้อมูล)
- `GET /dashboard/user` — dashboard นักศึกษา (user)
- `GET /dashboard/admin` — dashboard ผู้ดูแล (admin)

## Admin Users (จัดการผู้ใช้)
- `GET /admin/users` — ดูรายชื่อนักศึกษาทั้งหมด (admin)
- `DELETE /admin/users/:id` — ลบบัญชีนักศึกษา (admin)

---
### หมายเหตุสำคัญ
- (admin) = ต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแล
- (user) = ต้องเข้าสู่ระบบด้วยบัญชีนักศึกษา
- `/equipment` รองรับ query param: `search`, `category`
- `/borrows/history` รองรับ query param: `page`, `limit` (default: 10)
- `/borrow/all`, `/borrows/history`, `/borrow/completed` เฉพาะ admin
- `/dashboard/user` เฉพาะ user, `/dashboard/admin` เฉพาะ admin
- `/borrow/request`, `/borrow/user`, `/borrow/return/:id` เฉพาะ user

อัปเดตล่าสุด: มีนาคม 2026