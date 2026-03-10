-- Migration: add is_active flag to users for basic admin management

USE equipment_system;

ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;

