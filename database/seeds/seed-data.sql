INSERT INTO users (student_id, name, email, phone, password, role)
VALUES
('ADMIN001', 'Club Administrator', 'admin@club.com', '0000000000', '$2a$10$zfbpf8XXwqMI3e3WuQOgsu/eQs7MEq/JmoW8LaZWaMZ/ZbHK3ojM6', 'admin');

INSERT INTO equipment (name, category, description, total_quantity, available_quantity, image_url, status)
VALUES
('กล้องถ่ายรูป', 'สื่อและภาพถ่าย', 'กล้อง DSLR สำหรับงานกิจกรรมและโปรเจกต์ถ่ายภาพ', 5, 5, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('ขาตั้งกล้อง', 'สื่อและภาพถ่าย', 'ขาตั้งกล้องสำหรับถ่ายภาพและวิดีโอ ใช้ได้ทั้งในสตูดิโอและนอกสถานที่', 6, 6, 'https://cdn.sandberg.world/products/images/lg/134-26_lg.jpg', 'NORMAL'),
('ไมโครโฟน', 'เครื่องเสียง', 'ชุดไมโครโฟนไร้สายสำหรับงานกิจกรรมบนเวที', 8, 8, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('โปรเจคเตอร์', 'งานนำเสนอ', 'โปรเจคเตอร์พกพาสำหรับงานประชุมและกิจกรรมชมรม', 3, 3, 'https://m.media-amazon.com/images/I/61FeT3hvIRL._AC_UF894,1000_QL80_.jpg', 'NORMAL'),
('แลปท็อป', 'คอมพิวเตอร์', 'แลปท็อปสำหรับนำเสนอผลงานและลงทะเบียนกิจกรรม', 4, 4, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('ลำโพง', 'เครื่องเสียง', 'ลำโพงสำหรับงานกิจกรรมกลางแจ้งและงานประชาสัมพันธ์', 4, 4, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('ชุดไฟถ่ายภาพ', 'สื่อและภาพถ่าย', 'ชุดไฟสำหรับถ่ายภาพและวิดีโอในร่ม', 2, 2, 'https://m.media-amazon.com/images/I/61uPzgZ6TfL._AC_SL1500_.jpg', 'DAMAGED');

