import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  fullDescription: { type: String },
  instructor: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  duration: { type: String, required: true },
  level: { type: String, required: true },
  language: { type: String, required: true },
  thumbnailUrl: { type: String },
  thumbnailPublicId: { type: String },
  thumbnail: {
    url: { type: String, required: false },
    imageUrl: { type: String },
    publicId: { type: String, default: '' }
  },
  imageUrl: { type: String },
  publicId: { type: String },
  status: { type: String, enum: ['Draft', 'Active', 'Inactive', 'Upcoming', 'Completed'], default: 'Draft' },
  features: [{ type: String }],
  featured: { type: Boolean, default: false },
  enrolledStudents: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ featured: 1, status: 1 });
courseSchema.index({ level: 1 });

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
