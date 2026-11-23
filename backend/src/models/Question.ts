import mongoose from 'mongoose';

export interface IQuestion extends mongoose.Document {
  testId: string; // The slug of the test (e.g. 'spoken-english-test')
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Inactive';
  createdAt: Date;
}

const questionSchema = new mongoose.Schema({
  testId: { type: String, required: true },
  text: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

questionSchema.index({ testId: 1, status: 1 });
questionSchema.index({ testId: 1, difficulty: 1 });
questionSchema.index({ createdAt: -1 });

const Question = (mongoose.models.Question as mongoose.Model<IQuestion>) || mongoose.model<IQuestion>('Question', questionSchema);
export { Question };
export default Question;
