import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  publicId: { type: String }, // For cloudinary or file references
  category: { type: String, required: true },
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['Published', 'Draft'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

gallerySchema.index({ status: 1, category: 1, displayOrder: 1 });
gallerySchema.index({ featured: 1, status: 1 });
gallerySchema.index({ createdAt: -1 });

export const Gallery = mongoose.model('Gallery', gallerySchema);
