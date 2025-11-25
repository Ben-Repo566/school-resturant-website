-- Setup Admin User
-- Run this file after registering your first user through the website

-- Step 1: Add is_admin column if it doesn't exist (in case it's needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Make a user an admin (REPLACE 'your-email@example.com' with your actual email)
-- UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';

-- To check which users are admins:
-- SELECT id, username, email, is_admin FROM users;
