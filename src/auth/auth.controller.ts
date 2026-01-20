import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(
        signupDto.username,
        signupDto.email,
        signupDto.password,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'Conflict',
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * POST /auth/verify-email
   * 
   * Verify email address using JWT token
   * 
   * Request body:
   * {
   *   "token": "jwt-verification-token"
   * }
   * 
   * Success response (200):
   * {
   *   "success": true,
   *   "message": "Email verified successfully! You can now login to your account.",
   *   "emailVerified": true,
   *   "email": "user@example.com",
   *   "username": "username"
   * }
   * 
   * Error responses:
   * - 400: Invalid token, expired token, or already verified
   * - 500: Internal server error
   */
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    // Validate token is provided
    if (!verifyEmailDto.token) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Verification token is required',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.authService.verifyEmail(verifyEmailDto.token);
      
      return {
        statusCode: HttpStatus.OK,
        ...result,
      };
    } catch (error) {
      // Handle BadRequestException (invalid token, expired, etc.)
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: error.message,
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Handle unexpected errors
      console.error('Email verification error:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while verifying your email. Please try again later.',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /auth/resend-verification
   * 
   * Resend verification email to unverified users
   * 
   * Request body:
   * {
   *   "email": "user@example.com"
   * }
   * 
   * Success response (200):
   * {
   *   "success": true,
   *   "message": "Verification link has been sent to your email...",
   *   "email": "user@example.com",
   *   "remaining": 2
   * }
   * 
   * Error responses:
   * - 400: Email already verified, invalid email, or email not found
   * - 429: Rate limit exceeded (max 3 requests per hour)
   * - 500: Internal server error
   */
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    // Validate email is provided
    if (!body.email) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email address is required',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.authService.resendVerificationLink(body.email);
      
      return {
        statusCode: HttpStatus.OK,
        ...result,
      };
    } catch (error) {
      // Handle rate limit exceeded (429)
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }

      // Handle BadRequestException (already verified, invalid email, etc.)
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: error.message,
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle unexpected errors
      console.error('Resend verification error:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while sending the verification email. Please try again later.',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const admin = await this.authService.validateUser(
        loginDto.username,
        loginDto.password,
      );

      if (!admin) {
        throw new UnauthorizedException({
          message: 'Invalid username or password',
          statusCode: 401,
        });
      }

      return this.authService.login(admin);
    } catch (error) {
      // If it's already an UnauthorizedException (e.g., email not verified), re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For other errors, throw generic invalid credentials
      throw new UnauthorizedException({
        message: 'Invalid username or password',
        statusCode: 401,
      });
    }
  }
}
