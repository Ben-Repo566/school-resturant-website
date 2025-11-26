# Security Setup Guide

All security vulnerabilities have been fixed! Follow these simple steps to complete the setup:

## ✅ What's Already Done

1. ✅ `.env` file created with strong SESSION_SECRET
2. ✅ All security fixes pushed to GitHub
3. ✅ SQL setup file created

## 📋 What You Need to Do

### Step 1: Start Your Server

The database will automatically update when you start the server!

```bash
npm start
```

The server will:
- Automatically add the `is_admin` column to your users table
- Create all necessary tables if they don't exist

### Step 2: Register Your Admin Account

1. Go to: http://localhost:3000/register
2. Create an account with:
   - Username: your choice
   - Email: your email
   - Password: Must be 8+ characters, with uppercase, lowercase, and number
   - Example: `MyPassword123`

### Step 3: Make Yourself an Admin

**Option A - Using MySQL Command Line:**
```bash
mysql -u root -p
```

Then run:
```sql
USE school_project;
UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
EXIT;
```

**Option B - Using MySQL Workbench/phpMyAdmin:**
1. Open your MySQL GUI tool
2. Connect to your database
3. Run the SQL from `setup_admin.sql` file

**Option C - Use the SQL file directly:**
```bash
mysql -u root -p school_project < setup_admin.sql
```

### Step 4: Test Everything

1. **Test Admin Access**: Go to http://localhost:3000/admin
   - You should see the admin panel with all users

2. **Test Regular User**: Try logging in with a non-admin account
   - They should NOT be able to access /admin

3. **Test Cart**: Add items to cart
   - Prices are now validated server-side (can't be manipulated!)

4. **Test Rate Limiting**: Try logging in 5 times with wrong password
   - You should be blocked after 5 attempts

## 🔒 Security Features Now Active

1. ✅ Admin authentication - Only admins can access admin panel
2. ✅ CSRF protection - All forms protected with tokens
3. ✅ XSS protection - User input properly escaped
4. ✅ Price validation - Server validates all menu prices
5. ✅ Rate limiting - Brute force attack prevention
6. ✅ Strong passwords - 8+ chars, uppercase, lowercase, number
7. ✅ No user enumeration - Login errors are generic
8. ✅ Authorization fixed - Only admins can manage users

## 📝 Important Notes

- Your `.env` file contains your SESSION_SECRET - Keep it private!
- Don't commit `.env` to Git (it's already in .gitignore)
- If you need to update your MySQL password, edit the `.env` file

## 🆘 Need Help?

If something doesn't work:
1. Check that MySQL is running
2. Check your database credentials in `.env`
3. Look at server console for error messages
4. Make sure you ran `npm install` first

Enjoy your secure website! 🎉
