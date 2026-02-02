import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from './admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {
    this.initializeAdmin().catch((error) => {
      console.error('Failed to initialize admin:', error.message);
      setTimeout(() => {
        this.initializeAdmin().catch((err) => {
          console.error('Retry failed to initialize admin:', err.message);
        });
      }, 2000);
    });
  }

  async validateUser(username: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin) {
      return null;
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive.');
    }

    if (await bcrypt.compare(password, admin.password)) {
      const { password: _, ...result } = admin;
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

  /**
   * Signup: create account and allow immediate login (no email verification).
   */
  async signup(username: string, email: string, password: string) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.adminRepository.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: true, // No email verification: ready to use immediately
      isActive: true,
    });

    await this.adminRepository.save(admin);

    return {
      message: 'Account created successfully. You can log in now.',
      adminId: admin.id,
      email: admin.email,
    };
  }

  private async initializeAdmin() {
    const adminCount = await this.adminRepository.count();

    const adminsWithoutEmail = await this.adminRepository.find({
      where: { email: null as any },
    });

    for (const admin of adminsWithoutEmail) {
      admin.email =
        admin.username === 'admin'
          ? 'admin@thewealthypost.com'
          : `${admin.username}@thewealthypost.com`;
      await this.adminRepository.save(admin);
    }

    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.adminRepository.create({
        username: 'admin',
        email: 'admin@thewealthypost.com',
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
      });
      await this.adminRepository.save(admin);
      console.log(
        '✅ Default admin created: username=admin, password=admin123, email=admin@thewealthypost.com',
      );
    }
  }
}
