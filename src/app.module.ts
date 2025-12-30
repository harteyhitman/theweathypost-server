import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './auth/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
      // PostgreSQL (production)
      ...(process.env.DATABASE_URL ? {
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      } : {
        // SQLite (development)
        database: process.env.DATABASE_PATH || 'blog.db',
      }),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // Only true in development
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Admin]),
    AuthModule,
    PostsModule,
    AdminModule,
  ],
})
export class AppModule {}

