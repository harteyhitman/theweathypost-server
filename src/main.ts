import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * -----------------------------------------
   * ENV + CORS CONFIG (Next.js friendly)
   * -----------------------------------------
   */
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    ...(isDevelopment
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ]
      : []),
  ];

  console.log('🔒 CORS enabled for:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow SSR, curl, Postman, mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isDevelopment) {
        console.warn(`⚠️ Dev mode: allowing origin ${origin}`);
        return callback(null, true);
      }

      console.error(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /**
   * -----------------------------------------
   * STATIC FILES (BLOG IMAGES)
   * -----------------------------------------
   *
   * Folder structure:
   * backend/
   * ├─ public/
   * │  └─ blog-post-images/
   *
   * URL:
   * http://localhost:3001/blog-post-images/image-xxx.png
   */
  const publicPath = join(process.cwd(), 'public');

  app.useStaticAssets(publicPath, {
    prefix: '/',
  });

  console.log('🖼️ Static assets served from:', publicPath);
  console.log('🖼️ Blog images available at: /blog-post-images/*');

  /**
   * -----------------------------------------
   * GLOBAL VALIDATION
   * -----------------------------------------
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * -----------------------------------------
   * START SERVER
   * -----------------------------------------
   */
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
