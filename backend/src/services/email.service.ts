import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const user = process.env.EMAIL_USER || 'yadavsiyaramsingh114@gmail.com';
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;

    if (!pass) {
      console.warn('[EMAIL SERVICE NOTICE] EMAIL_PASS environment variable is not defined. Real SMTP delivery requires Gmail App Password in .env.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: pass || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Sends 6-digit OTP verification email via Gmail SMTP
   */
  async sendOtpEmail(to: string, otp: string, name: string = 'Student'): Promise<SendEmailResult> {
    const fromAddress = process.env.EMAIL_FROM || '"Easy Talk Institute" <yadavsiyaramsingh114@gmail.com>';
    const subject = 'Verify Your Email Address - Easy Talk Institute';

    const plainTextContent = `Hello,

Your Easy Talk Institute verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Easy Talk Institute
Learn English from Basic to Advanced`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address - Easy Talk Institute</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; }
    .wrapper { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
    .tagline { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; font-weight: 500; }
    .body { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .desc { font-size: 14px; color: #334155; margin: 0 0 20px 0; }
    .otp-container { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: inline-block; }
    .expiry { font-size: 13px; font-weight: 600; color: #166534; margin-top: 8px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand">Easy Talk Institute</h1>
      <p class="tagline">Learn English from Basic to Advanced</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${name || 'Student'},</div>
      <p class="desc">Your Easy Talk Institute verification code is:</p>
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
        <div class="expiry">⏱️ This code will expire in 10 minutes.</div>
      </div>
      <p class="desc" style="color: #64748b; font-size: 13px;">If you did not request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <strong>Easy Talk Institute</strong><br>
      Learn English from Basic to Advanced
    </div>
  </div>
</body>
</html>`;

    console.log(`\n======================================================`);
    console.log(`[GMAIL SMTP OTP DISPATCH] Initiating email delivery`);
    console.log(`[GMAIL SMTP OTP DISPATCH] Recipient: ${to}`);
    console.log(`[GMAIL SMTP OTP DISPATCH] Sender: ${fromAddress}`);
    console.log(`[GMAIL SMTP OTP DISPATCH] Subject: ${subject}`);
    console.log(`======================================================\n`);

    if (!process.env.EMAIL_PASS && !process.env.GMAIL_APP_PASSWORD && !process.env.EMAIL_PASSWORD) {
      console.warn(`[GMAIL SMTP NOTICE] EMAIL_PASS is not configured in environment. Simulated local delivery for ${to}.`);
      return {
        success: true,
        messageId: `dev-simulated-${Date.now()}`,
      };
    }

    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      const info = await this.transporter!.sendMail({
        from: fromAddress,
        to: to.trim().toLowerCase(),
        subject,
        text: plainTextContent,
        html: htmlContent,
      });

      console.log(`[GMAIL SMTP SUCCESS] Email dispatched to ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error(`[GMAIL SMTP ERROR] Failed sending to ${to}:`, err?.message || err);
      return {
        success: false,
        error: err?.message || 'Failed to dispatch email via Gmail SMTP',
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
