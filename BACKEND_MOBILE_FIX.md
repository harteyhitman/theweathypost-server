# Backend Mobile & CORS Fixes

This document outlines the backend improvements made to support mobile devices and fix CORS issues with the Vercel frontend.

## Changes Made

### 1. ✅ Health Check Endpoints
- **Added `/health` endpoint** - Lightweight health check for Render and monitoring
- **Added `/` root endpoint** - Quick status check
- **Updated Render health check** - Changed from `/posts` to `/health` for faster response

### 2. ✅ Enhanced CORS Configuration
- **Automatic Vercel domain support** - All `.vercel.app` domains are now automatically allowed
- **Better logging** - CORS decisions are logged for debugging
- **Preflight caching** - Added `maxAge: 86400` (24 hours) to reduce preflight requests
- **Development mode** - All origins allowed in development for easier testing

### 3. ✅ Improved Error Handling
- **Better CORS error messages** - Shows which origins are allowed when blocked
- **Request timeout handling** - Backend optimized for 15-second mobile timeouts
- **Database initialization** - Improved error handling with retry logic

## Environment Variables Required

### In Render Dashboard:
1. **FRONTEND_URL** - Set to your Vercel domain:
   ```
   https://thewealthypost-01.vercel.app
   ```
   Or multiple domains (comma-separated):
   ```
   https://thewealthypost-01.vercel.app,https://thewealthypost.vercel.app
   ```

2. **NODE_ENV** - Already set to `production`

3. **ENABLE_SYNCHRONIZE** - Set to `true` for first deployment, then `false` after tables are created

## Frontend Configuration (Vercel)

### Required Environment Variable:
In your Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://thewealthypost-backend.onrender.com
```

**Important:** 
- Set for **all environments** (Production, Preview, Development)
- **Redeploy** after setting the variable
- The frontend code should use this variable for all API calls

## Testing

### 1. Test Backend Health:
```bash
curl https://thewealthypost-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Service is healthy",
  "timestamp": "2025-12-30T...",
  "uptime": 123.45
}
```

### 2. Test CORS from Frontend:
Open browser console on your Vercel site and check:
- No CORS errors in console
- API calls succeed
- Preflight requests return 200 OK

### 3. Test on Mobile:
- Use your mobile device to access the Vercel site
- Try logging in
- Check network tab for timeout issues (should complete within 15 seconds)

## Render Free Tier Considerations

### Service Sleep Behavior:
- Services spin down after **15 minutes** of inactivity
- First request after spin-down takes **30-60 seconds**
- This can cause timeouts on mobile networks

### Solutions:
1. **Use the health check endpoint** - Render pings `/health` to keep service awake
2. **Upgrade to paid plan** - Services stay awake 24/7
3. **Accept the delay** - First request will be slow, subsequent requests are fast

## API Endpoints

### Health & Status:
- `GET /` - Root status endpoint
- `GET /health` - Health check endpoint (used by Render)

### Authentication:
- `POST /auth/login` - Login (15s timeout supported)
- `POST /auth/signup` - Signup
- `POST /auth/verify-email` - Verify email
- `POST /auth/resend-code` - Resend verification code

### Posts:
- `GET /posts` - Get all published posts
- `GET /posts/:id` - Get post by ID
- `GET /posts/slug/:slug` - Get post by slug

## Troubleshooting

### CORS Errors:
1. **Check FRONTEND_URL in Render** - Must match your Vercel domain exactly
2. **Check browser console** - Look for CORS error details
3. **Check Render logs** - Look for CORS warnings/errors
4. **Verify domain** - Ensure no trailing slashes in FRONTEND_URL

### Timeout Errors:
1. **Check if service is sleeping** - First request after 15min will be slow
2. **Check mobile network** - Slow networks may timeout
3. **Check Render service status** - Ensure service is running
4. **Check database connection** - Slow DB queries can cause timeouts

### Database Errors:
1. **Check ENABLE_SYNCHRONIZE** - Should be `true` for first deployment
2. **Check DATABASE_URL** - Automatically set by Render
3. **Check Render database status** - Ensure database is running
4. **Check logs** - Look for database connection errors

## Next Steps

1. ✅ **Backend is ready** - All fixes are in place
2. ⏳ **Set FRONTEND_URL in Render** - Add your Vercel domain
3. ⏳ **Set NEXT_PUBLIC_API_URL in Vercel** - Add your Render backend URL
4. ⏳ **Redeploy both services** - After setting environment variables
5. ⏳ **Test on mobile** - Verify everything works

## Deployment Checklist

- [x] Health check endpoints added
- [x] CORS configured for Vercel domains
- [x] Error handling improved
- [x] Build successful
- [ ] FRONTEND_URL set in Render
- [ ] NEXT_PUBLIC_API_URL set in Vercel
- [ ] Both services redeployed
- [ ] Tested on mobile device

## Support

If issues persist:
1. Check Render service logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Ensure both services are deployed and running

