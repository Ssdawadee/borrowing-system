# Database Overview

สรุปโครงสร้างฐานข้อมูลหลักของระบบยืม-คืนอุปกรณ์

## ตารางหลัก

### 1. users
- เก็บข้อมูลผู้ใช้ (นักศึกษา/ผู้ดูแล)
- field สำคัญ: id, student_id, name, email, phone, password, role, is_active, created_at

### 2. equipment
- เก็บข้อมูลอุปกรณ์แต่ละชิ้น
- field สำคัญ: id, name, category, description, total_quantity, available_quantity, damaged_quantity, image_url, status

### 3. categories
- เก็บหมวดหมู่อุปกรณ์
- field สำคัญ: id, name

### 4. borrows
- เก็บประวัติการยืม-คืนอุปกรณ์
- field สำคัญ: id, user_id, equipment_id, quantity, borrow_date, due_date, status, borrow_reason, return_date, approved_at, rejected_at, return_confirmed_at

## ความสัมพันธ์ (Relationship)

- ผู้ใช้ 1 คน (users) → ยืมอุปกรณ์ได้หลายรายการ (borrows)
- อุปกรณ์ 1 ชิ้น (equipment) → ถูกยืมได้หลายครั้ง (borrows)
- หมวดหมู่ 1 หมวด (categories) → มีอุปกรณ์ได้หลายชิ้น (equipment)

## ตัวอย่างความสัมพันธ์
- users.id ← borrows.user_id
- equipment.id ← borrows.equipment_id
- categories.name ← equipment.category

---

> หมายเหตุ: ระบบนี้ใช้ SQLite (หรือ RDBMS อื่น) โครงสร้างตารางอาจปรับได้ตามความต้องการ
> ตารางอื่นๆ (ถ้ามี) จะใช้สำหรับฟีเจอร์เสริม เช่น log, notification ฯลฯ
