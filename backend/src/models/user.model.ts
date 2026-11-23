import mongoose, { Document, Model, Schema } from 'mongoose';
import { MOBILE_REGEX } from '../utils/validation';

export interface IUser extends Document {
  fullName: string;
  name: string;
  mobileNumber: string;
  mobile: string;
  whatsapp?: string;
  email: string;
  password: string;
  role: 'student' | 'user' | 'admin' | 'superadmin';
  status: 'Active' | 'Inactive';
  emailVerified: boolean;
  isVerified: boolean;
  avatar?: string;
  attendance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  fullName: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v: string) => MOBILE_REGEX.test(v),
      message: 'Invalid mobile number (must be 10 digits)',
    },
  },
  whatsapp: {
    type: String,
    trim: true,
    validate: {
      validator: (v: string) => !v || MOBILE_REGEX.test(v),
      message: 'Invalid WhatsApp number',
    },
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'user', 'admin', 'superadmin'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  emailVerified: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
  },
  attendance: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Middleware to sync fullName/name and mobileNumber/mobile
userSchema.pre('save', function () {
  if (this.fullName && !this.name) {
    this.name = this.fullName;
  } else if (this.name && !this.fullName) {
    this.fullName = this.name;
  }

  if (this.mobileNumber && !this.mobile) {
    this.mobile = this.mobileNumber;
  } else if (this.mobile && !this.mobileNumber) {
    this.mobileNumber = this.mobile;
  }

  if (this.emailVerified !== undefined && this.isVerified === undefined) {
    this.isVerified = this.emailVerified;
  } else if (this.isVerified !== undefined && this.emailVerified === undefined) {
    this.emailVerified = this.isVerified;
  }
});

// MongoDB Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', userSchema);

export default User;
