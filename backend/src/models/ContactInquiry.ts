import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContactInquiry', default: null },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  senderRole: { type: String, default: 'admin' },
  message: { type: String, trim: true },
  replyMessage: { type: String, required: true, trim: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  repliedByName: { type: String, default: 'Admin' },
  repliedByRole: { type: String, default: 'admin' },
  deliveredToNotification: { type: Boolean, default: false },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
  repliedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const contactInquirySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isAuthenticatedUser: { type: Boolean, default: false },
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Spam'],
    default: 'Pending'
  },
  source: { type: String, default: 'Website' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminReply: { type: String },
  repliedAt: { type: Date },
  replies: { type: [replySchema], default: [] }
}, {
  timestamps: true
});

contactInquirySchema.index({ status: 1, createdAt: -1 });
contactInquirySchema.index({ userId: 1, createdAt: -1 });
contactInquirySchema.index({ createdAt: -1 });

export const ContactInquiry = mongoose.models.ContactInquiry || mongoose.model('ContactInquiry', contactInquirySchema);
