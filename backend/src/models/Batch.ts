import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  description: { type: String },
  trainer: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  timing: { type: String }, // e.g. "10:00 AM - 11:30 AM"
  capacity: { type: Number, required: true },
  enrolledStudents: { type: Number, default: 0 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Draft', 'Active', 'Upcoming', 'Completed', 'Inactive'], default: 'Upcoming' },
  thumbnail: {
    url: { type: String },
    imageUrl: { type: String },
    publicId: { type: String }
  },
  imageUrl: { type: String },
  publicId: { type: String },
  days: [{ type: String }],
  location: { type: String },
  meetingLink: { type: String },
  batchCode: { type: String },
  notes: { type: String }
}, { timestamps: true });

BatchSchema.index({ status: 1, startDate: 1 });
BatchSchema.index({ course: 1, status: 1 });
BatchSchema.index({ students: 1 });
BatchSchema.index({ createdAt: -1 });

export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
