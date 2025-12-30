import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from './admin.entity';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    this.initializeAdmin();
  }

  async validateUser(username: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { username } });
    
    if (!admin) {
      return null;
    }

    if (!admin.emailVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email first.');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive.');
    }

    if (await bcrypt.compare(password, admin.password)) {
      const { password, verificationCode, verificationCodeExpiry, ...result } = admin;
      return result;
    }
    return null;
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

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setMinutes(verificationCodeExpiry.getMinutes() + 10); // 10 minutes expiry

    // Create admin
    const admin = this.adminRepository.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationCode,
      verificationCodeExpiry,
      isActive: true,
    });

    await this.adminRepository.save(admin);

    // Send verification code via email
    try {
      await this.emailService.sendVerificationCode(email, verificationCode);
    } catch (error) {
      // If email fails, still save admin but log the code
      console.log(`\n📧 Verification Code for ${email}: ${verificationCode}\n`);
    }

    return {
      message: 'Admin account created. Please check your email for verification code.',
      adminId: admin.id,
    };
  }

  async verifyEmail(email: string, code: string) {
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      throw new BadRequestException('Invalid email');
    }

    if (admin.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (admin.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > admin.verificationCodeExpiry) {
      throw new BadRequestException('Verification code has expired');
    }

    admin.emailVerified = true;
    admin.verificationCode = null;
    admin.verificationCodeExpiry = null;
    await this.adminRepository.save(admin);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendVerificationCode(email: string) {
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      throw new BadRequestException('Invalid email');
    }

    if (admin.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setMinutes(verificationCodeExpiry.getMinutes() + 10);

    admin.verificationCode = verificationCode;
    admin.verificationCodeExpiry = verificationCodeExpiry;
    await this.adminRepository.save(admin);

    // Send verification code via email
    try {
      await this.emailService.sendVerificationCode(email, verificationCode);
    } catch (error) {
      console.log(`\n📧 Verification Code for ${email}: ${verificationCode}\n`);
    }

    return {
      message: 'Verification code sent to your email.',
    };
  }

  private async initializeAdmin() {
    const adminCount = await this.adminRepository.count();
    
    // Check if there are admins without email (migration scenario)
    const adminsWithoutEmail = await this.adminRepository.find({
      where: { email: null as any },
    });
    
    // Update existing admins without email
    for (const admin of adminsWithoutEmail) {
      admin.email = admin.username === 'admin' 
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
      console.log('✅ Default admin created: username=admin, password=admin123, email=admin@thewealthypost.com');
    }
  }
}

