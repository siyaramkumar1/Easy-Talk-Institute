import mongoose from 'mongoose';

const galleryCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

export const GalleryCategory = mongoose.model('GalleryCategory', galleryCategorySchema);
