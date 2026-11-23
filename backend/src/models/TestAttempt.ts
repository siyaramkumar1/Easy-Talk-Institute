import mongoose from 'mongoose';

export interface ITestAttempt extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  testSlug: string;
  attemptNumber: number;
  questions: any[];
  answers: Record<string, string>; // questionId -> selectedOption
  status: 'in_progress' | 'completed';
  score?: number;
  submittedAt?: Date;
  expiresAt: Date;
}

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testSlug: { type: String, required: true },
  attemptNumber: { type: Number, required: true, default: 1 },
  questions: { type: Array, required: true },
  answers: { type: Object, default: {} },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  score: { type: Number },
  submittedAt: { type: Date },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

testAttemptSchema.index({ userId: 1, testSlug: 1, status: 1 });
testAttemptSchema.index({ expiresAt: 1 });
testAttemptSchema.index({ createdAt: -1 });

const TestAttempt = mongoose.models.TestAttempt || mongoose.model<ITestAttempt>('TestAttempt', testAttemptSchema);
export { TestAttempt };
export default TestAttempt;
