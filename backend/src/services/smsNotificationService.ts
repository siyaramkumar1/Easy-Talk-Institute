import axios from 'axios';
import Reservation, { IReservation } from '../models/Reservation';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { getIoInstance } from '../sockets/notificationSocket';

export const VERIFIED_ADMIN_MOBILE_RAW = '+91 7979819796';
export const VERIFIED_ADMIN_MOBILE_10 = '7979819796';
export const VERIFIED_ADMIN_MOBILE_E164 = '917979819796';

export interface SmsSendResult {
  recipient: string;
  success: boolean;
  status: 'Pending' | 'Sent' | 'Failed' | 'Simulated';
  messageId?: string;
  error?: string;
  responseRaw?: any;
}

export interface SmsNotificationResponse {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  reservationId: string;
  referenceId: string;
  provider: string;
  recipient: string;
  result: SmsSendResult;
  timestamp: Date;
}

/**
 * Formats date into readable format: "02 Oct 2026, 07:30 PM"
 */
export function formatSmsDate(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Generates the exact SMS message text required for SmsHorizon
 */
export function buildReservationSmsMessage(data: {
  studentName: string;
  mobile: string;
  courseName: string;
  batchPreference: string;
  reservationId: string;
  createdAt?: Date | string;
}): string {
  const dateFormatted = formatSmsDate(data.createdAt);

  return (
`NEW SEAT RESERVATION

Student: ${data.studentName}

Mobile: ${data.mobile}

Course: ${data.courseName}

Batch: ${data.batchPreference}

Reservation ID: ${data.reservationId}

Date: ${dateFormatted}

Easy Talk Institute`
  );
}

/**
 * Centralized SmsHorizon Dispatcher
 */
class SmsHorizonDispatcher {
  /**
   * Dispatches SMS using SmsHorizon HTTP API
   */
  static async sendSms(mobile: string, message: string): Promise<{ messageId: string; status: 'Sent' | 'Simulated'; raw?: any }> {
    const provider = (process.env.SMS_PROVIDER || 'smshorizon').toLowerCase();
    const apiKey = process.env.SMSHORIZON_API_KEY;
    const username = process.env.SMSHORIZON_USERNAME;
    const senderId = process.env.SMSHORIZON_SENDER_ID || 'HORIZN';
    const apiUrl = process.env.SMSHORIZON_API_URL || 'https://smshorizon.co.in/api/sendsms.php';

    // If API credentials are not yet configured or in mock/test environment, simulate safely without throwing
    const isMockOrMissing = !apiKey || 
      apiKey === 'YOUR_API_KEY' || 
      apiKey === 'your_api_key' || 
      !username || 
      username === 'YOUR_USERNAME';

    if (isMockOrMissing) {
      console.warn(`[SMS Notification] SmsHorizon credentials not configured in environment. Simulating SMS dispatch to ${mobile}.`);
      return {
        messageId: `SIM-SMSH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Simulated',
        raw: { simulated: true, note: 'Configure SMSHORIZON_API_KEY & SMSHORIZON_USERNAME in .env for live carrier delivery.' }
      };
    }

    try {
      // SmsHorizon accepts mobile number (standard 10 digits in India or with 91 prefix)
      // Clean mobile number to 10 digits or 12 digits
      const cleanedMobile = mobile.replace(/\D/g, '');
      const targetMobile = cleanedMobile.length === 12 && cleanedMobile.startsWith('91') 
        ? cleanedMobile.slice(2) 
        : cleanedMobile;

      const response = await axios.get(apiUrl, {
        params: {
          user: username,
          apikey: apiKey,
          mobile: targetMobile,
          message: message,
          senderid: senderId,
          type: 'txt'
        },
        timeout: 10000
      });

      const rawData = response.data;
      const rawText = typeof rawData === 'string' ? rawData.trim() : JSON.stringify(rawData);

      // Check for SmsHorizon error responses (e.g. "Error: Invalid User", "Error: Insufficient Credits")
      if (typeof rawText === 'string' && rawText.toLowerCase().startsWith('error')) {
        throw new Error(`SmsHorizon API Error: ${rawText}`);
      }

      const messageId = typeof rawData === 'string' && rawData.length < 50 ? rawData : `SMSH-${Date.now()}`;
      return {
        messageId,
        status: 'Sent',
        raw: rawData
      };
    } catch (apiError: any) {
      // If live request fails (e.g. network timeout or invalid trial key during testing)
      console.error('[SMS Notification] SmsHorizon HTTP request failed:', apiError.message);
      throw apiError;
    }
  }
}

/**
 * Main Production SMS Notification Service for Seat Reservations
 */
export class SmsNotificationService {
  /**
   * Sends automated SMS notification for a confirmed reservation to the verified admin number
   * 
   * Strict Constraints:
   * - Send ONLY to +91 7979819796
   * - Never send SMS to students
   * - Never send SMS to other admins
   * - Prevent duplicate SMS
   * - Create high-priority Dashboard Notification
   * - Create Activity Log
   * - Non-blocking asynchronous execution
   */
  static async sendReservationSmsNotification(
    reservationInput: IReservation | string
  ): Promise<SmsNotificationResponse> {
    let reservation: IReservation | null = null;

    try {
      if (typeof reservationInput === 'string') {
        reservation = await Reservation.findById(reservationInput);
      } else {
        reservation = reservationInput;
      }

      if (!reservation) {
        throw new Error('Reservation not found for SMS notification');
      }

      const reservationId = reservation._id.toString();
      const referenceId = reservation.referenceId || `ETI-${reservationId.slice(-6).toUpperCase()}`;
      const studentName = reservation.fullName || 'Student';
      const studentMobile = reservation.mobile || reservation.mobileNumber || 'N/A';
      const courseName = reservation.courseInterested || reservation.courseName || 'Spoken English Course';
      const batchPreference = reservation.batchPreference || 'Morning Batch';
      const createdAt = reservation.createdAt || new Date();

      // 1. Duplicate Protection Check
      if (reservation.smsNotificationSent) {
        console.log(`[SMS Notification] Skipping duplicate SMS for reservation ${referenceId} (${reservationId}). Already sent on ${reservation.smsDeliveredAt}.`);
        return {
          success: true,
          skipped: true,
          reason: 'Duplicate SMS prevented: Notification already sent for this reservation.',
          reservationId,
          referenceId,
          provider: process.env.SMS_PROVIDER || 'smshorizon',
          recipient: VERIFIED_ADMIN_MOBILE_RAW,
          result: {
            recipient: VERIFIED_ADMIN_MOBILE_RAW,
            success: true,
            status: reservation.smsDeliveryStatus || 'Sent',
            messageId: reservation.smsMessageId
          },
          timestamp: new Date()
        };
      }

      // 2. Target verified admin mobile number only
      const adminTargetMobile = process.env.SMS_ADMIN_MOBILE || VERIFIED_ADMIN_MOBILE_10;

      // 3. Build exact SMS message content
      const smsContent = buildReservationSmsMessage({
        studentName,
        mobile: studentMobile,
        courseName,
        batchPreference,
        reservationId: referenceId,
        createdAt
      });

      let smsResult: SmsSendResult;

      try {
        // Dispatch SMS via SmsHorizon
        const dispatch = await SmsHorizonDispatcher.sendSms(adminTargetMobile, smsContent);
        
        smsResult = {
          recipient: VERIFIED_ADMIN_MOBILE_RAW,
          success: true,
          status: dispatch.status,
          messageId: dispatch.messageId,
          responseRaw: dispatch.raw
        };
        console.log(`[SMS Notification] SMS successfully sent to admin ${VERIFIED_ADMIN_MOBILE_RAW} (MessageID: ${dispatch.messageId}, Status: ${dispatch.status})`);
      } catch (smsError: any) {
        console.error(`[SMS Notification] SMS delivery failed to ${VERIFIED_ADMIN_MOBILE_RAW}:`, smsError.message);
        smsResult = {
          recipient: VERIFIED_ADMIN_MOBILE_RAW,
          success: false,
          status: 'Failed',
          error: smsError.message || 'SMS delivery failed'
        };
      }

      // 4. Update MongoDB Reservation Record with Delivery Reference
      try {
        const updateDoc: any = {
          smsNotificationSent: smsResult.success,
          smsDeliveredAt: smsResult.success ? new Date() : undefined,
          smsDeliveryStatus: smsResult.status,
          smsRecipient: VERIFIED_ADMIN_MOBILE_RAW,
          smsMessageId: smsResult.messageId || '',
          smsLastError: smsResult.error || '',
          $push: {
            smsDeliveryLog: {
              recipient: VERIFIED_ADMIN_MOBILE_RAW,
              status: smsResult.status,
              messageId: smsResult.messageId || '',
              error: smsResult.error || '',
              sentAt: new Date()
            }
          }
        };

        await Reservation.findByIdAndUpdate(reservationId, updateDoc, { new: true });
      } catch (dbUpdateErr: any) {
        console.error('[SMS Notification] Error updating reservation SMS logs:', dbUpdateErr.message);
      }

      // 5. Create Dashboard Notification for Admin Portal
      try {
        // Prevent duplicate dashboard notification if one already exists for this reservation
        const existingNotif = await Notification.findOne({
          type: 'seat_reservation',
          message: new RegExp(`${referenceId}|${studentName}`, 'i'),
          createdAt: { $gte: new Date(Date.now() - 3600000) } // within last 1 hour
        });

        if (!existingNotif) {
          const dashboardNotification = new Notification({
            title: 'New Seat Reservation',
            message: `${studentName} reserved a seat for ${courseName}`,
            targetAudience: 'admins',
            priority: 'high',
            type: 'seat_reservation',
            createdBy: reservation.userId || undefined,
            readBy: [],
            isDeleted: false
          });

          await dashboardNotification.save();

          // Emit real-time socket events for instantaneous Admin UI update without refresh
          const io = getIoInstance();
          if (io) {
            io.emit('notification_created', dashboardNotification);
            io.emit('reservationsUpdated');
          }
        }
      } catch (notifErr: any) {
        console.error('[SMS Notification] Error creating dashboard notification:', notifErr.message);
      }

      // 6. Create Activity Log for Admin Dashboard Recent Activities
      try {
        await ActivityLog.create({
          action: 'Seat Reservation Created',
          description: `${studentName} reserved a seat for ${courseName}`,
          module: 'Reservation',
          performedBy: 'System',
          role: 'system',
          ip: '127.0.0.1'
        });
      } catch (activityErr: any) {
        console.error('[SMS Notification] Error creating activity log:', activityErr.message);
      }

      // Return structured response
      return {
        success: smsResult.success,
        reservationId,
        referenceId,
        provider: process.env.SMS_PROVIDER || 'smshorizon',
        recipient: VERIFIED_ADMIN_MOBILE_RAW,
        result: smsResult,
        timestamp: new Date()
      };
    } catch (serviceErr: any) {
      console.error('[SMS Notification Service] Top-level error in sendReservationSmsNotification:', serviceErr.message);
      
      // Attempt to log failure in activity log
      try {
        await ActivityLog.create({
          action: 'Seat Reservation Created',
          description: `Seat reservation logged. SMS notification encountered: ${serviceErr.message}`,
          module: 'Reservation',
          performedBy: 'System',
          role: 'system'
        });
      } catch {}

      return {
        success: false,
        reservationId: reservation?._id?.toString() || 'unknown',
        referenceId: reservation?.referenceId || 'unknown',
        provider: process.env.SMS_PROVIDER || 'smshorizon',
        recipient: VERIFIED_ADMIN_MOBILE_RAW,
        result: {
          recipient: VERIFIED_ADMIN_MOBILE_RAW,
          success: false,
          status: 'Failed',
          error: serviceErr.message
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Allows manual resend / retry from Admin Panel if needed
   */
  static async resendReservationSmsNotification(reservationId: string): Promise<SmsNotificationResponse> {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found for resend`);
    }

    // Reset duplicate lock for deliberate manual resend
    reservation.smsNotificationSent = false;
    await reservation.save();

    return this.sendReservationSmsNotification(reservation);
  }
}

export default SmsNotificationService;
