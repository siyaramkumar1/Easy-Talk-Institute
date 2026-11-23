// @ts-nocheck
import express from 'express';
import { 
  getPublicGallery, getGallery, getGalleryItem, createGalleryItem, updateGalleryItem, deleteGalleryItem,
  getCategories, createCategory, updateCategory, deleteCategory
} from '../controllers/galleryController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadGalleryImage } from '../middleware/upload';

const router = express.Router();

// Categories (Must be before /:id routes)
router.get('/categories', getCategories);
router.post('/categories', authenticate, authorize(['admin', 'superadmin']), createCategory);
router.put('/categories/:id', authenticate, authorize(['admin', 'superadmin']), updateCategory);
router.delete('/categories/:id', authenticate, authorize(['admin', 'superadmin']), deleteCategory);

// Gallery Items
router.get('/public', getPublicGallery);
router.get('/', getGallery);
router.get('/:id', getGalleryItem);
router.post('/', authenticate, authorize(['admin', 'superadmin']), uploadGalleryImage.single('image'), createGalleryItem);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), uploadGalleryImage.single('image'), updateGalleryItem);
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), deleteGalleryItem);

export default router;
