```md
# Borrowing Student Club Equipment System

## Software Requirements Specification (SRS)

**Project Name:** Borrowing Student Club Equipment System  
**Date:** 21 February 2026  
**Version:** 1.0  
**By:** เดี๋ยวแก้ตอนพรีเซนต์  

### Members
- นาย สุกฤษฎิ์ คลายคลี่ 6730300604
- นางสาว ศดาวดี ทรวดทรง 6730300558
- นางสาว อุษา อุปายโกศล 6730300671
- นางสาว ปิยดารัตน์ สุพินิจ 6730301031
- นางสาว ภูริชชยาพัชร์ สุพรรณ์ 6730301066

---

# Design Prototype

Figma Design:

https://www.figma.com/design/d4FDjq7YZdyXxx2e21fG81/Design-Prototype-using-Figma?node-id=1-3&t=8OUYq2LAwGq2lVc5-1

Frontend implementation should follow this design.

---

# Revision History

| Version | Author | Version Description | Date Completed |
|--------|-------|--------------------|---------------|
| 1.0 | เดี๋ยวแก้ตอนพรีเซนต์ | First Draft | 24 Feb 2026 |

---

# Review History

| Approving Party | Version Approved | Signature | Date |
|----------------|-----------------|----------|------|
| | | | |

---

# Approval History

| Reviewer | Version Reviewed | Signature | Date |
|---------|------------------|----------|------|
| | | | |

---

# 1. Introduction

## 1.1 Product Scope
ระบบ **Student Club Equipment Borrowing System** เป็น Web Application  
สำหรับจัดการการยืม–คืนอุปกรณ์ภายในชมรม  
เพื่อช่วยลดความผิดพลาดจากการจดบันทึกแบบกระดาษ  
และสามารถตรวจสอบสถานะการยืมได้อย่างชัดเจน

---

## 1.2 Intended Users
- สมาชิกชมรม (**User**)  
- ผู้ดูแลอุปกรณ์ (**Admin**)

---

## 1.3 General Overview
ระบบประกอบด้วย

- ระบบสมัครสมาชิก
- ระบบเข้าสู่ระบบ
- การยื่นคำขอยืมอุปกรณ์
- การอนุมัติคำขอ
- การบันทึกการคืนอุปกรณ์

---

# 2. Functional Requirements

## 2.1 User Functions

User สามารถ

1. สมัครสมาชิก (**Register**)  
2. เข้าสู่ระบบ (**Login**)  
3. ดูรายการอุปกรณ์ (**View Equipment**)  
4. ยื่นคำขอยืมอุปกรณ์ (**Submit Borrow Request**)  
5. ตรวจสอบสถานะการยืม (**View Borrow Status**)  
6. คืนอุปกรณ์ (**Return Equipment**)

---

## 2.2 Admin Functions

Admin สามารถ

1. เข้าสู่ระบบ (**Login**)  
2. เพิ่ม / แก้ไข / ลบอุปกรณ์ (**Manage Equipment**)  
3. อนุมัติคำขอยืม (**Approve Request**)  
4. ปฏิเสธคำขอ (**Reject Request**)  
5. บันทึกการคืนอุปกรณ์ (**Record Return**)  
6. ดูรายงานการยืม (**View Report**)

---

# 3. External Interface Requirements

## 3.1 User Interface
เป็น **Web Application**  
รองรับการแสดงผลบน

- Desktop
- Laptop
- Mobile

มีหน้า

- User Dashboard
- Admin Dashboard

---

## 3.2 Hardware Requirements
อุปกรณ์ที่มี

- Web Browser
- Internet Connection

---

## 3.3 Software Requirements

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

# 4. Non-Functional Requirements

## 4.1 Security

- ผู้ใช้ต้อง **Login ก่อนใช้งาน**
- User ไม่สามารถอนุมัติคำขอได้
- Admin เท่านั้นที่สามารถจัดการอุปกรณ์ได้

---

## 4.2 Performance

ระบบควรตอบสนองภายใน

**3 วินาที**

---

## 4.3 Usability

ระบบต้อง

- ใช้งานง่าย
- เข้าใจง่าย
- UI ชัดเจน

---

# 5. Definitions

| Term | Meaning |
|-----|--------|
| SRS | Software Requirement Specification |
| User | นักศึกษาที่ใช้งานระบบ |
| Admin | ผู้ดูแลระบบ |
| Borrow Request | คำขอยืมอุปกรณ์ |
| CRUD | Create, Read, Update, Delete |
```
