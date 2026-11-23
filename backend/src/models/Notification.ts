import mongoose, { Document, Model } from 'mongoose';

export interface IEmailLog {
  recipientEmail: string;
  userId?: mongoose.Types.ObjectId;
  status: 'Sent' | 'Failed' | 'Pending';
  error?: string;
  sentAt?: Date;
}

export interface IEmailStats {
  totalRecipients: number;
  attempted: number;
  sent: number;
  failed: number;
}

export interface INotification extends Document {
  title: string;
  message: string;
  targetAudience: 'all' | 'students' | 'trainers' | 'admins' | 'individual';
  recipientId?: mongoose.Types.ObjectId;
  recipientUserId?: mongoose.Types.ObjectId;
  inquiryId?: mongoose.Types.ObjectId;
  replyId?: mongoose.Types.ObjectId;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: string;
  notificationType?: string;
  senderRole?: string;
  createdBy?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  isRead: boolean;
  readAt?: Date | null;
  isDeleted: boolean;
  metadata?: Record<string, any> | null;
  emailStats: IEmailStats;
  emailLogs: IEmailLog[];
  deliveryStatus: 'draft' | 'sending' | 'sent' | 'partially_sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Sent', 'Failed', 'Pending'], default: 'Pending' },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now }
}, { _id: false });

const emailStatsSchema = new mongoose.Schema({
  totalRecipients: { type: Number, default: 0 },
  attempted: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  failed: { type: Number, default: 0 }
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetAudience: {
    type: String,
    enum: ["all", "students", "trainers", "admins", "individual"],
    default: 'all',
    required: true,
    set: (val: any) => {
      if (!val) return 'all';
      const s = String(val).toLowerCase().trim();
      if (s === 'admin') return 'admins';
      if (s === 'student') return 'students';
      if (s === 'trainer') return 'trainers';
      return s;
    }
  },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContactInquiry' },
  replyId: { type: mongoose.Schema.Types.ObjectId, default: null },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: 'normal',
    required: true,
    set: (val: any) => {
      if (!val) return 'normal';
      const s = String(val).toLowerCase().trim();
      if (s === 'medium') return 'normal';
      return s;
    }
  },
  type: {
    type: String,
    default: 'general'
  },
  notificationType: {
    type: String,
    default: 'general'
  },
  senderRole: {
    type: String,
    default: ''
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  emailStats: {
    type: emailStatsSchema,
    default: () => ({ totalRecipients: 0, attempted: 0, sent: 0, failed: 0 })
  },
  emailLogs: {
    type: [emailLogSchema],
    default: []
  },
  deliveryStatus: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'partially_sent', 'failed'],
    default: 'sent'
  }
}, {
  timestamps: true
});

notificationSchema.index({ targetAudience: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isDeleted: 1 });
notificationSchema.index({ recipientUserId: 1, isDeleted: 1 });
notificationSchema.index({ inquiryId: 1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', notificationSchema);
