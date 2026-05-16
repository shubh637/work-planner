-- =========================================================
-- Work Planner — MySQL 8 schema
-- Run: mysql -u root -p < schema.sql
-- =========================================================

CREATE DATABASE IF NOT EXISTS work_planner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE work_planner;

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    name                 VARCHAR(100) NOT NULL,
    email                VARCHAR(150) NOT NULL UNIQUE,
    password             VARCHAR(255) NOT NULL,
    role                 ENUM('MANAGER','TEAM_MEMBER') NOT NULL DEFAULT 'TEAM_MEMBER',
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    password_reset_token VARCHAR(255) DEFAULT NULL,
    token_expiry         DATETIME     DEFAULT NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
);

-- ---------------------------------------------------------
-- projects
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    name        VARCHAR(200)  NOT NULL,
    description TEXT,
    manager_id  BIGINT        NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_project_manager
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_projects_manager (manager_id)
);

-- ---------------------------------------------------------
-- tasks
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    project_id   BIGINT       NOT NULL,
    assigned_to  BIGINT,
    created_by   BIGINT       NOT NULL,
    suggested_by BIGINT,
    status       ENUM('PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED')
                 NOT NULL DEFAULT 'PENDING',
    due_date     DATE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_task_project      FOREIGN KEY (project_id)   REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assigned_to  FOREIGN KEY (assigned_to)  REFERENCES users(id)    ON DELETE SET NULL,
    CONSTRAINT fk_task_created_by   FOREIGN KEY (created_by)   REFERENCES users(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_task_suggested_by FOREIGN KEY (suggested_by) REFERENCES users(id)    ON DELETE SET NULL,
    INDEX idx_tasks_project     (project_id),
    INDEX idx_tasks_assigned_to (assigned_to),
    INDEX idx_tasks_status      (status),
    INDEX idx_tasks_due_date    (due_date)
);

-- ---------------------------------------------------------
-- task_progress
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_progress (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    task_id      BIGINT      NOT NULL,
    changed_by   BIGINT      NOT NULL,
    old_status   VARCHAR(20) NOT NULL,
    new_status   VARCHAR(20) NOT NULL,
    notes        TEXT,
    changed_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_tp_task       FOREIGN KEY (task_id)    REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tp_task       (task_id),
    INDEX idx_tp_changed_at (changed_at)
);

-- ---------------------------------------------------------
-- Seed: default manager (password = admin123, BCrypt 12 rounds)
-- ---------------------------------------------------------
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin',
 'Admin@workplanner.com',
 '$2a$10$oD14vULAP6Q7Lkx4bTyYGebXXU7S7xW3fcKm/y1.T5gxJxAsL5SW6',
 'MANAGER');
