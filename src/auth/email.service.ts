import { Injectable, Logger } from '@nestjs/common';

/**
 * Stub email service. Does not send real emails.
 * Logs verification links/codes for development. Replace with a real
 * provider (e.g. Resend, Postmark, SES) when ready for production emails.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.logger.log(
      '📧 Email service running in stub mode (no emails sent). Add a provider later for production.',
    );
  }

  async sendEmailVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    this.logger.log(`[STUB] Verification email would go to: ${email}`);
    this.logger.log(`[STUB] Verification URL: ${verificationUrl}`);
    // No-op: auth flow continues; user can use link from logs in dev
  }

  async sendVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    this.logger.log(`[STUB] Verification code email would go to: ${email}`);
    this.logger.log(`[STUB] Code: ${verificationCode}`);
    // No-op
  }
}
