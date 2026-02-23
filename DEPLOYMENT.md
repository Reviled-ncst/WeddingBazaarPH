# Wedding Bazaar Deployment Guide

## Architecture
- **Frontend**: Next.js on Vercel
- **Backend**: PHP API on Railway
- **Database**: MySQL on Railway

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
Go to [railway.app](https://railway.app) and sign up.

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account and select this repository

### 1.3 Configure API Service
1. After connecting, click **"Add Service" → "GitHub Repo"**
2. Set the **Root Directory** to `api`
3. Railway will detect the Dockerfile automatically

### 1.4 Add MySQL Database
1. Click **"New" → "Database" → "Add MySQL"**
2. Railway will create a MySQL instance
3. Note the connection variables (they'll be auto-linked)

### 1.5 Configure Environment Variables
In the API service settings, add these variables:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=your-secure-jwt-secret-min-32-chars
FRONTEND_URL=https://your-app.vercel.app (update after Vercel deploy)
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_TEST_MODE=true
```

### 1.6 Import Database Schema
1. Go to MySQL service in Railway
2. Click **"Data"** tab → **"Query"**
3. Copy and paste contents of `api/config/schema.sql`
4. Run the query

### 1.7 Get API URL
After deployment, Railway provides a URL like:
`https://wedding-bazaar-api-production.up.railway.app`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
Go to [vercel.com](https://vercel.com) and sign up.

### 2.2 Import Project
1. Click **"Add New" → "Project"**
2. Import from GitHub
3. Select this repository

### 2.3 Configure Build Settings
Vercel auto-detects Next.js. Default settings work.

### 2.4 Configure Environment Variables
Add these in Vercel's project settings:

```
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 2.5 Deploy
Click **"Deploy"** - Vercel will build and deploy.

---

## Step 3: Update Cross-References

### 3.1 Update Railway with Vercel URL
Go back to Railway and update:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## Environment Variables Summary

### Railway (Backend)
| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (use Railway reference) |
| `DB_PORT` | MySQL port (use Railway reference) |
| `DB_NAME` | MySQL database name |
| `DB_USER` | MySQL username |
| `DB_PASS` | MySQL password |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) |
| `FRONTEND_URL` | Vercel app URL |
| `PAYMONGO_SECRET_KEY` | PayMongo secret key |
| `PAYMONGO_PUBLIC_KEY` | PayMongo public key |
| `PAYMONGO_TEST_MODE` | `true` for testing, `false` for production |

### Vercel (Frontend)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Railway API URL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset |

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in Railway
- Check that your Vercel domain is in the allowed origins

### Database Connection Issues
- Verify MySQL service is running in Railway
- Check that DB_* variables are using Railway references `${{MySQL.VARNAME}}`

### API 500 Errors
- Check Railway logs for PHP errors
- Ensure all required environment variables are set

---

## Local Development

For local development, the app still works with XAMPP:

1. Start XAMPP (Apache + MySQL)
2. Import `api/config/schema.sql` into MySQL
3. Run `npm run dev` for the frontend
4. API runs at `http://localhost/wedding-bazaar-api`
5. Frontend runs at `http://localhost:3000`
