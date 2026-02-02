import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmailVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM ?? 'The Wealthy Post <noreply@thewealthypost.com>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color:#6e61ff;">Verify your email</h2>
          <p>Thanks for signing up to <b>The Wealthy Post</b>.</p>

          <a href="${verificationUrl}"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 20px;
              background:#6e61ff;
              color:white;
              text-decoration:none;
              border-radius:6px;
              font-weight:600;
            ">
            Verify Email
          </a>

          <p style="margin-top:20px;font-size:14px;color:#555;">
            This link expires in 10 minutes.
          </p>

          <p style="font-size:12px;color:#999;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔗 DEV VERIFY LINK: ${verificationUrl}`);
        return;
      }

      throw new InternalServerErrorException(
        'Unable to send verification email',
      );
    }
  }
}
