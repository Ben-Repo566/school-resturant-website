# 🥔 Potato Kingdom - Quick Start Guide

Hey Ben! Here's how to get your website running:

## ✅ Prerequisites Check

Make sure you have these installed:
- ✅ Node.js (check: `node --version`)
- ✅ MySQL (check: `mysql --version`)
- ✅ npm (check: `npm --version`)

## 🚀 How to Start the Server

### Option 1: Using npm
```bash
npm start
```

### Option 2: Using nodemon (auto-restart on changes)
```bash
npm run dev
```

You should see:
```
Server running on http://localhost:3000
Connected to MySQL database
Users table ready
Cart table ready
Orders table ready
Reviews table ready
```

## 🌐 Access Your Website

Once the server is running, open your browser and go to:
- **Home Page**: http://localhost:3000
- **Menu**: http://localhost:3000/menu
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Dashboard**: http://localhost:3000/dashboard (requires login)
- **Admin**: http://localhost:3000/admin

## 🔍 Testing Login & Registration

### To Register:
1. Go to http://localhost:3000/register
2. Fill in:
   - Username (min 3 characters)
   - Email (must be valid)
   - Password (min 6 characters)
   - Confirm Password
3. Click "Register"
4. You'll be redirected to login page

### To Login:
1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to dashboard

## 🐛 Debugging

### If registration/login doesn't work:

1. **Make sure the server is running!**
   - Check your terminal - you should see "Server running on http://localhost:3000"

2. **Open Chrome DevTools (F12 or Cmd+Option+I on Mac)**
   - Go to Console tab
   - Try to login/register
   - Check for errors (red text)

3. **Common issues:**
   - ❌ Server not started → Start it with `npm start`
   - ❌ MySQL not running → Start MySQL
   - ❌ Database doesn't exist → It creates automatically on first run
   - ❌ Port 3000 already in use → Kill other process or change PORT in .env

### Check if server is responding:
```bash
curl http://localhost:3000/api/user
```

Should return: `{"error":"Not authenticated"}` (this is good - means server is working!)

## 📝 Console Logging

The updated login/register pages now show helpful console messages:
- "Login form submitted"
- "Sending login request to /api/login"
- "Login response status: 200"
- "Login successful, redirecting to dashboard"

Check the browser console (F12) to see what's happening!

## ⚙️ Configuration

Your `.env` file should have:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=school_project
SESSION_SECRET=school_project_secret_key_2024_ben
PORT=3000
```

## 🎨 What's Been Improved

### ✅ Mobile Responsiveness
- All pages now work great on phones and tablets
- Multiple breakpoints: 380px, 640px, 768px, 1024px, 1280px
- Touch-friendly buttons and inputs

### ✅ Better Error Handling
- Clear error messages
- Button states (disabled during submission)
- Input validation
- Console logging for debugging

### ✅ User Experience
- Loading states ("Logging in...", "Creating account...")
- Input trimming (removes extra spaces)
- Better validation messages
- Success/error alerts

## 🆘 Still Having Issues?

1. Clear your browser cache (Cmd+Shift+R on Mac)
2. Try a different browser
3. Check the terminal for error messages
4. Check browser console (F12) for JavaScript errors
5. Make sure MySQL is running

## 📞 Need Help?

Open the browser console (F12) and send me the error messages!

---
**Server Status**: The server is currently running and all APIs are working! ✅

**Database**: Connected and all tables created! ✅

**Next Features to Add**:
- User profile edit page
- Change password functionality
- Password reset via email
- Search & filters for menu
- Dark mode toggle
