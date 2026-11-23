import mongoose, { Document, Model, Schema } from 'mongoose';

export type DifficultyLevel = 'Beginner' | 'Elementary' | 'Easy' | 'Intermediate' | 'Advanced' | 'Hard';
export type StoryStatus = 'Draft' | 'Published' | 'Inactive';

export interface IStory extends Document {
  titleEnglish: string;
  titleHindi: string;
  englishContent: string;
  hindiContent: string;
  shortDescription?: string;
  difficultyLevel: DifficultyLevel;
  displayOrder: number;
  status: StoryStatus;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>({
  titleEnglish: { type: String, required: true, trim: true },
  titleHindi: { type: String, required: true, trim: true },
  englishContent: { type: String, required: true },
  hindiContent: { type: String, required: true },
  shortDescription: { type: String, default: '', trim: true },
  difficultyLevel: {
    type: String,
    enum: ['Beginner', 'Elementary', 'Easy', 'Intermediate', 'Advanced', 'Hard'],
    default: 'Beginner',
    required: true
  },
  displayOrder: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Inactive'],
    default: 'Draft',
    required: true
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

storySchema.index({ status: 1, difficultyLevel: 1, displayOrder: 1 });

export const Story: Model<IStory> = (mongoose.models.Story as Model<IStory>) || mongoose.model<IStory>('Story', storySchema);
