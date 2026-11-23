import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStoryProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId;
  currentPage: 'english' | 'hindi';
  pageCompleted: boolean;
  storyCompleted: boolean;
  lastReadPosition: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const storyProgressSchema = new Schema<IStoryProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
  currentPage: { type: String, enum: ['english', 'hindi'], default: 'english', required: true },
  pageCompleted: { type: Boolean, default: false },
  storyCompleted: { type: Boolean, default: false },
  lastReadPosition: { type: Number, default: 0 },
  completedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Enforce one progress record per studentId + storyId
storyProgressSchema.index({ studentId: 1, storyId: 1 }, { unique: true });
storyProgressSchema.index({ studentId: 1, storyCompleted: 1 });

export const StoryProgress: Model<IStoryProgress> = 
  (mongoose.models.StoryProgress as Model<IStoryProgress>) || 
  mongoose.model<IStoryProgress>('StoryProgress', storyProgressSchema);
