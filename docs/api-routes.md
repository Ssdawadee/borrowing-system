# API Routes

เอกสารนี้สรุปเส้นทาง API ที่ใช้งานจริงในโปรเจกต์ (base path: `/api`)

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

## Borrow Flow

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

## Notes

- เส้นทางที่ระบุ `(admin)` ต้องใช้บัญชีผู้ดูแล
- เส้นทางที่ระบุ `(user)` ต้องเข้าสู่ระบบด้วยบัญชีนักศึกษา