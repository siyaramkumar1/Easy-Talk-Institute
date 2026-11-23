import mongoose, { Document, Model } from 'mongoose';

export interface IReservation extends Document {
  userId?: mongoose.Types.ObjectId;
  referenceId?: string;
  fullName: string;
  email?: string;
  mobile: string;
  mobileNumber?: string;
  courseInterested: string;
  batchPreference: string;
  highestQualification: string;
  purposeOfJoining: string;
  message?: string;
  status: 'Pending' | 'Contacted' | 'Confirmed' | 'Cancelled' | 'Reserved' | 'Approved' | 'Rejected' | 'Converted';
  courseId?: string;
  courseName?: string;
  city?: string;
  state?: string;
  remarks?: string;
  smsNotificationSent?: boolean;
  smsDeliveredAt?: Date;
  smsDeliveryStatus?: 'Pending' | 'Sent' | 'Failed' | 'Simulated';
  smsRecipient?: string;
  smsMessageId?: string;
  smsLastError?: string;
  smsDeliveryLog?: Array<{
    recipient?: string;
    status?: string;
    messageId?: string;
    error?: string;
    sentAt?: Date;
  }>;
  whatsappNotificationSent?: boolean;
  whatsappDeliveredAt?: Date;
  whatsappDeliveryStatus?: 'Pending' | 'Sent' | 'Failed' | 'Simulated';
  whatsappRecipientsCount?: number;
  whatsappDeliveryLog?: Array<{
    adminId?: string;
    adminName?: string;
    mobile?: string;
    status?: string;
    messageId?: string;
    error?: string;
    sentAt?: Date;
  }>;
  whatsappLastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  referenceId: { type: String, trim: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  mobile: { type: String, required: true, trim: true },
  mobileNumber: { type: String, trim: true },
  courseInterested: { type: String, required: true, trim: true },
  batchPreference: { 
    type: String, 
    required: true,
    trim: true
  },
  highestQualification: { 
    type: String, 
    required: true,
    trim: true
  },
  purposeOfJoining: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { type: String, maxlength: 500, trim: true, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Contacted', 'Confirmed', 'Cancelled', 'Reserved', 'Approved', 'Rejected', 'Converted'], 
    default: 'Pending' 
  },
  courseId: { type: String },
  courseName: { type: String },
  city: { type: String },
  state: { type: String },
  remarks: { type: String, default: '' },
  smsNotificationSent: { type: Boolean, default: false, index: true },
  smsDeliveredAt: { type: Date },
  smsDeliveryStatus: { 
    type: String, 
    enum: ['Pending', 'Sent', 'Failed', 'Simulated'], 
    default: 'Pending' 
  },
  smsRecipient: { type: String, default: '' },
  smsMessageId: { type: String, default: '' },
  smsLastError: { type: String, default: '' },
  smsDeliveryLog: [{
    recipient: { type: String },
    status: { type: String },
    messageId: { type: String },
    error: { type: String },
    sentAt: { type: Date, default: Date.now }
  }],
  whatsappNotificationSent: { type: Boolean, default: false, index: true },
  whatsappDeliveredAt: { type: Date },
  whatsappDeliveryStatus: { 
    type: String, 
    enum: ['Pending', 'Sent', 'Failed', 'Simulated'], 
    default: 'Pending' 
  },
  whatsappRecipientsCount: { type: Number, default: 0 },
  whatsappDeliveryLog: [{
    adminId: { type: String },
    adminName: { type: String },
    mobile: { type: String },
    status: { type: String },
    messageId: { type: String },
    error: { type: String },
    sentAt: { type: Date, default: Date.now }
  }],
  whatsappLastError: { type: String, default: '' }
}, { timestamps: true });

reservationSchema.index({ status: 1, createdAt: -1 });
reservationSchema.index({ mobile: 1 });
reservationSchema.index({ email: 1 });
reservationSchema.index({ userId: 1 });
reservationSchema.index({ createdAt: -1 });

const Reservation = (mongoose.models.Reservation as Model<IReservation>) || mongoose.model<IReservation>('Reservation', reservationSchema);
export default Reservation;

