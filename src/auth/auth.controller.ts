import { Controller, Post, Body, UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
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

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.code,
    );
  }

  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    return this.authService.resendVerificationCode(body.email);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const admin = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.authService.login(admin);
  }
}

