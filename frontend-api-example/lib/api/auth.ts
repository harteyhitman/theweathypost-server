/**
 * API client for authentication endpoints
 * Base URL should be set via environment variable: NEXT_PUBLIC_API_URL
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SignupResponse {
  message: string;
  adminId: number;
  email: string;
  emailVerified: boolean;
  requiresVerification: boolean;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  emailVerified: boolean;
  email: string;
  username: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  email: string;
  remaining: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  remaining?: number;
  resetAt?: number;
}

/**
 * Signup a new user
 */
export async function signup(
  username: string,
  email: string,
  password: string,
): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Signup failed');
  }

  return data;
}

/**
 * Verify email using token from URL
 */
export async function verifyEmail(
  token: string,
): Promise<VerifyEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = data;
    throw new Error(error.message || 'Email verification failed');
  }

  return data;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = data;
    
    // Handle rate limit error
    if (response.status === 429) {
      throw new Error(
        error.message || 'Too many requests. Please try again later.',
      );
    }
    
    throw new Error(error.message || 'Failed to resend verification email');
  }

  return data;
}
