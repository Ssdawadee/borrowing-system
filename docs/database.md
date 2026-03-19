# Database Overview

สรุปโครงสร้างฐานข้อมูลหลักของระบบยืม-คืนอุปกรณ์

## ตารางหลัก

### 1. users
- เก็บข้อมูลผู้ใช้ (นักศึกษา/ผู้ดูแล)
- field สำคัญ: id, student_id, name, email, phone, password, role, is_active, created_at
 - ตัวอย่างข้อมูล:
	 - (1, 'ADMIN001', 'Club Administrator', 'admin@club.com', '0000000000', '***hash***', 'admin', 1, '2024-01-01 10:00:00')
 - Constraint:
	 - student_id, email: **UNIQUE**
	 - role: 'admin' หรือ 'user' (**CHECK**)
	 - is_active: 0 หรือ 1 (**CHECK**)

### 2. equipment
- เก็บข้อมูลอุปกรณ์แต่ละชิ้น
- field สำคัญ: id, name, category, description, total_quantity, available_quantity, damaged_quantity, image_url, status
 - ตัวอย่างข้อมูล:
	 - (1, 'กล้องถ่ายรูป', 'สื่อและภาพถ่าย', 'กล้อง DSLR สำหรับงานกิจกรรม', 5, 5, 0, 'https://...', 'NORMAL')
 - Constraint:
	 - category: **FOREIGN KEY** (categories.name)
	 - total_quantity, available_quantity, damaged_quantity: >= 0 (**CHECK**)
	 - status: 'NORMAL' หรือ 'DAMAGED' (**CHECK**)

### 3. categories
- เก็บหมวดหมู่อุปกรณ์
- field สำคัญ: id, name
 - ตัวอย่างข้อมูล:
	 - (1, 'สื่อและภาพถ่าย', '2024-01-01 10:00:00')
 - Constraint:
	 - name: **UNIQUE**

### 4. borrows
- เก็บประวัติการยืม-คืนอุปกรณ์
- field สำคัญ: id, user_id, equipment_id, quantity, borrow_date, due_date, status, borrow_reason, return_date, approved_at, rejected_at, return_confirmed_at
 - ตัวอย่างข้อมูล:
	 - (1, 1, 1, 1, '2024-01-01 10:00:00', '2024-01-07 23:59:59', 'PENDING', 'ยืมถ่ายงาน', null, null, null, null)
 - Constraint:
	 - user_id: **FOREIGN KEY** (users.id)
	 - equipment_id: **FOREIGN KEY** (equipment.id)
	 - quantity: > 0 (**CHECK**)
	 - status: 'PENDING', 'APPROVED', 'REJECTED', 'RETURN_PENDING', 'RETURNED' (**CHECK**)

## ความสัมพันธ์ (Relationship)

- ผู้ใช้ 1 คน (users) → ยืมอุปกรณ์ได้หลายรายการ (borrows)
- อุปกรณ์ 1 ชิ้น (equipment) → ถูกยืมได้หลายครั้ง (borrows)
- หมวดหมู่ 1 หมวด (categories) → มีอุปกรณ์ได้หลายชิ้น (equipment)

## ตัวอย่างความสัมพันธ์
- users.id ← borrows.user_id
- equipment.id ← borrows.equipment_id
- categories.name ← equipment.category

---

## ER Diagram (Mermaid)

```mermaid
erDiagram
	users {
		INTEGER id PK
		TEXT student_id UNIQUE
		TEXT name
		TEXT email UNIQUE
		TEXT phone
		TEXT password
		TEXT role
		INTEGER is_active
		TEXT created_at
	}

	equipment {
		INTEGER id PK
		TEXT name
		TEXT category
		TEXT description
		INTEGER total_quantity
		INTEGER available_quantity
		INTEGER damaged_quantity
		TEXT image_url
		TEXT status
	}

	categories {
		INTEGER id PK
		TEXT name UNIQUE
		TEXT created_at
	}

	borrows {
		INTEGER id PK
		INTEGER user_id FK
		INTEGER equipment_id FK
		INTEGER quantity
		TEXT borrow_date
		TEXT due_date
		TEXT return_date
		TEXT approved_at
		TEXT rejected_at
		TEXT return_confirmed_at
		TEXT borrow_reason
		TEXT status
	}

	users ||--o{ borrows : "id = user_id"
	equipment ||--o{ borrows : "id = equipment_id"
	categories ||--o{ equipment : "name = category"
```

---

> หมายเหตุ: ระบบนี้ใช้ SQLite (หรือ RDBMS อื่น) โครงสร้างตารางอาจปรับได้ตามความต้องการ
> ตารางอื่นๆ (ถ้ามี) จะใช้สำหรับฟีเจอร์เสริม เช่น log, notification ฯลฯ
