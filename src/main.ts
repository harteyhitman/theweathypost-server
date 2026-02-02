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
     CORS CONFIG (Vercel + Local + Postman safe)
     - Must allow exact origins so preflight gets Access-Control-Allow-Origin
     - Never throw in origin callback (error responses would lack CORS headers)
  ============================================================ */
  const allowedOrigins = [
    'https://thewealthypost-01.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return true; // server-to-server, Postman, curl
    if (allowedOrigins.includes(origin)) return true;
    // Vercel preview/production (*.vercel.app)
    if (origin.endsWith('.vercel.app')) return true;
    return false;
  };

  console.log('🔒 Allowed CORS origins:', allowedOrigins, '+ *.vercel.app');

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      // Do NOT throw here: error responses would not include CORS headers
      console.warn('CORS blocked origin:', origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204,
    preflightContinue: false, // respond to OPTIONS with 204 (default, explicit for clarity)
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
