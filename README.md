# borrowing-system
Software Requirements Specification (SRS) Project

Project Name : Borrowing Student Club Equipment System
Date : 21 February 2026
Version : 1.0
By : เดี๋ยวแก้ตอนพรีเซนต์
Member : นาย สุกฤษฎิ์ คลายคลี่ 6730300604
                 นางสาว ศดาวดี ทรวดทรง 6730300558
                 นางสาว อุษา อุปายโกศล 6730300671
                 นางสาว ปิยดารัตน์ สุพินิจ 6730301031
                 นางสาว ภูริชชยาพัชร์ สุพรรณ์ 6730301066
Revision history
Version	Author	Version description	Date completed
1.0	เดี๋ยวแก้ตอนพรีเซนต์	First Draft	24 Feb 2026

Review history
Approving party	Version approved	Signature	Date
			
			

Approval history
Reviewer	Version reviewed	Signature	Date
			
			

Version: 1.0  
1.  Introduction
1.1	Product Scope ระบบ Student Club Equipment Borrowing System เป็น Web Application สำหรับจัดการการยืม–คืนอุปกรณ์ภายในชมรม เพื่อช่วยลดความผิดพลาดจากการจดบันทึกแบบกระดาษ และสามารถตรวจสอบสถานะการยืมได้อย่างชัดเจน
1.2 Intended Users สมาชิกชมรม (User) ผู้ดูแลอุปกรณ์ (Admin) 
1.3 General Overview ระบบประกอบด้วยระบบสมัครสมาชิก เข้าสู่ระบบ การยื่นคำขอยืมอุปกรณ์ 
     การอนุมัติคำขอ และการบันทึกการคืนอุปกรณ์ 

2. Functional Requirements
2.1 User Functions 
1. User สามารถ: สมัครสมาชิก (Register) 
2. เข้าสู่ระบบ (Login) 
3. ดูรายการอุปกรณ์ (View Equipment) 
4. ยื่นคำขอยืมอุปกรณ์ (Submit Borrow Request) 
5. ตรวจสอบสถานะการยืม (View Borrow Status) 
6. คืนอุปกรณ์ (Return Equipment)

 2.2 Admin Functions 
1. Admin สามารถ: เข้าสู่ระบบ (Login) 
2. เพิ่ม/แก้ไข/ลบอุปกรณ์ (Manage Equipment)
3. อนุมัติคำขอยืม (Approve Request) 
4. ปฏิเสธคำขอ (Reject Request) 
5. บันทึกการคืนอุปกรณ์ (Record Return) 
6. ดูรายงานการยืม (View Report)

3.  External Interface Requirements
3.1 User Interface เป็น Web Application รองรับการแสดงผลบนคอมพิวเตอร์และมือถือ 
       มีหน้า Dashboard สำหรับ User และ Admin
3.2 Hardware Requirements อุปกรณ์ที่มี Web Browser ต้องเชื่อมต่ออินเทอร์เน็ต 
3.3 Software Requirements พัฒนาโดยใช้ HTML, CSS, JavaScript ใช้ฐานข้อมูล MySQL 
4. Non-Functional Requirements
4.1 Security ผู้ใช้ต้อง Login ก่อนใช้งาน User ไม่สามารถอนุมัติคำขอได้ Admin เท่านั้นที่      จัดการอุปกรณ์ได้ 
4.2 Performance ระบบควรตอบสนองภายใน 3 วินาที 
4.3 Usability ระบบต้องใช้งานง่าย เข้าใจได้ทันที 
5. Definitions
1.	SRS Software Requirement Specification 
2.	User นักศึกษาที่ใช้งานระบบ 
3.	Admin ผู้ดูแลระบบ 
4.	Borrow Request คำขอยืมอุปกรณ์ 
5.	CRUD Create, Read, Update, Delete

