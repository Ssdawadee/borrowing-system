# Folder Structure Guide

เอกสารนี้อธิบายหน้าที่ของแต่ละโฟลเดอร์และไฟล์หลักในโปรเจคปัจจุบัน

## Root

- `backend/` — ระบบหลังบ้าน (API, business logic, database access)
- `frontend/` — ระบบหน้าเว็บ (UI, routing, state, API client)
- `database/` — SQL สำหรับสร้าง schema และ seed ข้อมูลตั้งต้น
- `docs/` — เอกสารประกอบโปรเจค (API, role, auth, UI)
- `SRS/` — เอกสาร Software Requirements Specification

## backend/

- `src/app.ts` — จุดเริ่มต้น Express server
- `src/config/` — config environment และ database
  - `database.ts` — initialize DB + migration/repair logic
  - `env.ts` — โหลด config จาก environment
- `src/middleware/` — middleware กลาง
  - `authMiddleware.ts` — ตรวจ JWT
  - `roleMiddleware.ts` — ตรวจสิทธิ์ตาม role
  - `errorMiddleware.ts` — จัดการ error response
- `src/routes/` — รวม API routes หลัก
  - `index.ts` — รวม route ของระบบทั้งหมด
- `src/types.ts` — type กลางที่ backend ใช้ร่วมกัน
- `express.d.ts` — ขยาย type Express (ถ้ามี)

## frontend/

- `src/main.tsx` — entrypoint React app
- `src/App.tsx` — root component + route mapping + page composition
- `src/runtime/` — โค้ด UI/runtime ที่ใช้งานจริง
  - `components/` — component ที่ใช้งานซ้ำ (layout, stat card)
  - `lib/` — utility หลัก เช่น API client, auth storage
  - `styles.css` — สไตล์หลักฝั่ง runtime
  - `types.ts` — type กลางของ frontend
- `public/` — static assets

## database/

- `migrations/initial-schema.sql` — schema ฐานข้อมูลเริ่มต้น
- `seeds/seed-data.sql` — ข้อมูลตั้งต้น (admin/equipment)

## docs/

- `api-routes.md` — สรุปเส้นทาง API ที่ใช้งานจริง
- `authentication.md` — การ login/register/JWT/role guard
- `user-roles.md` — สิทธิ์ของ `admin` และ `user`
- `ui-design.md` — โครงหน้าและฟีเจอร์ UI ที่ใช้งานจริง
- `folder-structure.md` — เอกสารนี้

## หมายเหตุ

- ปัจจุบันโปรเจคตั้งค่าเป็น npm-only สำหรับการรันและ build
- โฟลเดอร์/ไฟล์ที่ไม่ได้ใช้งานจริงถูกลบออกแล้วเพื่อความกระชับ
# Folder Structure Guide

เอกสารนี้อธิบายหน้าที่ของแต่ละโฟลเดอร์และไฟล์หลักในโปรเจคปัจจุบัน

## Root

- `backend/` — ระบบหลังบ้าน (API, business logic, database access)
- `frontend/` — ระบบหน้าเว็บ (UI, routing, state, API client)
- `database/` — SQL สำหรับสร้าง schema และ seed ข้อมูลตั้งต้น
- `docs/` — เอกสารประกอบโปรเจค (API, role, auth, UI)
- `SRS/` — เอกสาร Software Requirements Specification

## backend/

- `src/app.ts` — จุดเริ่มต้น Express server
- `src/config/` — config environment และ database
  - `database.ts` — initialize DB + migration/repair logic
  - `env.ts` — โหลด config จาก environment
- `src/middleware/` — middleware กลาง
  - `authMiddleware.ts` — ตรวจ JWT
  - `roleMiddleware.ts` — ตรวจสิทธิ์ตาม role
  - `errorMiddleware.ts` — จัดการ error response
- `src/routes/` — รวม API routes หลัก
  - `index.ts` — รวม route ของระบบทั้งหมด
- `src/types.ts` — type กลางที่ backend ใช้ร่วมกัน
- `express.d.ts` — ขยาย type Express (ถ้ามี)

## frontend/

- `src/main.tsx` — entrypoint React app
- `src/App.tsx` — root component + route mapping + page composition
- `src/runtime/` — โค้ด UI/runtime ที่ใช้งานจริง
  - `components/` — component ที่ใช้งานซ้ำ (layout, stat card)
  - `lib/` — utility หลัก เช่น API client, auth storage
  - `styles.css` — สไตล์หลักฝั่ง runtime
  - `types.ts` — type กลางของ frontend
- `public/` — static assets

## database/

- `migrations/initial-schema.sql` — schema ฐานข้อมูลเริ่มต้น
- `seeds/seed-data.sql` — ข้อมูลตั้งต้น (admin/equipment)

## docs/

- `api-routes.md` — สรุปเส้นทาง API ที่ใช้งานจริง
- `authentication.md` — การ login/register/JWT/role guard
- `user-roles.md` — สิทธิ์ของ `admin` และ `user`
- `ui-design.md` — โครงหน้าและฟีเจอร์ UI ที่ใช้งานจริง
- `folder-structure.md` — เอกสารนี้

## หมายเหตุ

- ปัจจุบันโปรเจคตั้งค่าเป็น npm-only สำหรับการรันและ build
- โฟลเดอร์/ไฟล์ที่ไม่ได้ใช้งานจริงถูกลบออกแล้วเพื่อความกระชับ
