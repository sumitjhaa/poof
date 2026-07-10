# Deployment Guide

## Overview

Poof uses free-tier services for production deployment:

| Service | Provider | Free Tier |
|---------|----------|-----------|
| PostgreSQL | Neon | 0.5 GB, 100 CU-hours/month |
| Backend | Render | 750 hrs/month |
| Frontend | Vercel | 100 GB bandwidth |

## Prerequisites

1. GitHub account
2. Neon account (neon.tech)
3. Render account (render.com)
4. Vercel account (vercel.com)

## Step 1: Neon PostgreSQL

### 1.1 Create Project

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click "Create Project"
4. Name: `poof`
5. Region: Choose closest to users
6. Click "Create"

### 1.2 Get Connection String

1. Go to Dashboard → Project
2. Click "Connection Details"
3. Copy the connection string:
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/poof?sslmode=require
```

### 1.3 Save Credentials

Save these for later:
- `DATABASE_URL`: The full connection string

---

## Step 2: Deploy Backend to Render

### 2.1 Connect Repository

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +"
4. Select "Web Service"
5. Connect GitHub repository
6. Select `poof` repository

### 2.2 Configure Service

| Setting | Value |
|---------|-------|
| Name | `poof-backend` |
| Region | Oregon (or closest) |
| Branch | `master` |
| Runtime | Python |
| Build Command | `cd backend && pip install -r requirements.txt` |
| Start Command | `cd backend && uvicorn app.main:app --host 0.0.0.0` |

### 2.3 Add Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `DEBUG` | `false` |

### 2.4 Deploy

Click "Create Web Service"

Wait for deployment (~2-3 minutes)

### 2.5 Verify

Visit `https://poof-backend.onrender.com/health`

Should return:
```json
{"status": "ok", "version": "0.1.0"}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..."
4. Select "Project"
5. Import `poof` repository

### 3.2 Configure Project

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### 3.3 Add Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://poof-backend.onrender.com` |

### 3.4 Deploy

Click "Deploy"

Wait for deployment (~1-2 minutes)

### 3.5 Verify

Visit `https://poof.vercel.app`

Should see the Poof homepage.

---

## Step 4: Update CORS

### 4.1 Update Backend

Update `.env` on Render:

```
ALLOWED_ORIGINS=["https://poof.vercel.app"]
```

### 4.2 Redeploy

Render auto-redeploys on change.

---

## Step 5: Test Production

### 5.1 Create Secret

1. Go to `https://poof.vercel.app`
2. Enter a secret
3. Click "Create Secret"
4. Copy the link

### 5.2 Read Secret

1. Open the link in new tab
2. Secret should decrypt and display

### 5.3 Verify One-Time Access

1. Try reading again
2. Should show "Secret not found or already consumed"

---

## Environment Variables Reference

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DEBUG` | Enable debug mode | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

---

## Troubleshooting

### Backend Issues

**502 Bad Gateway**
- Check start command is correct
- Verify all dependencies installed
- Check Render logs

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- Check Neon project is active
- Ensure SSL mode is required

**CORS Errors**
- Add frontend URL to `ALLOWED_ORIGINS`
- Redeploy backend

### Frontend Issues

**Build Failed**
- Check `package.json` scripts
- Verify Node.js version (18+)
- Check Vercel build logs

**API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Test `/health` endpoint

---

## Free Tier Limits

### Neon
- 0.5 GB storage
- 100 compute hours/month
- 100 concurrent connections

### Render
- 750 hours/month
- 512 MB RAM
- Shared CPU

### Vercel
- 100 GB bandwidth/month
- 100 hours build time
- Serverless functions included

---

## Monitoring

### Health Check

```bash
curl https://poof-backend.onrender.com/health
```

### API Info

```bash
curl https://poof-backend.onrender.com/api/info
```

### Audit Logs

```bash
curl https://poof-backend.onrender.com/api/audit/stats
```

---

## Cost

**Total Monthly Cost: $0**

All services use free tiers. No credit card required.
