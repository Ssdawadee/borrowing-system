# ENG-borrowing (ระบบยืม-คืนอุปกรณ์ สโมสรวิศวกรรมศาสตร์)

ENG-borrowing คือโปรเจกต์ Full-stack สำหรับจัดการการยืมอุปกรณ์ของสโมสรวิศวกรรมศาสตร์ รองรับผู้ใช้งาน 2 บทบาท: นักศึกษา และผู้ดูแลระบบ (Admin) โดยโปรเจกต์นี้รันแบบ local ได้ด้วย npm

## เทคโนโลยีที่ใช้

- Frontend: React, Vite, TailwindCSS, Axios, React Router
- Backend: Node.js, Express, TypeScript, JWT Authentication
- Database: SQLite

## โฟลเดอร์หลัก

```text
frontend
backend
docs
database
SRS
```

## Figma Prototype

[Borrowing System UI Design (Figma)](https://www.figma.com/design/d4FDjq7YZdyXxx2e21fG81/borrowing-system?node-id=0-1&p=f&t=uwtiGc8sk1zhqP5I-0)

## ความสามารถของระบบ

- สมัครสมาชิกและเข้าสู่ระบบด้วย JWT
- หน้าสรุปของนักศึกษาพร้อมแจ้งเตือนใกล้ครบกำหนด
- รายการอุปกรณ์พร้อมค้นหาและกรองตามหมวดหมู่
- ลำดับสถานะการยืม: `PENDING -> APPROVED -> RETURN_PENDING -> RETURNED`
- หน้าสรุปของผู้ดูแลพร้อมสถิติสำคัญ
- จัดการผู้ใช้สำหรับผู้ดูแล (ดูรายชื่อ/ติดตามสถานะการยืม/ลบบัญชีตามเงื่อนไข)
- จัดการอุปกรณ์สำหรับผู้ดูแล
- จัดการหมวดหมู่สำหรับผู้ดูแล
- ผู้ดูแลอนุมัติคำขอยืมและยืนยันการคืน
- สถานะสภาพอุปกรณ์: `NORMAL` หรือ `DAMAGED`

## บัญชีเริ่มต้น

- Admin
  - Email: `admin@club.com`
  - Password: `admin123`
- บัญชีนักศึกษา
  - สมัครใหม่ผ่านหน้า Register (ใช้รหัสนิสิตขึ้นต้น `b` + ตัวเลข 10 หลัก)

## วิธีรันด้วย npm

เปิด 2 terminal จากโฟลเดอร์หลักของโปรเจกต์

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

URL ที่ใช้:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## การตั้งค่า Environment

สามารถคัดลอก `.env.example` เป็น `.env` เพื่อปรับค่าเองได้ แต่โปรเจกต์สามารถรันด้วยค่าเริ่มต้นในโค้ดได้เลย

ตัวอย่างค่า:

```env
PORT=5000
JWT_SECRET=super-secret-university-key
TOKEN_EXPIRES_IN=7d
DATABASE_PATH=./backend/data/university-club.db
CORS_ORIGIN=*
REMINDER_DAYS=3
VITE_API_URL=http://localhost:5000/api
```

## การทดสอบหลายเครื่อง (สำคัญ)

ถ้าทดสอบจากหลายคอมพิวเตอร์ ต้องให้ frontend ทุกเครื่องเรียก backend และฐานข้อมูลชุดเดียวกัน

ใช้หนึ่งเครื่องเป็น server:

1. เปิด backend บนเครื่อง server (`npm run dev` ใน `backend`)
2. เปิด frontend บนเครื่อง server หรือ host static frontend ที่เครื่องนั้น
3. บนเครื่องลูก ให้ตั้งค่า `VITE_API_URL` เป็น IP ของเครื่อง server เช่น:

```env
VITE_API_URL=http://192.168.1.10:5000/api
```

ถ้าแต่ละเครื่องรัน backend ของตัวเองที่ `localhost:5000` ข้อมูลจะถูกแยกกัน และคำขอยืมจะไม่เห็นข้ามเครื่อง

## API สำคัญ

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/categories`
- `POST /api/categories`
- `DELETE /api/categories/:id`
- `GET /api/equipment`
- `POST /api/equipment`
- `PUT /api/equipment/:id`
- `DELETE /api/equipment/:id`
- `POST /api/borrow/request`
- `GET /api/borrow/user`
- `GET /api/borrow/all`
- `GET /api/borrows/history`
- `GET /api/dashboard/user`
- `GET /api/dashboard/admin`
- `PUT /api/borrow/approve/:id`
- `PUT /api/borrow/reject/:id`
- `PUT /api/borrow/return/:id`
- `PUT /api/borrow/confirm-return/:id`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

## หมายเหตุ

- ระบบจะสร้างไฟล์ฐานข้อมูล SQLite อัตโนมัติเมื่อเปิด backend ครั้งแรก
- ระบบจะ seed ข้อมูลเริ่มต้นอัตโนมัติเฉพาะตอนฐานข้อมูลยังว่าง
- โฟลเดอร์ `SRS` ใช้เก็บเอกสาร Software Requirements Specification ของโปรเจกต์