// @ts-nocheck
import express from 'express';
import { 
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateTestimonialStatus,
  updateTestimonialFeature,
  verifyTestimonialStudent
} from '../controllers/testimonialController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadTestimonialImage } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getTestimonials);
router.get('/:id', getTestimonial);

// Protected routes
router.use(authenticate, authorize(['admin', 'superadmin']));
router.post('/', uploadTestimonialImage.single('studentPhoto'), createTestimonial);
router.put('/:id', uploadTestimonialImage.single('studentPhoto'), updateTestimonial);
router.delete('/:id', deleteTestimonial);
router.patch('/:id/status', updateTestimonialStatus);
router.patch('/:id/feature', updateTestimonialFeature);
router.patch('/:id/verify', verifyTestimonialStudent);

export default router;
