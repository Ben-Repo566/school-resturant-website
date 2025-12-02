# 📁 Project Structure

This document explains the organized folder structure of the Potato Kingdom Restaurant Website.

## Root Files
- `server.js` - Main Node.js/Express server
- `package.json` - Project dependencies and scripts
- `.env` - Environment variables (not in git)

## Folders

### `/public` - Frontend (Client-Side)
All files served directly to the browser:
- `/public/html/` - All HTML pages (index, login, register, menu, etc.)
- `/public/css/` - Stylesheets (style.css, restaurant.css, animations.css)
- `/public/js/` - Client-side JavaScript files
- `/public/images/` - Images and logos

### `/scripts` - Admin & Setup Scripts
Helper scripts for setting up admin users:
- `create-admin.js` - Create admin user locally
- `quick-setup-admin.js` - Quick admin setup
- `setup-admin.js` - Admin setup utility
- `create-railway-admin.js` - Railway-specific admin creation
- `make-admin-railway.js` - Make existing user admin on Railway

### `/database` - SQL Files
Database schemas and initialization scripts:
- `database.sql` - Main database schema
- `init.sql` - Initial database setup
- `create_cart_tables.sql` - Shopping cart tables
- `setup_admin.sql` - Admin setup SQL

### `/docker` - Docker Configuration
Docker deployment files:
- `Dockerfile` - Docker image configuration
- `docker-compose.yml` - Multi-container setup
- `.dockerignore` - Files to exclude from Docker image

### `/docs` - Documentation
Project documentation and guides:
- `README.md` - Main project README
- `START_HERE.md` - Getting started guide
- `RAILWAY_DEPLOY.md` - Railway deployment instructions
- `GMAIL_SETUP_RAILWAY.md` - Email configuration guide
- `SECURITY_SETUP_GUIDE.md` - Security best practices

## Running the Project

### Local Development
```bash
npm install
npm run dev
```

### Production (Railway)
Automatically deploys when pushed to GitHub main branch.

---
**Last Updated:** December 2, 2025
**Author:** Ben
