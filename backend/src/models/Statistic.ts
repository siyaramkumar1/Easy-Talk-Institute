import mongoose from 'mongoose';

const statisticSchema = new mongoose.Schema({
  section: { type: String, required: true }, // 'testimonials' or 'gallery'
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String }, // optional, for gallery
  status: { type: String, enum: ['Active', 'Hidden'], default: 'Active' },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const Statistic = mongoose.model('Statistic', statisticSchema);
