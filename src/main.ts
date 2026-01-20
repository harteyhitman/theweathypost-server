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
  ============================================================ */
  const allowedOrigins = [
    'https://thewealthypost-01.vercel.app', // ✅ Vercel frontend
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  console.log('🔒 Allowed CORS origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, curl, SSR
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error('❌ CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
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
