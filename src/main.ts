import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getEnvConfig, Env } from './config/env.config';

async function bootstrap() {
  // Validate environment variables FIRST - fail fast if invalid
  try {
    getEnvConfig();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* ============================================================
     ENV (using validated config)
  ============================================================ */
  const NODE_ENV = Env.NODE_ENV;
  const PORT = Env.PORT;

  /* ============================================================
     CORS CONFIG (Vercel + previews + Local + Postman safe)
     Set FRONTEND_URL on Render to your main frontend URL.
  ============================================================ */
  const frontendUrl = Env.FRONTEND_URL?.replace(/\/$/, '') || '';
  const allowedOrigins = [
    frontendUrl,
    'https://thewealthypost-01.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  // Allow any *.vercel.app preview (same project)
  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedOrigins.includes(origin)) return true;
    try {
      const u = new URL(origin);
      if (u.hostname.endsWith('.vercel.app')) return true;
    } catch {
      /* ignore */
    }
    return false;
  };

  console.log('🔒 Allowed CORS origins:', [...new Set(allowedOrigins)], '+ *.vercel.app');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, SSR, same-origin)
      if (!origin) {
        return callback(null, true);
      }
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.error('❌ CORS blocked:', origin);
      // Reject without throwing so error response can still get CORS headers
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  /* ============================================================
     STATIC FILES (BLOG IMAGES)
  ============================================================ */
  const publicPath = join(process.cwd(), 'public');

  app.useStaticAssets(publicPath, {
    prefix: '/',
  });

  console.log('🖼️ Static assets served from:', publicPath);
  console.log('🖼️ Blog images available at: /blog-post-images/*');

  /* ============================================================
     GLOBAL VALIDATION
  ============================================================ */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /* ============================================================
     START SERVER
  ============================================================ */
  await app.listen(PORT);

  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
}

bootstrap();
