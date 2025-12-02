-- Create database
CREATE DATABASE IF NOT EXISTS school_project;
USE school_project;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create a test user (password is 'test123')
-- INSERT INTO users (username, email, password) VALUES ('testuser', 'test@example.com', '$2b$10$YourHashedPasswordHere');
