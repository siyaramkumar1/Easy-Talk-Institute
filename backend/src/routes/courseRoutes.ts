// @ts-nocheck
import express from 'express';
import { getCourses, getCourseByIdOrSlug, createCourse, updateCourse, updateCourseStatus, updateCourseFeature, deleteCourse } from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadCourseImage } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourseByIdOrSlug);

// Admin routes
router.post('/', authenticate, authorize(['admin', 'superadmin']), uploadCourseImage.single('thumbnail'), createCourse);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), uploadCourseImage.single('thumbnail'), updateCourse);
router.patch('/:id/status', authenticate, authorize(['admin', 'superadmin']), updateCourseStatus);
router.patch('/:id/feature', authenticate, authorize(['admin', 'superadmin']), updateCourseFeature);
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), deleteCourse);

export default router;
