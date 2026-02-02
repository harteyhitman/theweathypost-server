import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

export interface EnvConfig {
  // Core (boot-critical) - validated; missing in prod throws
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  PORT: number;

  // Optional / infra
  DATABASE_URL?: string;
  ENABLE_SYNCHRONIZE?: boolean;
  DATABASE_PATH?: string;

  // Email (feature-level) - never block boot; empty if not configured
  SENDGRID_API_KEY: string;
  SENDGRID_FROM: string;
  EMAIL_VERIFICATION_SECRET: string;
  /** True only when SendGrid is fully configured; email features disabled otherwise */
  isEmailConfigured: boolean;
}

/**
 * Core validation: required for boot in production.
 * Throws only when JWT_SECRET or FRONTEND_URL (in prod) are missing/invalid.
 */
function validateCore(): {
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  PORT: number;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production') {
    errors.push('JWT_SECRET is required and must not be the default value');
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (isProduction && !frontendUrl) {
    errors.push('FRONTEND_URL is required in production');
  }
  if (frontendUrl && !isValidUrl(frontendUrl)) {
    errors.push('FRONTEND_URL must be a valid URL (e.g., https://example.com)');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = Number(process.env.PORT) || 3001;
  if (port < 1 || port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    JWT_SECRET: jwtSecret!,
    FRONTEND_URL: frontendUrl || 'https://thewealthypost-01.vercel.app',
    NODE_ENV: nodeEnv,
    PORT: port,
  };
}

/**
 * Feature-level validation for email. Never throws.
 * Returns email-related config and isEmailConfigured flag.
 */
function validateEmail(core: { JWT_SECRET: string }): {
  SENDGRID_API_KEY: string;
  SENDGRID_FROM: string;
  EMAIL_VERIFICATION_SECRET: string;
  isEmailConfigured: boolean;
} {
  const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
  const sendgridFromRaw = process.env.SENDGRID_FROM || 'noreply@thewealthypost.com';
  const sendgridFrom = isValidEmail(sendgridFromRaw) ? sendgridFromRaw : 'noreply@thewealthypost.com';

  const emailVerificationSecret =
    process.env.EMAIL_VERIFICATION_SECRET ||
    process.env.JWT_SECRET ||
    core.JWT_SECRET ||
    '';

  const isEmailConfigured =
    Boolean(sendgridApiKey && sendgridApiKey.length > 0) && isValidEmail(sendgridFrom);

  if (!isEmailConfigured) {
    logger.warn(
      'Email (SendGrid) is not configured; verification emails will be skipped. Set SENDGRID_API_KEY and SENDGRID_FROM to enable.',
    );
  } else {
    logger.log('Email (SendGrid) is configured');
  }

  return {
    SENDGRID_API_KEY: sendgridApiKey,
    SENDGRID_FROM: sendgridFrom,
    EMAIL_VERIFICATION_SECRET: emailVerificationSecret,
    isEmailConfigured,
  };
}

/**
 * Validates environment at startup.
 * Core (JWT_SECRET, FRONTEND_URL in prod) throws in production if invalid.
 * Email vars never block boot; email features disabled when SendGrid is missing.
 */
export function validateEnvironment(): EnvConfig {
  const core = validateCore();
  const email = validateEmail(core);

  const config: EnvConfig = {
    ...core,
    DATABASE_URL: process.env.DATABASE_URL,
    ENABLE_SYNCHRONIZE: process.env.ENABLE_SYNCHRONIZE === 'true',
    DATABASE_PATH: process.env.DATABASE_PATH || 'blog.db',
    ...email,
  };

  logger.log('Environment validated');
  logger.log(`  NODE_ENV: ${config.NODE_ENV}`);
  logger.log(`  PORT: ${config.PORT}`);
  logger.log(`  FRONTEND_URL: ${config.FRONTEND_URL}`);
  logger.log(`  JWT_SECRET: ${config.JWT_SECRET ? 'set' : 'missing'}`);
  logger.log(`  Email configured: ${config.isEmailConfigured}`);

  return config;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
