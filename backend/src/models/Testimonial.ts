import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentPhoto: { 
    url: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  imageUrl: { type: String, default: '' },
  publicId: { type: String, default: '' },
  studentEmail: { type: String },
  studentMobile: { type: String },
  courseName: { type: String, required: true },
  batchName: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewTitle: { type: String, required: true },
  reviewMessage: { type: String, required: true },
  achievement: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'],
    default: 'Active' 
  },
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

testimonialSchema.index({ status: 1, displayOrder: 1, createdAt: -1 });
testimonialSchema.index({ featured: 1, status: 1 });
testimonialSchema.index({ rating: -1 });

export const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
