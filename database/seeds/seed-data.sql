INSERT INTO users (student_id, name, email, password, role)
VALUES
('ADMIN001', 'Club Administrator', 'admin@club.com', '$2a$10$zfbpf8XXwqMI3e3WuQOgsu/eQs7MEq/JmoW8LaZWaMZ/ZbHK3ojM6', 'admin');

INSERT INTO equipment (name, category, description, total_quantity, available_quantity, image_url, status)
VALUES
('Camera', 'Media', 'DSLR camera for events and photo projects.', 5, 5, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Tripod', 'Media', 'Stable tripod for studio and outdoor use.', 6, 6, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Microphone', 'Audio', 'Wireless microphone set for stage activities.', 8, 8, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Projector', 'Presentation', 'Portable projector for club meetings.', 3, 3, 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Laptop', 'Computing', 'Laptop for presentations and event registration.', 4, 4, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Speaker', 'Audio', 'Powered speaker for public activities.', 4, 4, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 'NORMAL'),
('Lighting Kit', 'Media', 'Lighting kit for indoor video recording.', 2, 2, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', 'DAMAGED');

