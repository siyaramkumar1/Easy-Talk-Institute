import nodemailer, { Transporter } from 'nodemailer';
import { User } from '../models/User';
import { Notification, IEmailLog, IEmailStats } from '../models/Notification';
import { getIo } from '../sockets/notificationSocket';

export interface RecipientInfo {
  email: string;
  userId?: any;
  name: string;
}

export interface DispatchNotificationResult {
  emailStats: IEmailStats;
  emailLogs: IEmailLog[];
  deliveryStatus: 'sent' | 'partially_sent' | 'failed';
  smtpConfigured: boolean;
}

class EmailNotificationService {
  private transporter: Transporter | null = null;

  /**
   * Initialize or retrieve the Nodemailer Transporter
   */
  private getTransporter(): Transporter | null {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'siyaramkumar103@gmail.com';
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;

    if (!pass) {
      console.warn('[EMAIL NOTIFICATION] EMAIL_PASS / SMTP_PASS is not defined in environment.');
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.EMAIL_SECURE === 'true',
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }

    return this.transporter;
  }

  /**
   * Escape HTML special characters for safe email rendering
   */
  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generates the branded HTML notification email
   */
  private buildNotificationHtml(options: {
    title: string;
    message: string;
    priority: string;
    recipientName: string;
  }): string {
    const safeTitle = this.escapeHtml(options.title);
    const safeName = this.escapeHtml(options.recipientName || 'Student');
    const safePriority = (options.priority || 'normal').toUpperCase();
    
    // Convert newlines to paragraphs/breaks
    const safeMessageHtml = this.escapeHtml(options.message)
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const priorityBadgeColor = 
      options.priority === 'urgent' ? 'background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;' :
      options.priority === 'high' ? 'background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5;' :
      options.priority === 'low' ? 'background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;' :
      'background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;';

    const portalUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '') + '/student/notifications';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - Easy Talk Institute</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 28px 12px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
      <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff;">Easy Talk Institute</h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 500;">
        अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक
      </p>
    </div>

    <!-- Notification Header Card -->
    <div style="padding: 28px 24px 16px 24px; border-bottom: 1px solid #f1f5f9;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${priorityBadgeColor}">
          ${safePriority} NOTICE
        </span>
        <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">
          ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.35;">
        ${safeTitle}
      </h2>
    </div>

    <!-- Message Body -->
    <div style="padding: 24px; line-height: 1.6;">
      <p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 16px 0;">
        Dear ${safeName},
      </p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 18px 20px; border-radius: 8px; margin: 0 0 24px 0;">
        ${safeMessageHtml}
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          View in Notification Center &rarr;
        </a>
      </div>
    </div>

    <!-- Contact & Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; font-size: 12px; color: #64748b; line-height: 1.6;">
      <div style="margin-bottom: 12px; color: #334155; font-weight: 600;">
        Easy Talk Institute &bull; Official Institute Notice
      </div>
      <div>
        <strong>Instructor / Representative:</strong> Siyaram Kumar<br/>
        <strong>Phone / WhatsApp:</strong> <a href="tel:+919431885389" style="color: #2563eb; text-decoration: none;">+91 9431885389</a><br/>
        <strong>Email:</strong> <a href="mailto:siyaramkumar103@gmail.com" style="color: #2563eb; text-decoration: none;">siyaramkumar103@gmail.com</a>
      </div>
      <div style="margin-top: 14px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
        You are receiving this official announcement because you are an enrolled student or registered user at Easy Talk Institute.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Fetch eligible registered users matching target audience
   */
  async getAudienceRecipients(targetAudience: string, recipientId?: string): Promise<RecipientInfo[]> {
    const audience = (targetAudience || 'all').toLowerCase().trim();

    if (audience === 'individual' && recipientId) {
      const user = await User.findById(recipientId).select('name fullName email role status').lean();
      if (user && user.email) {
        return [{
          email: user.email.toLowerCase().trim(),
          userId: user._id,
          name: user.name || user.fullName || 'Student'
        }];
      }
      return [];
    }

    const query: any = {
      status: { $ne: 'Inactive' },
      email: { $exists: true, $ne: '' }
    };

    if (audience === 'students') {
      query.role = 'student';
    } else if (audience === 'admins') {
      query.role = { $in: ['admin', 'superadmin'] };
    } else if (audience === 'trainers') {
      query.role = 'trainer';
    } else {
      // 'all' includes all valid roles
      query.role = { $in: ['student', 'user', 'admin', 'superadmin', 'trainer'] };
    }

    const users = await User.find(query).select('name fullName email role status').lean();

    // Deduplicate by clean lowercase email address
    const recipientMap = new Map<string, RecipientInfo>();
    for (const u of users) {
      if (!u.email) continue;
      const cleanEmail = u.email.toLowerCase().trim();
      // Basic email regex test
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        if (!recipientMap.has(cleanEmail)) {
          recipientMap.set(cleanEmail, {
            email: cleanEmail,
            userId: u._id,
            name: u.name || u.fullName || 'Student'
          });
        }
      }
    }

    return Array.from(recipientMap.values());
  }

  /**
   * Send notification emails in batches with concurrency throttling
   */
  async dispatchBulkEmails(options: {
    title: string;
    message: string;
    priority: string;
    recipients: RecipientInfo[];
  }): Promise<DispatchNotificationResult> {
    const { title, message, priority, recipients } = options;
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || '"Easy Talk Institute" <siyaramkumar103@gmail.com>';
    const transporter = this.getTransporter();

    // If SMTP is not configured, record as Failed with clear explanation
    if (!transporter) {
      console.warn('[EMAIL NOTIFICATION] SMTP credentials missing in environment.');
      const failedLogs: IEmailLog[] = recipients.map(r => ({
        recipientEmail: r.email,
        userId: r.userId,
        status: 'Failed' as const,
        error: 'SMTP password not configured in environment (EMAIL_PASS). Please configure Gmail App Password in .env.',
        sentAt: new Date()
      }));

      return {
        emailStats: {
          totalRecipients: recipients.length,
          attempted: recipients.length,
          sent: 0,
          failed: recipients.length
        },
        emailLogs: failedLogs,
        deliveryStatus: 'failed',
        smtpConfigured: false
      };
    }

    const logs: IEmailLog[] = [];
    const concurrency = 5;

    for (let i = 0; i < recipients.length; i += concurrency) {
      const batch = recipients.slice(i, i + concurrency);
      const promises = batch.map(async (r) => {
        try {
          const html = this.buildNotificationHtml({
            title,
            message,
            priority,
            recipientName: r.name
          });

          await transporter.sendMail({
            from: fromAddress,
            to: r.email,
            subject: `[Easy Talk Institute] ${title}`,
            text: `${title}\n\nPriority: ${priority.toUpperCase()}\n\n${message}\n\nEasy Talk Institute - Contact: +91 9431885389 | siyaramkumar103@gmail.com`,
            html
          });

          return {
            recipientEmail: r.email,
            userId: r.userId,
            status: 'Sent' as const,
            sentAt: new Date(),
            error: ''
          };
        } catch (err: any) {
          const errorMessage = err?.message || 'SMTP delivery rejected by host';
          console.error(`[EMAIL DISPATCH ERROR] Failed to send email to ${r.email}:`, errorMessage);
          return {
            recipientEmail: r.email,
            userId: r.userId,
            status: 'Failed' as const,
            sentAt: new Date(),
            error: errorMessage
          };
        }
      });

      const results = await Promise.all(promises);
      logs.push(...results);
    }

    const sentCount = logs.filter(l => l.status === 'Sent').length;
    const failedCount = logs.filter(l => l.status === 'Failed').length;

    let deliveryStatus: 'sent' | 'partially_sent' | 'failed' = 'sent';
    if (sentCount === 0 && failedCount > 0) {
      deliveryStatus = 'failed';
    } else if (failedCount > 0) {
      deliveryStatus = 'partially_sent';
    }

    return {
      emailStats: {
        totalRecipients: recipients.length,
        attempted: logs.length,
        sent: sentCount,
        failed: failedCount
      },
      emailLogs: logs,
      deliveryStatus,
      smtpConfigured: true
    };
  }

  /**
   * Retry sending only to recipients whose status is 'Failed'
   */
  async retryFailedEmails(notificationId: string): Promise<{
    success: boolean;
    message: string;
    notification?: any;
    retriedCount: number;
    newlySent: number;
    stillFailed: number;
  }> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const failedLogs = notification.emailLogs.filter(l => l.status === 'Failed');
    if (failedLogs.length === 0) {
      return {
        success: true,
        message: 'No failed recipients found for this notification.',
        notification,
        retriedCount: 0,
        newlySent: 0,
        stillFailed: 0
      };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'Cannot retry: SMTP credentials (EMAIL_PASS) are not configured in environment.',
        notification,
        retriedCount: failedLogs.length,
        newlySent: 0,
        stillFailed: failedLogs.length
      };
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || '"Easy Talk Institute" <siyaramkumar103@gmail.com>';
    let newlySent = 0;
    let stillFailed = 0;

    // Retry only the failed recipients
    for (const logItem of failedLogs) {
      try {
        const html = this.buildNotificationHtml({
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          recipientName: 'Student'
        });

        await transporter.sendMail({
          from: fromAddress,
          to: logItem.recipientEmail,
          subject: `[Easy Talk Institute] ${notification.title}`,
          text: `${notification.title}\n\nPriority: ${notification.priority.toUpperCase()}\n\n${notification.message}\n\nEasy Talk Institute - Contact: +91 9431885389 | siyaramkumar103@gmail.com`,
          html
        });

        logItem.status = 'Sent';
        logItem.error = '';
        logItem.sentAt = new Date();
        newlySent++;
      } catch (err: any) {
        logItem.status = 'Failed';
        logItem.error = err?.message || 'SMTP delivery rejected by host on retry';
        logItem.sentAt = new Date();
        stillFailed++;
      }
    }

    // Recompute overall emailStats
    const total = notification.emailLogs.length;
    const sentCount = notification.emailLogs.filter(l => l.status === 'Sent').length;
    const failedCount = notification.emailLogs.filter(l => l.status === 'Failed').length;

    notification.emailStats = {
      totalRecipients: total,
      attempted: total,
      sent: sentCount,
      failed: failedCount
    };

    if (failedCount === 0) {
      notification.deliveryStatus = 'sent';
    } else if (sentCount > 0) {
      notification.deliveryStatus = 'partially_sent';
    } else {
      notification.deliveryStatus = 'failed';
    }

    await notification.save();

    // Broadcast socket update
    const io = getIo();
    if (io) {
      io.emit('notification_updated', notification);
    }

    return {
      success: true,
      message: `Retry completed: ${newlySent} sent, ${stillFailed} still failed.`,
      notification,
      retriedCount: failedLogs.length,
      newlySent,
      stillFailed
    };
  }
}

export const emailNotificationService = new EmailNotificationService();
