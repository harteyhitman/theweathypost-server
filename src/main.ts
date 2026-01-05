import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for Next.js frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrl.split(',').map(url => url.trim());
  
  // Add common development origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  
  // Combine allowed origins
  const allAllowedOrigins = [...allowedOrigins, ...(isDevelopment ? developmentOrigins : [])];
  
  console.log(`🔒 CORS Configuration:`);
  console.log(`   - Allowed origins: ${allAllowedOrigins.join(', ')}`);
  console.log(`   - Development mode: ${isDevelopment}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allAllowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (isDevelopment) {
        // In development, allow all origins for easier testing
        console.log(`✅ Allowing origin in development: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS. Allowed origins: ${allAllowedOrigins.join(', ')}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from public directory (only if directory exists)
  const publicPath = join(__dirname, '..', '..', 'public');
  try {
    const fs = require('fs');
    if (fs.existsSync(publicPath)) {
      app.useStaticAssets(publicPath, {
        prefix: '/',
      });
    }
  } catch (error) {
    console.warn('Could not set up static assets:', error);
  }

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

