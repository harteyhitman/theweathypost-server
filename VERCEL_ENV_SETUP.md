# Fix: NEXT_PUBLIC_API_URL Not Set in Vercel

## Problem
Your frontend is trying to connect to `localhost:3001` instead of your Render backend, causing:
- `NEXT_PUBLIC_API_URL not set, using fallback`
- `Failed to load resource: net::ERR_CONNECTION_REFUSED`
- `Login error: TypeError: Failed to fetch`

## Solution: Set Environment Variable in Vercel

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Log in to your account
   - Click on your project: `thewealthypost-01` (or your project name)

2. **Navigate to Settings**
   - Click on **Settings** in the top navigation
   - Click on **Environment Variables** in the left sidebar

3. **Add the Environment Variable**
   - Click **Add New** button
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://thewealthypost-backend.onrender.com`
     - ⚠️ **Important**: Replace with your actual Render backend URL if different
   - **Environment**: Select **ALL** (Production, Preview, Development)
   - Click **Save**

4. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a redeploy

5. **Verify the Fix**
   - Wait for deployment to complete (usually 1-2 minutes)
   - Visit your Vercel site: `https://thewealthypost-01.vercel.app`
   - Open browser console (F12)
   - The error `NEXT_PUBLIC_API_URL not set` should be gone
   - Try logging in - it should now connect to Render backend

## Quick Checklist

- [ ] Logged into Vercel dashboard
- [ ] Navigated to project Settings → Environment Variables
- [ ] Added `NEXT_PUBLIC_API_URL` with value `https://thewealthypost-backend.onrender.com`
- [ ] Selected ALL environments (Production, Preview, Development)
- [ ] Saved the environment variable
- [ ] Redeployed the application
- [ ] Verified the error is gone in browser console
- [ ] Tested login functionality

## Also Set in Render (Backend)

While you're at it, make sure your Render backend has the correct `FRONTEND_URL`:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your service: `thewealthypost-backend`
3. Go to **Environment** tab
4. Find or add `FRONTEND_URL`
5. Set value to: `https://thewealthypost-01.vercel.app`
6. Save and redeploy if needed

## Testing After Setup

1. **Check Browser Console**
   - Should NOT see: `NEXT_PUBLIC_API_URL not set`
   - Should NOT see: `localhost:3001` in network requests
   - Should see requests to: `https://thewealthypost-backend.onrender.com`

2. **Test Login**
   - Try logging in with admin credentials
   - Should connect successfully
   - No CORS errors

3. **Check Network Tab**
   - Open DevTools → Network tab
   - Try logging in
   - Requests should go to Render backend, not localhost

## Common Issues

### Issue: Still seeing localhost after setting variable
**Solution**: 
- Make sure you redeployed after setting the variable
- Clear browser cache
- Try incognito/private window

### Issue: CORS errors after setting variable
**Solution**:
- Verify `FRONTEND_URL` is set in Render dashboard
- Make sure it matches your Vercel domain exactly (no trailing slash)
- Check Render logs for CORS warnings

### Issue: Backend not responding
**Solution**:
- Check if Render service is running (not sleeping)
- First request after sleep takes 30-60 seconds
- Check Render service logs for errors

## Need Help?

If you're still having issues:
1. Check Vercel deployment logs
2. Check Render service logs
3. Verify both environment variables are set correctly
4. Ensure both services are deployed and running

