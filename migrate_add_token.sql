-- Run once to add token columns to existing users table
-- mysql -u root -p work_planner < migrate_add_token.sql

USE work_planner;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS token_expiry DATETIME DEFAULT NULL;
