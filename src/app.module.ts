import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './auth/admin.entity';

const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Enable synchronize if explicitly set via env var, or in development
  // For first deployment, set ENABLE_SYNCHRONIZE=true, then set to false after tables are created
  const enableSynchronize = process.env.ENABLE_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production';
  
  const baseConfig = {
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: enableSynchronize,
    logging: process.env.NODE_ENV === 'development',
  };

  if (process.env.DATABASE_URL) {
    // PostgreSQL (production)
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      ...baseConfig,
    };
  } else {
    // SQLite (development)
    return {
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'blog.db',
      ...baseConfig,
    };
  }
};

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([Admin]),
    AuthModule,
    PostsModule,
    AdminModule,
  ],
})
export class AppModule {}

