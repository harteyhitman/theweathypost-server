/**
 * Centralized environment configuration
 * All environment variables should be accessed through this module
 */

import { validateEnvironment, EnvConfig } from './env.validation';

type EnvConfigType = EnvConfig;

let envConfig: EnvConfigType | null = null;

/**
 * Get validated environment configuration
 * Should be called once at application startup
 */
export function getEnvConfig() {
  if (!envConfig) {
    envConfig = validateEnvironment();
  }
  return envConfig;
}

/**
 * Get environment variable with validation
 * Use this instead of direct process.env access
 */
export const Env = {
  get NODE_ENV() {
    return getEnvConfig().NODE_ENV;
  },

  get PORT() {
    return getEnvConfig().PORT;
  },

  get JWT_SECRET() {
    return getEnvConfig().JWT_SECRET;
  },

  get EMAIL_VERIFICATION_SECRET() {
    return getEnvConfig().EMAIL_VERIFICATION_SECRET;
  },

  get SENDGRID_API_KEY() {
    return getEnvConfig().SENDGRID_API_KEY;
  },

  get SENDGRID_FROM() {
    return getEnvConfig().SENDGRID_FROM;
  },

  get FRONTEND_URL() {
    return getEnvConfig().FRONTEND_URL;
  },

  get DATABASE_URL() {
    return getEnvConfig().DATABASE_URL;
  },

  get isProduction() {
    return this.NODE_ENV === 'production';
  },

  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
};
