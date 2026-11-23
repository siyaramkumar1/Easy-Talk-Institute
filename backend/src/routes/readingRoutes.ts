import express from 'express';
import {
  getPublicStories,
  getPublicStoryById,
  getStudentProgressSummary,
  getStoryProgress,
  saveStoryProgress,
  completeStory,
  getAdminStories,
  createStory,
  updateStory,
  updateStoryStatus,
  deleteStory
} from '../controllers/readingController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public Reading endpoints (Published stories only)
router.get('/stories', getPublicStories);
router.get('/stories/:id', getPublicStoryById);

// Student authenticated progress endpoints
router.get('/progress/summary', authenticate, getStudentProgressSummary);
router.get('/progress/:id', authenticate, getStoryProgress);
router.post('/progress/:id', authenticate, saveStoryProgress);
router.post('/progress/:id/complete', authenticate, completeStory);

// Admin / Superadmin endpoints
router.get('/admin/stories', authenticate, authorize(['admin', 'superadmin']), getAdminStories);
router.post('/admin/stories', authenticate, authorize(['admin', 'superadmin']), createStory);
router.put('/admin/stories/:id', authenticate, authorize(['admin', 'superadmin']), updateStory);
router.patch('/admin/stories/:id/status', authenticate, authorize(['admin', 'superadmin']), updateStoryStatus);
router.delete('/admin/stories/:id', authenticate, authorize(['admin', 'superadmin']), deleteStory);

export default router;
