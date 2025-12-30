# Backend Deployment Guide

This guide will help you deploy the NestJS backend to various hosting platforms.

## Prerequisites

1. **Environment Variables**: Set up all required environment variables (see `.env.example`)
2. **Database**: Choose between SQLite (development) or PostgreSQL (production)
3. **Build**: Ensure the backend builds successfully with `npm run build`

## Hosting Options

### Option 1: Railway (Recommended - Easiest)

Railway is the easiest option with automatic deployments and PostgreSQL included.

#### Steps:

1. **Sign up** at [railway.app](https://railway.app)
2. **Create a new project** and select "Deploy from GitHub repo"
3. **Add PostgreSQL database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable
4. **Set environment variables**:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-domain.com`
   - `JWT_SECRET` (generate a strong random string)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for email verification)
5. **Deploy**: Railway will automatically detect the Node.js app and deploy
6. **Get your backend URL**: Railway will provide a URL like `https://your-app.railway.app`

#### Railway Configuration:
- The `railway.json` file is already configured
- Railway will use `npm run start:prod` to start the server
- Port is automatically set by Railway

---

### Option 2: Render

Render offers free tier with PostgreSQL.

#### Steps:

1. **Sign up** at [render.com](https://render.com)
2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
3. **Add PostgreSQL database**:
   - Create a new PostgreSQL database
   - Note the connection string
4. **Set environment variables** in Render dashboard:
   - `NODE_ENV=production`
   - `PORT=10000` (Render uses port 10000)
   - `DATABASE_URL` (from PostgreSQL service)
   - `FRONTEND_URL=https://your-frontend-domain.com`
   - `JWT_SECRET` (generate a strong random string)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
5. **Deploy**: Render will build and deploy automatically

#### Alternative: Use render.yaml
- The `render.yaml` file is already configured
- You can use it to deploy via Render CLI or import it in the dashboard

---

### Option 3: Heroku

#### Steps:

1. **Install Heroku CLI**: [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)
2. **Login**: `heroku login`
3. **Create app**: `heroku create your-app-name`
4. **Add PostgreSQL**: `heroku addons:create heroku-postgresql:mini`
5. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_USER=your-email@gmail.com
   heroku config:set SMTP_PASS=your-app-password
   heroku config:set SMTP_FROM=noreply@thewealthypost.com
   ```
6. **Deploy**: `git push heroku main`

---

### Option 4: DigitalOcean App Platform

#### Steps:

1. **Sign up** at [digitalocean.com](https://www.digitalocean.com)
2. **Create App**:
   - Connect GitHub repository
   - Select `backend` folder
   - Build Command: `npm install && npm run build`
   - Run Command: `npm run start:prod`
3. **Add Database**: Create a PostgreSQL database
4. **Set environment variables** in the dashboard
5. **Deploy**: DigitalOcean will handle the rest

---

## Environment Variables

Create a `.env` file in the `backend` folder with these variables:

```env
# Server
PORT=3001
NODE_ENV=production

# Frontend (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email (for admin signup verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@thewealthypost.com
```

### Generating JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

## Updating Frontend

After deploying the backend, update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Database Migration

The backend uses TypeORM with `synchronize: false` in production. For production:

1. **Use migrations** (recommended):
   ```bash
   npm run typeorm migration:generate -- -n InitialMigration
   npm run typeorm migration:run
   ```

2. **Or use synchronize: true** (only for initial setup, then disable):
   - Set `synchronize: true` temporarily
   - Deploy once to create tables
   - Set `synchronize: false` and redeploy

---

## Testing Deployment

1. **Health Check**: Visit `https://your-backend-url.com/posts`
   - Should return an array (empty or with posts)

2. **CORS Test**: Try accessing from your frontend
   - Should work without CORS errors

3. **Admin Login**: Test the admin login endpoint
   - `POST https://your-backend-url.com/auth/login`

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from hosting platform
- Ensure SSL is enabled for production databases

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check for trailing slashes
- Ensure credentials are enabled

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Static Files Not Serving
- Verify `public` folder exists in deployment
- Check file paths are correct
- Some platforms may require different static file configuration

---

## Security Checklist

- [ ] `JWT_SECRET` is a strong random string
- [ ] `DATABASE_URL` uses SSL in production
- [ ] `synchronize: false` in production
- [ ] CORS is properly configured
- [ ] Environment variables are not committed to git
- [ ] SMTP credentials are secure

---

## Support

For issues, check:
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- Platform-specific documentation (Railway, Render, etc.)

