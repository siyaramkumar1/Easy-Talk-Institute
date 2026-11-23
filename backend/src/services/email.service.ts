
import { google } from 'googleapis';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  async sendOtpEmail(
    to: string,
    otp: string,
    name: string = 'Student'
  ): Promise<SendEmailResult> {
    try {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Gmail API environment variables are missing.');
      }

      const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;

      if (!sender) {
        throw new Error('EMAIL_FROM or EMAIL_USER is not configured.');
      }

      const recipient = to.trim().toLowerCase();
      const safeName = (name || 'Student')
        .replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] || char);

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client,
      });

      const subject = 'Verify Your Email Address - Easy Talk Institute';

      const text = `Hello ${name || 'Student'},

Your Easy Talk Institute verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Easy Talk Institute
Learn English from Basic to Advanced`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#1e293b">
  <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="background:#1e3a8a;color:#fff;padding:28px;text-align:center">
      <h1 style="margin:0">Easy Talk Institute</h1>
      <p>Learn English from Basic to Advanced</p>
    </div>
    <div style="padding:32px 24px">
      <h3>Hello ${safeName},</h3>
      <p>Your verification code is:</p>
      <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px;text-align:center">
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#15803d">${otp}</div>
        <p style="color:#166534">This code will expire in 10 minutes.</p>
      </div>
      <p style="color:#64748b;font-size:13px">If you did not request this code, please ignore this email.</p>
    </div>
    <div style="background:#f8fafc;padding:18px;text-align:center;color:#64748b;font-size:12px">
      <strong>Easy Talk Institute</strong><br>
      Learn English from Basic to Advanced
    </div>
  </div>
</body>
</html>`;

      const boundary = `easy-talk-${Date.now()}`;

      const rawEmail = [
        `From: ${sender}`,
        `To: ${recipient}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        text,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 8bit',
        '',
        html,
        '',
        `--${boundary}--`,
      ].join('\r\n');

      const encodedEmail = Buffer.from(rawEmail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      console.log(
        `[GMAIL API SUCCESS] OTP email sent to ${recipient}. Message ID: ${response.data.id}`
      );

      return {
        success: true,
        messageId: response.data.id || undefined,
      };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to send email using Gmail API';

      console.error('[GMAIL API ERROR]', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
