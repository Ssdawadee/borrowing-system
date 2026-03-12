# Folder Structure Guide

เอกสารนี้อธิบายหน้าที่ของแต่ละโฟลเดอร์หลักในโปรเจกต์

## Root

- `backend/` — ระบบหลังบ้าน (API, business logic, database access)
- `frontend/` — ระบบหน้าเว็บ (UI, routing, state, API client)
- `database/` — SQL สำหรับสร้าง schema และ seed ข้อมูลตั้งต้น
- `docs/` — เอกสารประกอบโปรเจกต์ (API, role, auth, UI)
- `SRS/` — เอกสาร Software Requirements Specification

## backend/

- `src/app.ts` — จุดเริ่มต้นของเซิร์ฟเวอร์ Express
- `src/config/` — ค่าตั้งค่า environment และการเชื่อมต่อฐานข้อมูล
  - `database.ts` — initialize DB + migration/repair logic ตอนรันจริง
  - `env.ts` — โหลดค่า config จาก environment
- `src/middleware/` — middleware กลาง
  - `authMiddleware.ts` — ตรวจ JWT
  - `roleMiddleware.ts` — ตรวจสิทธิ์ตาม role
  - `errorMiddleware.ts` — จัดการ error response
- `src/routes/` — นิยาม API routes หลัก
  - `index.ts` — รวม route ของระบบทั้งหมด
- `src/types.ts` — type กลางที่ backend ใช้ร่วมกัน
- `data/` — ไฟล์ฐานข้อมูล SQLite ตอนรัน local

## frontend/

- `src/main.tsx` — entrypoint ของ React app
- `src/App.tsx` — root component + route mapping + page composition
- `src/runtime/` — โค้ด UI/runtime ที่ใช้งานจริงปัจจุบัน
  - `components/` — component ที่ใช้ซ้ำ (เช่น layout, stat card)
  - `lib/` — utility หลัก เช่น API client, auth storage
  - `styles.css` — สไตล์หลักฝั่ง runtime
  - `types.ts` — type กลางของ frontend
- `public/` — static assets

## database/

- `migrations/initial-schema.sql` — schema ฐานข้อมูลเริ่มต้น
- `seeds/seed-data.sql` — ข้อมูลตั้งต้น (เช่น admin/equipment)

## docs/

- `api-routes.md` — สรุปเส้นทาง API ที่ใช้งานจริง
- `authentication.md` — การ login/register/JWT/role guard
- `user-roles.md` — สิทธิ์ของ `admin` และ `user`
- `ui-design.md` — โครงหน้าและพฤติกรรม UI ที่ใช้ในระบบ
- `folder-structure.md` — เอกสารนี้

## หมายเหตุ

- ปัจจุบันโปรเจกต์ตั้งค่าเป็นแนว npm-only สำหรับการรันและส่งงาน
- ไฟล์/โฟลเดอร์ที่ไม่ใช้งานจริงถูกลบออกแล้วเพื่อลดความสับสน
