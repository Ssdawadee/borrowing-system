# API Routes

เอกสารนี้สรุปเส้นทาง API ที่ใช้งานจริงในโปรเจค (base path: `/api`)

## Health

- `GET /health`

## Authentication

- `POST /auth/register`
- `POST /auth/login`

## Categories

- `GET /categories`
- `POST /categories` (admin)
- `DELETE /categories/:id` (admin)

## Equipment

- `GET /equipment`
- `POST /equipment` (admin)
- `PUT /equipment/:id` (admin)
- `DELETE /equipment/:id` (admin)

## Borrow

- `POST /borrow/request` (user)
- `GET /borrow/user` (user)
- `GET /borrow/all` (admin)
- `GET /borrows/history` (admin)
- `DELETE /borrow/completed` (admin)
- `PUT /borrow/approve/:id` (admin)
- `PUT /borrow/reject/:id` (admin)
- `PUT /borrow/return/:id` (user)
- `PUT /borrow/confirm-return/:id` (admin)

## Dashboards

- `GET /dashboard/user` (user)
- `GET /dashboard/admin` (admin)

## Admin Users

- `GET /admin/users` (admin)
- `DELETE /admin/users/:id` (admin)

---
### หมายเหตุ

- เส้นทางที่มี (admin) ต้องใช้บัญชีผู้ดูแลระบบ
- เส้นทางที่มี (user) ต้องเข้าสู่ระบบด้วยบัญชีนักศึกษา
- `/borrow/all` และ `/borrows/history` เป็น endpoint สำหรับ admin (ดู backend/src/routes/index.ts)
- `/dashboard/user` และ `/dashboard/admin` เป็น dashboard summary

อัปเดตล่าสุด: มีนาคม 2026