import mongoose, { Document, Model } from 'mongoose';

export interface ITestResult extends Document {
  userId?: mongoose.Types.ObjectId;
  userName: string;
  email: string;
  mobile?: string;
  
  testId?: mongoose.Types.ObjectId;
  testName?: string;
  testSlug?: string;

  totalQuestions: number;
  attemptedQuestions: number;
  
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  
  score: number;
  percentage: number;
  level: string;
  
  passed: boolean;
  
  startedAt?: Date;
  completedAt: Date;
  durationTaken?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String },
  
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: { type: String },
  testSlug: { type: String },

  totalQuestions: { type: Number, default: 0 },
  attemptedQuestions: { type: Number, default: 0 },
  
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  skippedAnswers: { type: Number, default: 0 },
  
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  level: { type: String },
  
  passed: { type: Boolean, default: false },
  
  startedAt: { type: Date },
  completedAt: { type: Date, default: Date.now },
  durationTaken: { type: Number },
}, { timestamps: true });

testResultSchema.index({ userId: 1, createdAt: -1 });
testResultSchema.index({ testSlug: 1, createdAt: -1 });
testResultSchema.index({ email: 1, createdAt: -1 });
testResultSchema.index({ createdAt: -1 });

const TestResult = (mongoose.models.TestResult as Model<ITestResult>) || mongoose.model<ITestResult>('TestResult', testResultSchema);
export default TestResult;
