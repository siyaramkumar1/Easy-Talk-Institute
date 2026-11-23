// @ts-nocheck
import express from 'express';
import { getAllBatches, getPublicBatches, getBatchById, createBatch, updateBatch, deleteBatch, getHomeBatchesStats } from '../controllers/batchController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadBatchImage } from '../middleware/upload';

const router = express.Router();

router.get('/home', getHomeBatchesStats);
router.get('/public', getPublicBatches);
router.get('/', getAllBatches);
router.get('/:id', getBatchById);

router.post('/', authenticate, authorize(['admin', 'superadmin']), uploadBatchImage.single('thumbnail'), createBatch);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), uploadBatchImage.single('thumbnail'), updateBatch);
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), deleteBatch);

export default router;
