import mongoose, { Document, Model } from 'mongoose';

export interface ITest extends Document {
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingMarks: number;
  description: string;
  instructions: string;
  isFeatured: boolean;
  status: 'Published' | 'Draft' | 'Archived';
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: 'General' },
  difficulty: { type: String, default: 'Medium' },
  duration: { type: Number, default: 30 },
  totalQuestions: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  description: { type: String },
  instructions: { type: String },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, enum: ['Published', 'Draft', 'Archived'], default: 'Draft' },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

testSchema.index({ status: 1, displayOrder: 1 });
testSchema.index({ category: 1, status: 1 });
testSchema.index({ isFeatured: 1, status: 1 });
testSchema.index({ createdAt: -1 });

export const Test = (mongoose.models.Test as Model<ITest>) || mongoose.model<ITest>('Test', testSchema);
