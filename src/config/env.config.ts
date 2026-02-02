/**
 * Centralized environment configuration
 * All environment variables should be accessed through this module
 */

import { validateEnvironment, EnvConfig } from './env.validation';

let envConfig: EnvConfig | null = null;

/**
 * Get validated environment configuration
 * Must be called once at application startup (main.ts) before creating the app
 */
export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnvironment();
  }
  return envConfig;
}

/**
 * Environment accessors. Use these instead of process.env.
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

  get FRONTEND_URL() {
    return getEnvConfig().FRONTEND_URL;
  },

  get DATABASE_URL() {
    return getEnvConfig().DATABASE_URL;
  },

  get ENABLE_SYNCHRONIZE() {
    return getEnvConfig().ENABLE_SYNCHRONIZE;
  },

  get DATABASE_PATH() {
    return getEnvConfig().DATABASE_PATH;
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

  get isEmailConfigured() {
    return getEnvConfig().isEmailConfigured;
  },

  get isProduction() {
    return getEnvConfig().NODE_ENV === 'production';
  },

  get isDevelopment() {
    return getEnvConfig().NODE_ENV === 'development';
  },
};
