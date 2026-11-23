import express from 'express';
import { getStatistics, getLiveStatistics, getStudentsLearning, createStatistic, updateStatistic, deleteStatistic } from '../controllers/statisticController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/live', getLiveStatistics);
router.get('/students-learning', getStudentsLearning);
router.get('/', getStatistics);
router.post('/', authenticate, authorize(['superadmin']), createStatistic);
router.put('/:id', authenticate, authorize(['superadmin']), updateStatistic);
router.delete('/:id', authenticate, authorize(['superadmin']), deleteStatistic);

export default router;
