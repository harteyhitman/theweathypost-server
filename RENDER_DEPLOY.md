# Deploy to Render - Step by Step Guide

This guide will walk you through deploying the backend to Render.

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render account (sign up at [render.com](https://render.com) - free tier available)

## Step 1: Prepare Your Repository

1. **Make sure all files are committed and pushed to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare backend for Render deployment"
   git push origin main
   ```

## Step 2: Create Render Account and Project

1. **Sign up/Login** at [render.com](https://render.com)
2. **Click "New +"** in the dashboard
3. **Select "Blueprint"** (to use the render.yaml file)

## Step 3: Connect GitHub Repository

1. **Connect your GitHub account** if not already connected
2. **Select your repository** (`thewealthypost`)
3. **Select the branch** (usually `main` or `master`)
4. **Render will detect the `render.yaml` file** in the `backend` folder

## Step 4: Configure the Blueprint

1. **Root Directory**: Set to `backend` (important!)
2. **Name**: `thewealthypost-backend` (or your preferred name)
3. **Review the services** that will be created:
   - Web Service (your backend API)
   - PostgreSQL Database

## Step 5: Set Environment Variables

After the blueprint is created, you'll need to set environment variables for the Web Service:

### Required Variables:

1. **NODE_ENV**
   - Value: `production`

2. **FRONTEND_URL**
   - Value: `https://your-frontend-domain.com` (or `http://localhost:3000` for testing)
   - Example: `https://thewealthypost.com`

3. **JWT_SECRET**
   - Generate a strong random string:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output and use it as the value

4. **SMTP_HOST**
   - Value: `smtp.gmail.com` (or your email provider)

5. **SMTP_PORT**
   - Value: `587`

6. **SMTP_USER**
   - Value: Your email address (e.g., `your-email@gmail.com`)

7. **SMTP_PASS**
   - Value: Your email app password (for Gmail, generate an app password)

8. **SMTP_FROM**
   - Value: `noreply@thewealthypost.com` (or your preferred sender email)

### Database Variables:

The `DATABASE_URL` will be automatically set by Render when you create the PostgreSQL database. You don't need to set this manually.

## Step 6: Deploy

1. **Click "Apply"** to create the services
2. **Render will automatically**:
   - Create the PostgreSQL database
   - Build your backend (`npm install && npm run build`)
   - Start the service (`npm run start:prod`)
3. **Wait for deployment** (usually 2-5 minutes)

## Step 7: Get Your Backend URL

1. Once deployed, Render will provide a URL like:
   - `https://thewealthypost-backend.onrender.com`
2. **Copy this URL** - you'll need it for your frontend

## Step 8: Update Frontend

1. **Update your frontend `.env.local`**:
   ```env
   NEXT_PUBLIC_API_URL=https://thewealthypost-backend.onrender.com
   ```

2. **Redeploy your frontend** (if already deployed) or test locally

## Step 9: Test the Deployment

1. **Test the API endpoint**:
   ```bash
   curl https://your-backend-url.onrender.com/posts
   ```
   Should return an empty array `[]` or your posts.

2. **Test admin login**:
   - Visit your frontend admin page
   - Try logging in with your admin credentials

## Troubleshooting

### Build Fails

- **Check build logs** in Render dashboard
- **Verify Node.js version** (should be 18+)
- **Check that all dependencies are in package.json**

### Database Connection Issues

- **Verify DATABASE_URL** is set automatically
- **Check database status** in Render dashboard
- **Ensure SSL is enabled** (Render PostgreSQL uses SSL)

### CORS Errors

- **Verify FRONTEND_URL** matches your frontend domain exactly
- **No trailing slashes** in the URL
- **Check CORS logs** in Render service logs

### Email Not Working

- **Verify SMTP credentials** are correct
- **For Gmail**: Make sure you're using an App Password, not your regular password
- **Check email service logs** in Render

### Service Keeps Restarting

- **Check service logs** for errors
- **Verify all environment variables** are set
- **Check database connection** is working

## Render Free Tier Limitations

- **Services spin down** after 15 minutes of inactivity
- **First request** after spin-down may take 30-60 seconds
- **Upgrade to paid plan** for always-on services

## Updating Your Deployment

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```

2. **Render will automatically detect** and redeploy

## Manual Deployment (Alternative)

If you prefer not to use the Blueprint:

1. **Create Web Service**:
   - Name: `thewealthypost-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Root Directory: `backend`

2. **Create PostgreSQL Database**:
   - Name: `thewealthypost-db`
   - Plan: Free (or paid)

3. **Link Database to Service**:
   - In Web Service settings, add `DATABASE_URL` from database

4. **Set all environment variables** as listed above

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **Check service logs** in Render dashboard for detailed error messages

