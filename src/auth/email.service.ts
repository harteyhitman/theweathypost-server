import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { Env } from '../config/env.config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  /** When false, send methods no-op (SendGrid not configured); app never crashes. */
  private readonly enabled: boolean;

  constructor() {
    this.enabled = Env.isEmailConfigured;
    this.fromEmail = Env.SENDGRID_FROM;

    if (!this.enabled) {
      this.logger.warn(
        'Email (SendGrid) is not configured; verification emails will be skipped.',
      );
    } else {
      sgMail.setApiKey(Env.SENDGRID_API_KEY);
      this.logger.log('SendGrid configured');
    }
  }

  async sendEmailVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Email not configured; skipping verification email to ${email}`);
      if (Env.isDevelopment) {
        this.logger.debug(`DEV verification URL: ${verificationUrl}`);
      }
      return;
    }

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
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error: any) {
      this.logger.error('SendGrid send failed', {
        error: error.message,
        code: error.code,
        email,
        method: 'sendEmailVerification',
      });

      if (Env.isDevelopment) {
        this.logger.debug('Full error details:', error);
        this.logger.debug(`DEV verification URL: ${verificationUrl}`);
        return;
      }

      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  async sendVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Email not configured; skipping verification code to ${email}`);
      if (Env.isDevelopment) {
        this.logger.debug(`DEV verification code: ${verificationCode}`);
      }
      return;
    }

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
      this.logger.log(`Verification code sent to ${email}`);
    } catch (error: any) {
      this.logger.error('SendGrid send failed', {
        error: error.message,
        code: error.code,
        email,
        method: 'sendVerificationCode',
      });

      if (Env.isDevelopment) {
        this.logger.debug('Full error details:', error);
        this.logger.debug(`DEV verification code: ${verificationCode}`);
        return;
      }

      throw new InternalServerErrorException(
        'Unable to send verification code. Please try again later.',
      );
    }
  }
}
