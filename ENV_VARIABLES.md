# Environment Variables Documentation

## Required Environment Variables

### Production (Required)

These variables **MUST** be set in production. The application will fail to start if they are missing.

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-key-here` | Must be at least 32 characters, randomly generated |
| `EMAIL_VERIFICATION_SECRET` | Secret key for email verification tokens | `your-email-verification-secret` | Can fallback to `JWT_SECRET` if not set |
| `FRONTEND_URL` | Frontend application URL | `https://thewealthypost-01.vercel.app` | Used for CORS and verification links |

### Development (Optional)

These variables have defaults for local development but should be set for proper functionality.

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `NODE_ENV` | Environment mode | `development` | Set to `production` in production |
| `PORT` | Server port | `3001` | Override if needed |
| `DATABASE_URL` | PostgreSQL connection string | Uses SQLite | Required for production |

## Environment Variable Validation

The application validates environment variables at startup:

- **Production**: Application will **fail to start** if required variables are missing
- **Development**: Application will **warn** but continue if variables are missing

## Security Best Practices

### 1. Secret Generation

Generate strong secrets using:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate EMAIL_VERIFICATION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Never Commit Secrets

- Add `.env` to `.gitignore`
- Use environment variable management in your hosting platform
- Never log or expose secrets in error messages

### 3. Separate Secrets

- Use different secrets for `JWT_SECRET` and `EMAIL_VERIFICATION_SECRET` in production
- Rotate secrets periodically
- Use different secrets per environment (dev, staging, production)

### 4. Frontend URL

- Must be a valid HTTPS URL in production
- Should match your frontend domain exactly
- Used in email verification links

## Example `.env` File

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Security Secrets (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
EMAIL_VERIFICATION_SECRET=your-email-verification-secret-key

# Frontend URL (REQUIRED)
FRONTEND_URL=https://thewealthypost-01.vercel.app

# Database (Production)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Validation Errors

If validation fails at startup, you'll see:

```
❌ Environment validation failed:
   JWT_SECRET is required and must not be the default value
   FRONTEND_URL is required in production
```

Fix these errors before deploying to production.

## Deployment Platforms

### Railway

Set environment variables in Railway dashboard:
1. Go to your project → Variables
2. Add each required variable
3. Redeploy

### Render

Set environment variables in Render dashboard:
1. Go to your service → Environment
2. Add each required variable
3. Save and redeploy

### Vercel

Set environment variables in Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each required variable
3. Redeploy

## Troubleshooting

### "FRONTEND_URL must be a valid URL"

- Ensure URL starts with `http://` or `https://`
- No trailing slashes
- Valid domain format

## Security Checklist

- [ ] All required variables set in production
- [ ] Secrets are randomly generated (not default values)
- [ ] Different secrets for each environment
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in code or logs
- [ ] Frontend URL is correct HTTPS URL
- [ ] Secrets are rotated periodically
