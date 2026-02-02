# The Wealthy Post - Backend API

NestJS backend API for The Wealthy Post blog admin dashboard.

## Features

- 🔐 JWT Authentication
- 📧 Email Verification for Admin Signup
- 📝 Blog Post Management (CRUD)
- 🖼️ Image Upload
- 🗄️ Database Support (SQLite for dev, PostgreSQL for production)

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**:
   ```bash
   npm run start:dev
   ```

   Server will run on `http://localhost:3001`

### Production Build

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm run start:prod
   ```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables:
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret key for JWT tokens
- `DATABASE_URL` - PostgreSQL connection string (production)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email configuration

## API Endpoints

### Authentication
- `POST /auth/signup` - Create admin account
- `POST /auth/verify-email` - Verify email with code
- `POST /auth/login` - Login admin
- `POST /auth/resend-code` - Resend verification code

### Posts
- `GET /posts` - Get all published posts
- `GET /posts/:id` - Get post by ID
- `GET /posts/slug/:slug` - Get post by slug
- `POST /posts` - Create post (requires auth)
- `PATCH /posts/:id` - Update post (requires auth)
- `DELETE /posts/:id` - Delete post (requires auth)
- `POST /posts/upload-image` - Upload image (requires auth)

### Admin
- `GET /admin/posts` - Get all posts including unpublished (requires auth)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:

1. **Railway** (Recommended)
   - Connect GitHub repo
   - Add PostgreSQL database
   - Set environment variables
   - Deploy automatically

2. **Render**
   - Use `render.yaml` configuration
   - Add PostgreSQL database
   - Set environment variables

3. **Heroku**
   - Use `Procfile`
   - Add PostgreSQL addon
   - Set environment variables

## Database

- **Development**: SQLite (stored in `blog.db`)
- **Production**: PostgreSQL (recommended)

The app automatically detects which database to use based on the `DATABASE_URL` environment variable.

## Security Notes

- JWT tokens expire after 24 hours
- Email verification codes expire after 10 minutes
- Passwords are hashed using bcrypt
- CORS is configured for frontend domain only
- `synchronize: false` in production (use migrations)

## License

ISC
