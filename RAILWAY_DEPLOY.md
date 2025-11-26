# Railway Deployment Instructions

## Step 1: Prepare Your GitHub Repository
1. Make sure all code is committed and pushed to GitHub
2. Your repository should be at: https://github.com/YOUR_USERNAME/schoolwebsiteproject

## Step 2: Sign Up for Railway
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

## Step 3: Create a New Project
1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your `schoolwebsiteproject` repository
4. Railway will automatically detect it's a Node.js app

## Step 4: Add MySQL Database
1. In your project dashboard, click "New"
2. Select "Database" → "Add MySQL"
3. Railway will provision a MySQL database
4. Wait for it to finish deploying (green checkmark)

## Step 5: Configure Environment Variables
1. Click on your web service (the Node.js app)
2. Go to "Variables" tab
3. Railway will automatically add database connection variables
4. Add these additional variables:
   - `SESSION_SECRET` = `your_secure_random_string_here`
   - `NODE_ENV` = `production`

## Step 6: Initialize Database
After your app deploys:
1. Click on the MySQL database service
2. Go to "Data" tab
3. Click "Query"
4. Copy and paste the contents of `init.sql`
5. Click "Execute"

## Step 7: Access Your Website
1. Click on your web service
2. Go to "Settings" tab
3. Scroll to "Networking"
4. Click "Generate Domain"
5. Your site will be available at: `your-app-name.up.railway.app`

## Troubleshooting
- If the app doesn't start, check "Logs" tab for errors
- Make sure all environment variables are set correctly
- Database must be running before the app starts
- Check that init.sql was executed successfully

## Environment Variables Reference
Your app will automatically get these from Railway's MySQL:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

You need to add manually:
- `SESSION_SECRET`
- `NODE_ENV`
