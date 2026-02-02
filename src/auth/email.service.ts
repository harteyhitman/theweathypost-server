import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { Env } from '../config/env.config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor() {
    // Use validated environment variables
    const apiKey = Env.SENDGRID_API_KEY;
    const fromEmail = Env.SENDGRID_FROM;

    // In production, API key should already be validated at startup
    if (!apiKey) {
      if (Env.isProduction) {
        this.logger.error(
          '❌ SENDGRID_API_KEY is required in production. Application should not have started.',
        );
        throw new Error('SENDGRID_API_KEY is required in production');
      } else {
        this.logger.warn(
          '⚠️  SENDGRID_API_KEY not set. Email sending will fail.',
        );
      }
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log('✅ SendGrid API key configured');
    }

    this.fromEmail = fromEmail;
    this.logger.log(`✅ SendGrid from email: ${fromEmail}`);
  }

  async sendEmailVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#6e61ff; margin-bottom: 20px;">Verify your email</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thanks for signing up to <b>The Wealthy Post</b>.
          </p>

          <div style="margin: 30px 0;">
            <a href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background: #6e61ff;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
              ">
              Verify Email
            </a>
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #555;">
            This link expires in 24 hours.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`✅ Verification email sent successfully to ${email}`);
    } catch (error: any) {
      this.logger.error('❌ SendGrid email sending failed', {
        error: error.message,
        code: error.code,
        response: error.response?.body,
        email,
        method: 'sendEmailVerification',
      });

      // Log full error details in development
      if (Env.isDevelopment) {
        this.logger.debug('Full error details:', error);
        console.log(`🔗 DEV VERIFY LINK: ${verificationUrl}`);
        return;
      }

      // In production, throw exception to allow caller to handle
      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  async sendVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Your verification code',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#6e61ff; margin-bottom: 20px;">Verify your email</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thanks for signing up to <b>The Wealthy Post</b>.
          </p>

          <p style="margin-top: 20px; font-size: 18px; color: #333;">
            Your verification code is:
          </p>

          <div style="
            display: inline-block;
            margin: 20px 0;
            padding: 15px 30px;
            background: #f5f5f5;
            border-radius: 6px;
            font-size: 24px;
            font-weight: bold;
            color: #6e61ff;
            letter-spacing: 4px;
            border: 2px solid #e0e0e0;
          ">
            ${verificationCode}
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #555;">
            This code expires in 10 minutes.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`✅ Verification code sent successfully to ${email}`);
    } catch (error: any) {
      this.logger.error('❌ SendGrid email sending failed', {
        error: error.message,
        code: error.code,
        response: error.response?.body,
        email,
        method: 'sendVerificationCode',
      });

      // Log full error details in development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug('Full error details:', error);
        console.log(`🔑 DEV VERIFICATION CODE: ${verificationCode}`);
        return;
      }

      // In production, throw exception to allow caller to handle
      throw new InternalServerErrorException(
        'Unable to send verification code. Please try again later.',
      );
    }
  }
}
