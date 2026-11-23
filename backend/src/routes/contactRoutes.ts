// @ts-nocheck
import express from 'express';
import {
  submitContactInquiry,
  getContactInquiries,
  getContactInquiry,
  getMyContactInquiryById,
  associateInquiryUser,
  updateContactInquiryStatus,
  replyContactInquiry,
  deleteContactInquiry
} from '../controllers/contactController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public route (supports both guest & authenticated submissions)
router.post('/', submitContactInquiry);

// Authenticated owner route for viewing inquiry conversation from notifications
router.get('/my/:id', authenticate, getMyContactInquiryById);

// Protected routes (Admin & Super Admin)
router.use(authenticate, authorize(['admin', 'superadmin']));
router.get('/', getContactInquiries);
router.get('/:id', getContactInquiry);
router.put('/:id/associate-user', associateInquiryUser);
router.put('/:id/status', updateContactInquiryStatus);
router.post('/:id/reply', replyContactInquiry);
router.delete('/:id', deleteContactInquiry);

export default router;
