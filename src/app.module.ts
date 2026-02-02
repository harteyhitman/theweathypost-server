import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { Admin } from './auth/admin.entity';
import { getEnvConfig } from './config/env.config';

const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const config = getEnvConfig();
  const enableSynchronize =
    config.ENABLE_SYNCHRONIZE === true || config.NODE_ENV !== 'production';
  const baseConfig = {
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: enableSynchronize,
    logging: config.NODE_ENV === 'development',
  };

  if (config.DATABASE_URL) {
    return {
      type: 'postgres',
      url: config.DATABASE_URL,
      ssl:
        config.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      ...baseConfig,
    };
  }
  return {
    type: 'sqlite',
    database: config.DATABASE_PATH || 'blog.db',
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
    HealthModule,
  ],
})
export class AppModule {}

