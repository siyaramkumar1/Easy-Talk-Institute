import mongoose, { Document, Model } from 'mongoose';

export interface ITimelineItem {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'rejected' | 'waiting';
  timestamp: Date;
  updatedBy?: string;
}

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  enrollmentId?: string;
  courseId: string;
  courseName: string;
  studentName: string;
  email: string;
  mobile?: string;
  batchPreference?: string;
  notes?: string;
  confirmationMethods?: string[];
  courseFee?: number;
  courseDuration?: string;
  trainerName?: string;
  location?: string;
  admissionStep: number;
  status: string;
  
  // Verification details
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;

  // Approval details
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'waiting';
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;

  // Batch details
  batchAssigned?: string;
  batchId?: mongoose.Types.ObjectId;
  batchStartDate?: string;
  batchTiming?: string;
  assignedTrainer?: string;
  batchAssignedAt?: Date;

  // Payment status
  paymentStatus: 'pending' | 'verified';
  paymentVerifiedAt?: Date;

  // Welcome notice
  welcomeNoticeSent: boolean;
  welcomeNoticeSentAt?: Date;
  welcomeMessage?: string;

  // Timeline events
  timeline: ITimelineItem[];

  createdAt: Date;
  updatedAt: Date;
}

const timelineItemSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['completed', 'in_progress', 'pending', 'rejected', 'waiting'],
    default: 'pending' 
  },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'System' }
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: String },
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String },
  batchPreference: { type: String, default: 'Morning Batch' },
  notes: { type: String, maxlength: 500, default: '' },
  confirmationMethods: [{ type: String }],
  courseFee: { type: Number, default: 0 },
  courseDuration: { type: String, default: '3 Months' },
  trainerName: { type: String, default: 'Senior Faculty' },
  location: { type: String, default: 'Easy Talk Institute, Main Campus' },
  admissionStep: { type: Number, default: 1 },
  status: { type: String, enum: ['Enrolled', 'Pending', 'Approved', 'Completed', 'Cancelled', 'Rejected'], default: 'Pending' },

  // Tracking fields
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
  verificationNotes: { type: String },

  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'waiting'], default: 'pending' },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  rejectionReason: { type: String },

  batchAssigned: { type: String },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  batchStartDate: { type: String },
  batchTiming: { type: String },
  assignedTrainer: { type: String },
  batchAssignedAt: { type: Date },

  paymentStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
  paymentVerifiedAt: { type: Date },

  welcomeNoticeSent: { type: Boolean, default: false },
  welcomeNoticeSentAt: { type: Date },
  welcomeMessage: { type: String },

  timeline: [timelineItemSchema]
}, { timestamps: true });

enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ courseName: 1 });
enrollmentSchema.index({ enrollmentId: 1 });
enrollmentSchema.index({ createdAt: -1 });

const Enrollment = (mongoose.models.Enrollment as Model<IEnrollment>) || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export default Enrollment;
