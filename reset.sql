-- =========================================================
-- Work Planner — Reset: delete all data and re-seed
-- Run: mysql -u root -p < reset.sql
-- =========================================================

USE work_planner;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE task_progress;
TRUNCATE TABLE tasks;
TRUNCATE TABLE projects;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Seed: default manager (password = admin123, BCrypt 12 rounds)
INSERT INTO users (name, email, password, role) VALUES
('Shubham Sain',
 'manager@workplanner.com',
 '$2a$10$oD14vULAP6Q7Lkx4bTyYGebXXU7S7xW3fcKm/y1.T5gxJxAsL5SW6',
 'MANAGER');
