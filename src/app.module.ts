import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './auth/admin.entity';

const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSynchronize =
    process.env.ENABLE_SYNCHRONIZE === 'true' || !isProduction;

  const baseConfig = {
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: enableSynchronize,
    logging: !isProduction,
  };

  // Use DATABASE_URL directly — no host/port/username parsing (avoids ENOTFOUND)
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      ...baseConfig,
    };
  }

  return {
    type: 'sqlite',
    database: process.env.DATABASE_PATH || 'blog.db',
    ...baseConfig,
  };
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

