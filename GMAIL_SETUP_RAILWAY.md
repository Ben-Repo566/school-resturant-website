# Gmail SMTP Setup for Railway

## What Changed
We switched from SendGrid to Gmail SMTP for better email reliability.

## Railway Environment Variables Setup

### Step 1: Go to Railway Dashboard
1. Visit https://railway.app/dashboard
2. Select your project: **school-resturant-website**
3. Click on your service
4. Go to **Variables** tab

### Step 2: Add New Gmail Variables

Add these two new variables:

```
GMAIL_USER=benabutbul1980@gmail.com
GMAIL_APP_PASSWORD=rfclvwkgcphhnakb
```

### Step 3: Remove Old SendGrid Variables (if they exist)

Delete these old variables:
- `SENDGRIDAPIKEY`
- `EMAILUSER`

### Step 4: Verify Database Variables Exist

Make sure these are already set (Railway MySQL should have created them):
- `DB_HOST` - Your Railway MySQL host
- `DB_USER` - Your Railway MySQL user
- `DB_PASSWORD` - Your Railway MySQL password
- `DB_NAME` - Your Railway MySQL database name
- `SESSION_SECRET` - Any random string
- `PORT` - Railway sets this automatically

### Step 5: Deploy

Railway will automatically redeploy when you:
1. Add the new variables
2. Or you can manually click **Deploy** → **Redeploy**

---

## How to Get Gmail App Password (if you need another one)

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with: `benabutbul1980@gmail.com`
3. Click "Create app password"
4. Name it: "Railway Production"
5. Copy the 16-character password
6. Paste it in Railway as `GMAIL_APP_PASSWORD`

---

## Testing After Deployment

1. Go to your Railway URL
2. Try the "Forgot Password" feature
3. Check your Gmail inbox for the reset code

---

## Troubleshooting

### Email Not Sending?
Check Railway logs:
```
railway logs
```

Look for:
- ✅ "Email server is ready to send messages" - Good!
- ❌ "Email configuration error" - Check your variables

### Variables Not Working?
- Make sure there are no extra spaces
- Make sure variable names are EXACTLY as shown above
- Redeploy after adding variables

---

## Important Notes

- **Local Docker** uses your local MySQL database (separate from Railway)
- **Railway** uses its own MySQL database in the cloud
- Your production data is safe on Railway
- Local development data resets when you run `docker-compose down`
