<h1 align="center">📦 ENG Borrowing</h1>

<p align="center">
Web Application สำหรับจัดการการยืม–คืนอุปกรณ์
</p>

---

## 📄 Software Requirements Specification (SRS)

| Field | Detail |
|------|------|
| Project Name | Borrowing Student Club Equipment System |
| Version | 1.0 |
| Date | 21 February 2026 |
| Prepared By | Project Team |

---

## 👥 Members

- นาย สุกฤษฎิ์ คลายคลี่ 6730300604
- นางสาว ศดาวดี ทรวดทรง 6730300558
- นางสาว อุษา อุปายโกศล 6730300671
- นางสาว ปิยดารัตน์ สุพินิจ 6730301031
- นางสาว ภูริชชยาพัชร์ สุพรรณ์ 6730301066

---

## 🎨 Design Prototype

ระบบ UI ถูกออกแบบโดยใช้ **Figma**

🔗 Figma Design  
https://www.figma.com/design/d4FDjq7YZdyXxx2e21fG81/Design-Prototype-using-Figma?node-id=1-3&t=8OUYq2LAwGq2lVc5-1

Frontend ของระบบควรพัฒนาโดย **อ้างอิงจาก Design นี้**

---

## 📝 Revision History

| Version | Author | Description | Date |
|------|------|-------------|------|
| 1.0 | Project Team | First Draft | 24 Feb 2026 |

---

## 📘 Introduction

### Product Scope

ระบบ **Student Club Equipment Borrowing System** เป็น Web Application  
สำหรับจัดการ **การยืมและคืนอุปกรณ์ภายในชมรม**

ช่วยให้

- ลดความผิดพลาดจากการจดบันทึกแบบกระดาษ
- ตรวจสอบสถานะการยืมได้ง่าย
- จัดการอุปกรณ์ได้อย่างเป็นระบบ

---

## 👤 Intended Users

ระบบถูกออกแบบสำหรับผู้ใช้งาน 2 ประเภท

### User
นักศึกษาที่ต้องการยืมอุปกรณ์

### Admin
ผู้ดูแลระบบและอุปกรณ์

---

## ⚙ Functional Requirements

### User Functions

User สามารถ

- สมัครสมาชิก (Register)
- เข้าสู่ระบบ (Login)
- ดูรายการอุปกรณ์
- ยื่นคำขอยืมอุปกรณ์
- ตรวจสอบสถานะการยืม
- คืนอุปกรณ์

---

### Admin Functions

Admin สามารถ

- เพิ่ม / แก้ไข / ลบอุปกรณ์
- อนุมัติคำขอยืม
- ปฏิเสธคำขอยืม
- บันทึกการคืนอุปกรณ์
- ดูรายงานการยืม

---

## 💻 System Requirements

### Hardware

- Computer / Laptop / Smartphone
- Internet Connection

### Software

Frontend
- HTML
- CSS
- JavaScript

Backend
- Node.js
- Express

Database
- MySQL

---

## 🔧 Backend Setup

### 1. Database

- สร้างฐานข้อมูลและตารางหลักด้วยสคริปต์:
  - `backend/sql/schema.sql`
- จากนั้นรันไฟล์ migration (ตามลำดับ) เพื่อเพิ่มคอลัมน์เสริม:
  - `backend/sql/migrations/001_add_timestamps.sql`
  - `backend/sql/migrations/002_add_is_active_to_users.sql`

ตัวอย่างคำสั่ง (ใน MySQL CLI):

```sql
SOURCE backend/sql/schema.sql;
SOURCE backend/sql/migrations/001_add_timestamps.sql;
SOURCE backend/sql/migrations/002_add_is_active_to_users.sql;
```

### 2. Backend Server

- ติดตั้ง dependency ในโฟลเดอร์ `backend`:

```bash
cd backend
npm install
```

- ตั้งค่า environment (ถ้าต้องการเปลี่ยนค่ามาตรฐาน):
  - `JWT_SECRET` – secret key สำหรับเซ็น JWT
  - `JWT_EXPIRES_IN` – อายุ token (เช่น `8h`)

- รันเซิร์ฟเวอร์:

```bash
node server.js
```

Backend จะรันบนพอร์ต `5000` ตามค่าในโค้ดปัจจุบัน

---

## 🔐 Auth Model (JWT)

- ผู้ใช้ทุกประเภท (User / Admin) ต้องล็อกอินผ่าน endpoint:
  - `POST /api/login` (User – ใช้ `studentId` และ `password`)
  - `POST /api/admin/login` (Admin – ใช้ `username` = `student_id` และ `password`)
- เมื่อเข้าสู่ระบบสำเร็จ ระบบจะคืนค่า:
  - `user` – ข้อมูลผู้ใช้ (`id`, `studentId`, `fullName`, `role`)
  - `token` – JWT ที่ฝั่ง Frontend จะเก็บใน `localStorage` key `token`
- ทุก request อื่น (ยกเว้น register/login) ต้องแนบ header:

```http
Authorization: Bearer <token>
```

- Middleware ใน `backend/server.js`:
  - `authenticate` – ตรวจสอบ JWT และแนบข้อมูล `req.user`
  - `authorizeAdmin` – ตรวจสอบว่า `req.user.role === 'admin'`

---

## 🌐 Key API Endpoints (สรุป)

### User

- `POST /api/register`
  - สมัครสมาชิกใหม่ (default role = `user`)
- `POST /api/login`
  - ล็อกอินผู้ใช้ทั่วไป คืนค่า `{ user, token }`
- `GET /api/equipments`
  - ดึงรายการอุปกรณ์ทั้งหมด
- `POST /api/borrow` (ต้องแนบ JWT)
  - ส่งคำขอยืมอุปกรณ์  
  - ระบบจะเช็คไม่ให้อุปกรณ์เดียวกันถูกยืมซ้ำในสถานะ `approved` / `borrowed`
- `GET /api/my-requests/:userId` (ต้องแนบ JWT)
  - ดึงประวัติคำขอยืมของผู้ใช้แต่ละคน
- `PUT /api/return/:id` (ต้องแนบ JWT)
  - ผู้ใช้ยืนยันการคืนอุปกรณ์ของตัวเอง  
  - อนุญาตเฉพาะเมื่อคำขออยู่ในสถานะ `approved` / `borrowed` และจะตั้ง `status = 'returned'` พร้อม `actual_return_date`

### Admin – Equipment & Requests

- `POST /api/admin/login`
  - ล็อกอิน Admin คืนค่า `{ user, token }`
- `GET /api/admin/dashboard`
  - Dashboard สรุปจำนวนอุปกรณ์ / คำขอยืม / รายการล่าสุด
- `GET /api/admin/equipments`
- `POST /api/admin/equipments`
- `PUT /api/admin/equipments/:id`
- `DELETE /api/admin/equipments/:id`
  - CRUD คลังอุปกรณ์
- `GET /api/admin/requests`
  - ดึงคำขอยืมทั้งหมด (เรียงให้ `pending` ขึ้นก่อน)
- `PUT /api/admin/requests/:id`
  - อัปเดตสถานะคำขอยืม  
  - อนุญาต transition:
    - `pending -> approved / rejected`
    - `approved -> returned` (จะตั้ง `actual_return_date`)

### Admin – Users

- `GET /api/admin/users`
  - ดึงรายการผู้ใช้ทั้งหมด พร้อมตัวกรอง:
    - `role` – `user` หรือ `admin`
    - `isActive` – `1` หรือ `0`
- `PATCH /api/admin/users/:id`
  - แก้ไข `role` และ/หรือ `is_active` ของผู้ใช้ (อ้างอิง `user_id`)
- `GET /api/admin/users/:id/requests`
  - ดูประวัติการยืมของผู้ใช้รายคน (อ้างอิง `user_id`)

### Admin – Reports

- `GET /api/admin/reports/borrows`
  - Endpoint รายงานการยืมอุปกรณ์ พร้อมตัวกรอง:
    - `startDate`, `endDate` – ช่วงวันที่ยืม
    - `status` – สถานะคำขอ (`pending`, `approved`, `rejected`, `returned`, หรือ `all`)
    - `equipmentId` – รหัสอุปกรณ์
    - `studentId` – รหัสนักศึกษา
  - ใช้สำหรับหน้า Report ของ Admin ใน Frontend

---

## 🔐 Non-Functional Requirements

### Security

- ผู้ใช้ต้อง **Login ก่อนใช้งาน**
- User ไม่สามารถอนุมัติคำขอได้
- Admin เท่านั้นที่จัดการอุปกรณ์ได้

### Performance

ระบบควรตอบสนองภายใน

**≤ 3 วินาที**

### Usability

ระบบต้อง

- ใช้งานง่าย
- UI ชัดเจน
- เข้าใจได้ทันที

---

## 📚 Definitions

| Term | Meaning |
|-----|--------|
| SRS | Software Requirement Specification |
| User | นักศึกษาที่ใช้งานระบบ |
| Admin | ผู้ดูแลระบบ |
| Borrow Request | คำขอยืมอุปกรณ์ |
| CRUD | Create, Read, Update, Delete |

---

<p align="center">
✨ Borrowing Student Club Equipment System
</p>
