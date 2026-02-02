import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

export interface EnvConfig {
  // Required in production
  EMAIL_VERIFICATION_SECRET: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;

  // Optional
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL?: string;
}

/**
 * Validates environment variables at startup
 * Throws error if required variables are missing in production
 */
export function validateEnvironment(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  // Required in all environments
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production') {
    errors.push('JWT_SECRET is required and must not be the default value');
  }

  // Required in production, optional in development
  const emailVerificationSecret =
    process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET;
  if (
    isProduction &&
    (!emailVerificationSecret ||
      emailVerificationSecret === 'email-verification-secret-change-in-production')
  ) {
    errors.push(
      'EMAIL_VERIFICATION_SECRET is required in production (or use JWT_SECRET)',
    );
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (isProduction && !frontendUrl) {
    errors.push('FRONTEND_URL is required in production');
  }

  // Validate format
  if (frontendUrl && !isValidUrl(frontendUrl)) {
    errors.push('FRONTEND_URL must be a valid URL (e.g., https://example.com)');
  }

  // Log errors or throw
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    
    if (isProduction) {
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      logger.warn(`⚠️  Environment validation warnings:\n${errors.join('\n')}`);
      logger.warn('⚠️  These will be required in production');
    }
  }

  // Return validated config
  const config: EnvConfig = {
    EMAIL_VERIFICATION_SECRET: emailVerificationSecret || jwtSecret || '',
    FRONTEND_URL:
      frontendUrl || 'https://thewealthypost-01.vercel.app',
    JWT_SECRET: jwtSecret || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 3001,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  // Log successful validation (without secrets)
  logger.log('✅ Environment variables validated');
  logger.log(`   NODE_ENV: ${config.NODE_ENV}`);
  logger.log(`   PORT: ${config.PORT}`);
  logger.log(`   FRONTEND_URL: ${config.FRONTEND_URL}`);
  logger.log(
    `   EMAIL_VERIFICATION_SECRET: ${config.EMAIL_VERIFICATION_SECRET ? '✅ Set' : '❌ Missing'}`,
  );

  return config;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

