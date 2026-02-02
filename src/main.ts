import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* ============================================================
     ENV
  ============================================================ */
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PORT = Number(process.env.PORT) || 3001;

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
