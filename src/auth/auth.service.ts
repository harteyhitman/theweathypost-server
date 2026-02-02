import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Admin } from './admin.entity';
import { EmailService } from './email.service';
import { Env } from '../config/env.config';

interface RateLimitEntry {
  timestamps: number[];
  lastCleanup: number;
}

@Injectable()
export class AuthService {
  private readonly emailVerificationSecret: string;
  private readonly emailVerificationExpiry: string;
  private readonly frontendUrl: string;
  
  // Rate limiting configuration
  private readonly RATE_LIMIT_MAX_REQUESTS = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up every 5 minutes

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    // Email verification JWT configuration (using validated env)
    this.emailVerificationSecret = Env.EMAIL_VERIFICATION_SECRET;
    this.emailVerificationExpiry = '15m'; // 15 minutes
    this.frontendUrl = Env.FRONTEND_URL;

    // Start periodic cleanup of rate limit store
    this.startRateLimitCleanup();

    // Initialize admin asynchronously, don't block constructor
    this.initializeAdmin().catch((error) => {
      console.error('Failed to initialize admin:', error.message);
      // Retry after a short delay (database might still be initializing)
      setTimeout(() => {
        this.initializeAdmin().catch((err) => {
          console.error('Retry failed to initialize admin:', err.message);
        });
      }, 2000);
    });
  }

  /**
   * Clean up old rate limit entries periodically
   */
  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.RATE_LIMIT_WINDOW_MS;

      for (const [email, entry] of this.rateLimitStore.entries()) {
        // Remove timestamps older than the window
        entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

        // Remove entry if no timestamps remain
        if (entry.timestamps.length === 0) {
          this.rateLimitStore.delete(email);
        }
      }
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Check if email has exceeded rate limit
   * Returns true if rate limit is exceeded
   */
  private checkRateLimit(email: string): {
    exceeded: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const cutoff = now - this.RATE_LIMIT_WINDOW_MS;

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(email);
    if (!entry) {
      entry = {
        timestamps: [],
        lastCleanup: now,
      };
      this.rateLimitStore.set(email, entry);
    }

    // Remove old timestamps
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

    // Check if limit exceeded
    const requestCount = entry.timestamps.length;
    const exceeded = requestCount >= this.RATE_LIMIT_MAX_REQUESTS;
    const remaining = Math.max(0, this.RATE_LIMIT_MAX_REQUESTS - requestCount);
    
    // Calculate reset time (oldest timestamp + window)
    const resetAt = entry.timestamps.length > 0
      ? Math.min(...entry.timestamps) + this.RATE_LIMIT_WINDOW_MS
      : now + this.RATE_LIMIT_WINDOW_MS;

    return { exceeded, remaining, resetAt };
  }

  /**
   * Record a rate limit request
   */
  private recordRateLimitRequest(email: string): void {
    const now = Date.now();
    let entry = this.rateLimitStore.get(email);
    
    if (!entry) {
      entry = {
        timestamps: [],
        lastCleanup: now,
      };
      this.rateLimitStore.set(email, entry);
    }

    entry.timestamps.push(now);
  }

  /**
   * Generate a JWT token for email verification
   * Payload includes userId and email
   */
  private generateVerificationToken(userId: number, email: string): string {
    const payload: { sub: number; email: string; type: string } = {
      sub: userId,
      email,
      type: 'email_verification',
    };

    return jwt.sign(payload, this.emailVerificationSecret, {
      expiresIn: this.emailVerificationExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode email verification token
   * Validates JWT signature, expiry, and token type
   */
  private verifyVerificationToken(token: string): {
    userId: number;
    email: string;
  } {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new BadRequestException('Verification token is required');
    }

    try {
      const decoded = jwt.verify(
        token.trim(),
        this.emailVerificationSecret,
      ) as jwt.JwtPayload & { sub: number; email: string; type: string };

      // Validate token type
      if (decoded.type !== 'email_verification') {
        throw new BadRequestException('Invalid token type. This token is not for email verification.');
      }

      // Validate required fields
      if (!decoded.sub || !decoded.email) {
        throw new BadRequestException('Invalid token payload. Missing required fields.');
      }

      return {
        userId: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException(
          'Verification token has expired. Please request a new verification link.',
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid verification token. The token is malformed or invalid.');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify token. Please try again.');
    }
  }

  /**
   * Validate user credentials and check email verification status
   * Throws UnauthorizedException if email is not verified
   */
  async validateUser(username: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin) {
      return null;
    }

    // Check password first to avoid revealing if user exists
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    // Check if account is active
    if (!admin.isActive) {
      throw new UnauthorizedException({
        message: 'Your account has been deactivated. Please contact support.',
        statusCode: 401,
      });
    }

    // Check if email is verified - this blocks login
    if (!admin.emailVerified) {
      throw new UnauthorizedException({
        message:
          'Your email address has not been verified. Please check your inbox for the verification link and click it to verify your email before logging in.',
        statusCode: 401,
        email: admin.email,
        canResend: true,
      });
    }

    // Remove sensitive fields before returning
    const { password: _, verificationCode, verificationCodeExpiry, ...result } =
      admin;
    return result;
  }

  async login(admin: any) {
    const payload = { username: admin.username, sub: admin.id };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    };
  }

  /**
   * Signup new admin user
   * Creates user with emailVerified = false and sends verification email immediately
   */
  async signup(username: string, email: string, password: string) {
    // Check if username or email already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingAdmin) {
      if (existingAdmin.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existingAdmin.email === email) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin with emailVerified = false
    const admin = this.adminRepository.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: false, // Explicitly set to false
      isActive: true,
    });

    // Save admin to database first
    await this.adminRepository.save(admin);

    // Generate verification token immediately after user creation
    const verificationToken = this.generateVerificationToken(admin.id, email);
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    // Send verification email immediately after signup
    let emailSent = false;
    try {
      await this.emailService.sendEmailVerification(email, verificationUrl);
      emailSent = true;
    } catch (error) {
      // Log error but don't fail signup - user can request resend
      console.error('Failed to send verification email:', error);
      // In development, log the token for testing
      if (Env.isDevelopment) {
        console.log(
          `\n📧 Verification Token for ${email}: ${verificationToken}\n`,
        );
        console.log(`🔗 Verification URL: ${verificationUrl}\n`);
      }
    }

    return {
      message: emailSent
        ? 'Account created successfully. Please check your email for the verification link to activate your account.'
        : 'Account created successfully. Verification email could not be sent. Please use the resend verification link.',
      adminId: admin.id,
      email,
      emailVerified: false,
      requiresVerification: true,
    };
  }

  /**
   * Verify email address using JWT token
   * POST /auth/verify-email
   * 
   * Requirements:
   * - Accept verification token
   * - Validate JWT token
   * - Mark user as email verified
   * - Prevent double verification
   * - Return success message
   */
  async verifyEmail(token: string) {
    // Step 1: Validate and decode JWT token
    const { userId, email } = this.verifyVerificationToken(token);

    // Step 2: Find admin by ID and email (both must match for security)
    const admin = await this.adminRepository.findOne({
      where: { id: userId, email },
    });

    if (!admin) {
      // Generic error message to prevent information leakage
      throw new BadRequestException('Invalid or expired verification token.');
    }

    // Step 3: Prevent double verification
    if (admin.emailVerified) {
      return {
        success: true,
        message: 'Email address is already verified. You can login now.',
        emailVerified: true,
        email: admin.email,
        username: admin.username,
      };
    }

    // Step 4: Mark user as email verified
    admin.emailVerified = true;
    await this.adminRepository.save(admin);

    // Step 5: Return success message
    return {
      success: true,
      message: 'Email verified successfully! You can now login to your account.',
      emailVerified: true,
      email: admin.email,
      username: admin.username,
    };
  }

  /**
   * Resend verification email
   * POST /auth/resend-verification
   * 
   * Requirements:
   * - Only allowed for unverified users
   * - Rate limit: max 3 requests per hour per user
   * - Generate a new verification token
   * - Send email using SendGrid
   */
  async resendVerificationLink(email: string) {
    // Step 1: Validate email format
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Step 2: Check rate limit
    const rateLimitCheck = this.checkRateLimit(normalizedEmail);
    if (rateLimitCheck.exceeded) {
      const resetDate = new Date(rateLimitCheck.resetAt);
      throw new HttpException(
        {
          message: `Too many verification email requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
          statusCode: 429,
          remaining: rateLimitCheck.remaining,
          resetAt: rateLimitCheck.resetAt,
          maxRequests: this.RATE_LIMIT_MAX_REQUESTS,
          windowMinutes: this.RATE_LIMIT_WINDOW_MS / (60 * 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Step 3: Find user by email
    const admin = await this.adminRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      // Don't reveal if user exists - just return generic message
      // But still record rate limit to prevent email enumeration
      this.recordRateLimitRequest(normalizedEmail);
      throw new BadRequestException(
        'If an account exists with this email, a verification link will be sent.',
      );
    }

    // Step 4: Only allowed for unverified users
    if (admin.emailVerified) {
      throw new BadRequestException(
        'This email address is already verified. You can login directly.',
      );
    }

    // Step 5: Record rate limit request
    this.recordRateLimitRequest(normalizedEmail);

    // Step 6: Generate new verification token
    const verificationToken = this.generateVerificationToken(admin.id, normalizedEmail);
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    // Step 7: Send verification email using SendGrid
    try {
      await this.emailService.sendEmailVerification(normalizedEmail, verificationUrl);
      
      return {
        success: true,
        message:
          'Verification link has been sent to your email. Please check your inbox and click the link to verify your email.',
        email: normalizedEmail,
        remaining: rateLimitCheck.remaining - 1,
      };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      // In development, log the token for testing
      if (Env.isDevelopment) {
        console.log(
          `\n📧 Verification Token for ${normalizedEmail}: ${verificationToken}\n`,
        );
        console.log(`🔗 Verification URL: ${verificationUrl}\n`);
      }
      
      throw new BadRequestException(
        'Failed to send verification email. Please try again later.',
      );
    }
  }

  private async initializeAdmin() {
    const adminCount = await this.adminRepository.count();

    // Check if there are admins without email (migration scenario)
    const adminsWithoutEmail = await this.adminRepository.find({
      where: { email: null as any },
    });

    // Update existing admins without email
    for (const admin of adminsWithoutEmail) {
      admin.email =
        admin.username === 'admin'
          ? 'admin@thewealthypost.com'
          : `${admin.username}@thewealthypost.com`;
      admin.emailVerified = admin.username === 'admin'; // Auto-verify default admin
      await this.adminRepository.save(admin);
    }

    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.adminRepository.create({
        username: 'admin',
        email: 'admin@thewealthypost.com',
        password: hashedPassword,
        emailVerified: true, // Auto-verify default admin
        isActive: true,
      });
      await this.adminRepository.save(admin);
      console.log(
        '✅ Default admin created: username=admin, password=admin123, email=admin@thewealthypost.com',
      );
    }
  }
}
