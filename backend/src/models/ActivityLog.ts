import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: { type: String, default: '' },
  module: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String, required: true },
  ip: { type: String },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
