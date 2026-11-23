import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailVerification extends Document {
  email: string;
  otpHash: string;
  hashedOtp?: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationSchema = new Schema<IEmailVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  // Backward compatibility alias for hashedOtp
  hashedOtp: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  resendCount: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Middleware to keep otpHash and hashedOtp in sync
emailVerificationSchema.pre('save', function () {
  if (this.otpHash && !this.hashedOtp) {
    this.hashedOtp = this.otpHash;
  } else if (this.hashedOtp && !this.otpHash) {
    this.otpHash = this.hashedOtp;
  }
});

// MongoDB Indexes
emailVerificationSchema.index({ email: 1 }, { unique: true });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

export const EmailVerification: Model<IEmailVerification> =
  (mongoose.models.EmailVerification as Model<IEmailVerification>) ||
  mongoose.model<IEmailVerification>('EmailVerification', emailVerificationSchema);

export default EmailVerification;
