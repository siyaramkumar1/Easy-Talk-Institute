import express from 'express';
import { 
  getAdmins, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin, 
  getActivityLogs, 
  updateUserStatus,
  deleteReservation,
  getReservationStats
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/users', authenticate, authorize(['admin', 'superadmin']), getAdmins);
router.get('/students', authenticate, authorize(['admin', 'superadmin']), (req, res) => {
  req.query.roleGroup = 'student';
  return getAdmins(req, res);
});
router.post('/users', authenticate, authorize(['admin', 'superadmin']), createAdmin);
router.put('/users/:id', authenticate, authorize(['admin', 'superadmin']), updateAdmin);
router.delete('/users/:id', authenticate, authorize(['admin', 'superadmin']), deleteAdmin);
router.patch('/users/:id/status', authenticate, authorize(['admin', 'superadmin']), updateUserStatus);
router.get('/logs', authenticate, authorize(['admin', 'superadmin']), getActivityLogs);

// Seat Reservations Management APIs
router.get('/reservations/stats', authenticate, authorize(['admin', 'superadmin']), getReservationStats);
router.delete('/reservations/:id', authenticate, authorize(['admin', 'superadmin']), deleteReservation);

export default router;
