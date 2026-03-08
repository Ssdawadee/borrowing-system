<h1 align="center">📦 Borrowing Student Club Equipment System</h1>

<p align="center">
Web Application สำหรับจัดการการยืม–คืนอุปกรณ์ภายในชมรม
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
