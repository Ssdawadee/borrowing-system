-- Schema definition for Borrowing Student Club Equipment System
-- This script reflects the tables currently used by the backend code.

CREATE DATABASE IF NOT EXISTS equipment_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE equipment_system;

-- Users table: students and admins
CREATE TABLE IF NOT EXISTS users (
  user_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id  VARCHAR(50)  NOT NULL,
  full_name   VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'user',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_student_id (student_id)
);

-- Equipments table: each row represents one physical item
CREATE TABLE IF NOT EXISTS equipments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  description TEXT         NULL,
  image_url   VARCHAR(500) NULL,
  PRIMARY KEY (id)
);

-- Borrow requests table: tracks borrow lifecycle for each equipment and user
CREATE TABLE IF NOT EXISTS borrow_requests (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  equipment_id INT UNSIGNED NOT NULL,
  -- Note: backend joins user_id to users.student_id, so keep this as the student identifier
  user_id      VARCHAR(50)  NOT NULL,
  borrow_date  DATE         NOT NULL,
  return_date  DATE         NOT NULL,
  reason       TEXT         NOT NULL,
  status       VARCHAR(20)  NULL,
  PRIMARY KEY (id),
  KEY idx_borrow_requests_equipment_id (equipment_id),
  KEY idx_borrow_requests_user_id (user_id),
  CONSTRAINT fk_borrow_requests_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_borrow_requests_user
    FOREIGN KEY (user_id) REFERENCES users(student_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

