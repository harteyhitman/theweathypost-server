import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './auth/admin.entity';

const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const baseConfig = {
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
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

