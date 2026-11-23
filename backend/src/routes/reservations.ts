// @ts-nocheck
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import Reservation from '../models/Reservation';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import Enrollment from '../models/Enrollment';
import { authenticate, authorize } from '../middleware/auth';
import { getIoInstance } from '../sockets/notificationSocket';
import { SmsNotificationService } from '../services/smsNotificationService';

const router = express.Router();

// POST /api/reservations - Public & Authenticated seat reservation
router.post('/', async (req, res) => {
  try {
    const { 
      fullName, 
      mobile, 
      mobileNumber,
      email, 
      courseInterested, 
      batchPreference, 
      highestQualification, 
      purposeOfJoining, 
      message, 
      courseId, 
      courseName,
      city,
      state
    } = req.body;

    // Validation: Full Name (required, min 2 characters)
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ message: 'Full name is required and must be at least 2 characters.' });
    }

    // Validation: Mobile Number (required, exactly 10 digits)
    const cleanMobile = (mobileNumber || mobile || '').toString().trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
    }

    // Validation: Email (optional, validate format if provided)
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Validation: Course Interested In (required)
    if (!courseInterested || !courseInterested.trim()) {
      return res.status(400).json({ message: 'Course interested in is required.' });
    }

    // Validation: Batch Preference (required)
    const validBatches = [
      'Morning Batch', 'Afternoon Batch', 'Evening Batch', 'Weekend Batch',
      'Morning', 'Afternoon', 'Evening', 'Weekend', 'Any Batch'
    ];
    if (!batchPreference || !validBatches.includes(batchPreference)) {
      return res.status(400).json({ message: 'Please select a valid batch preference.' });
    }

    // Validation: Highest Qualification (required)
    const validQualifications = [
      'Matriculation', 'Intermediate', 'Graduation', 'Post Graduation',
      '10th', '12th', 'Graduate', 'Post Graduate', 'Other'
    ];
    if (!highestQualification || !validQualifications.includes(highestQualification)) {
      return res.status(400).json({ message: 'Please select a valid highest qualification.' });
    }

    // Validation: Purpose of Joining (required)
    const validPurposes = [
      'Improve Spoken English', 'Job Interview Preparation', 'Personality Development', 'Career Growth', 'Study Abroad',
      'Spoken English', 'Interview Preparation', 'Placement Guidance', 'Public Speaking', 'Other'
    ];
    if (!purposeOfJoining || !validPurposes.includes(purposeOfJoining)) {
      return res.status(400).json({ message: 'Please select a valid purpose of joining.' });
    }

    // Validation: Message (optional, max 500 chars)
    if (message && message.length > 500) {
      return res.status(400).json({ message: 'Message cannot exceed 500 characters.' });
    }

    // Generate unique human-readable Reference ID: ETI-2026-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const referenceId = `ETI-2026-${randomSuffix}`;

    // Optional user ID from token if logged in
    let userId = null;
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        if (token === 'mock-user-token' || token === 'mock-admin-token') {
          userId = 'mock';
        } else {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          if (decoded && decoded.userId) {
            userId = decoded.userId;
          }
        }
      } catch {
        // Continue if token invalid or expired
      }
    }

    const reservation = new Reservation({
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
      referenceId,
      fullName: fullName.trim(),
      mobile: cleanMobile,
      mobileNumber: cleanMobile,
      email: email ? email.trim().toLowerCase() : '',
      courseInterested: courseInterested.trim(),
      courseName: courseName || courseInterested.trim(),
      courseId: courseId || '',
      batchPreference,
      highestQualification,
      purposeOfJoining,
      message: message ? message.trim() : '',
      city: city || '',
      state: state || '',
      status: 'Pending'
    });

    await reservation.save();

    // Trigger SMS notification to verified admin (+91 7979819796) asynchronously in the background
    // Handles SmsHorizon delivery, Dashboard Notification, Activity Log, and duplicate prevention
    SmsNotificationService.sendReservationSmsNotification(reservation).catch((smsErr) => {
      console.error('[Reservation Route] Background SMS notification error:', smsErr?.message || smsErr);
    });

    // Real-time socket emission to update Admin Portal immediately
    try {
      getIoInstance()?.emit('reservationsUpdated');
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr);
    }

    res.status(201).json({ success: true, reservation, referenceId });
  } catch (err: any) {
    console.error('Reservation creation failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reservations/my - Get reservations for current student
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const reservations = await Reservation.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reservations/admin - Get all reservations for admin/superadmin
router.get('/admin', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const reservations = await Reservation.find().sort({ createdAt: -1 }).populate('userId', 'name email').lean();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reservations/admin/:id - Update reservation status / remarks
router.put('/admin/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Reservation not found' });

    const prevStatus = existing.status;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id as any, 
      req.body, 
      { returnDocument: 'after' } as any
    );

    // 1. Find user if associated
    let user = null;
    if (reservation.userId && mongoose.Types.ObjectId.isValid(reservation.userId)) {
      user = await User.findById(reservation.userId);
    }
    if (!user && reservation.email) {
      user = await User.findOne({ email: reservation.email.toLowerCase() });
    }

    // 2. Notification to user if user exists
    if (user) {
      const recipientId = user._id;
      let notifTitle = '';
      let notifMessage = '';
      let priority = 'normal';

      if (status === 'Approved' || status === 'Confirmed') {
        notifTitle = 'Seat Reservation Approved! 🎉';
        notifMessage = `Congratulations ${reservation.fullName}! Your seat reservation for "${reservation.courseInterested || reservation.courseName}" has been approved.${remarks ? ' Note: ' + remarks : ' Our counselor will reach out with your batch schedule.'}`;
        priority = 'high';
      } else if (status === 'Rejected') {
        notifTitle = 'Seat Reservation Update';
        notifMessage = `Dear ${reservation.fullName}, your seat reservation for "${reservation.courseInterested || reservation.courseName}" could not be confirmed.${remarks ? ' Reason: ' + remarks : ' Please contact institute administration for further guidance.'}`;
        priority = 'normal';
      } else if (status === 'Contacted') {
        notifTitle = 'Easy Talk Institute Counseling Update';
        notifMessage = `Dear ${reservation.fullName}, our admissions team has reviewed your reservation for "${reservation.courseInterested || reservation.courseName}".${remarks ? ' Counselor remarks: ' + remarks : ''}`;
      }

      if (notifTitle) {
        const notif = new Notification({
          title: notifTitle,
          message: notifMessage,
          targetAudience: 'individual',
          recipientId,
          priority,
          createdBy: req.user?.id || req.user?._id,
          readBy: [],
          isDeleted: false
        });
        await notif.save();
        getIoInstance()?.emit('notification_created', notif);
      }
    }

    // 3. Activity Log
    try {
      if (mongoose.connection.readyState === 1) {
        await ActivityLog.create({
          action: `Reservation ${status}: ${reservation.fullName} (${reservation.courseInterested || reservation.courseName || 'Course'})`,
          module: 'Reservations',
          performedBy: req.user?.name || 'Admin',
          role: req.user?.role || 'admin',
          ip: req.ip
        });
      }
    } catch (logErr) {
      console.error('Failed to log activity:', logErr);
    }

    // 4. Dynamic batch/course student counts & enrollment creation upon approval
    if ((status === 'Approved' || status === 'Confirmed') && prevStatus !== 'Approved' && prevStatus !== 'Confirmed') {
      try {
        // Increment course enrolledStudents
        const courseQuery = reservation.courseId && mongoose.Types.ObjectId.isValid(reservation.courseId)
          ? { _id: reservation.courseId }
          : { title: new RegExp('^' + (reservation.courseInterested || reservation.courseName) + '$', 'i') };
        
        const course = await Course.findOne(courseQuery as any);
        if (course) {
          await Course.updateOne({ _id: course._id }, { $inc: { enrolledStudents: 1 } });
        }

        // Check matching batch: course or batch preference
        const batchQuery: any = {
          status: { $in: ['Active', 'Upcoming'] }
        };
        if (course) {
          batchQuery.course = course._id;
        }
        if (reservation.batchPreference && reservation.batchPreference !== 'Any Batch') {
          batchQuery.$or = [
            { name: new RegExp(reservation.batchPreference, 'i') },
            { timing: new RegExp(reservation.batchPreference, 'i') }
          ];
        }

        const batch = await Batch.findOne(batchQuery);
        if (batch) {
          // Check capacity limit to prevent overbooking
          if (batch.enrolledStudents < batch.capacity) {
            batch.enrolledStudents = (batch.enrolledStudents || 0) + 1;
            if (user && !batch.students?.includes(user._id)) {
              if (!batch.students) batch.students = [];
              batch.students.push(user._id);
            }
            await batch.save();
          }
        }

        // If user account exists, record approved enrollment
        if (user) {
          const existingEnr = await Enrollment.findOne({
            userId: user._id,
            $or: [
              { courseName: reservation.courseInterested || reservation.courseName },
              { courseId: course ? course._id.toString() : (reservation.courseId || '') }
            ]
          });
          if (!existingEnr) {
            await Enrollment.create({
              userId: user._id,
              courseId: course ? course._id.toString() : (reservation.courseId || reservation.courseInterested),
              courseName: reservation.courseInterested || reservation.courseName,
              studentName: reservation.fullName,
              email: reservation.email || user.email,
              mobile: reservation.mobile || reservation.mobileNumber,
              status: 'Approved'
            });
          } else if (existingEnr.status !== 'Approved') {
            existingEnr.status = 'Approved';
            await existingEnr.save();
          }
        }
      } catch (countErr) {
        console.error('Error updating counts on approval:', countErr);
      }
    }

    // 5. Instant socket notifications across the platform
    try {
      const io = getIoInstance();
      if (io) {
        io.emit('reservationsUpdated');
        io.emit('batchesUpdated');
        io.emit('coursesUpdated');
      }
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr);
    }

    res.json(reservation);
  } catch (err: any) {
    console.error('Reservation update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reservations/stats - Aggregate real-time statistics
router.get('/stats', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, total: 0, pending: 0, confirmed: 0, cancelled: 0 });
    }
    const [total, pending, confirmed, cancelled] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: { $in: ['Pending', 'Contacted'] } }),
      Reservation.countDocuments({ status: { $in: ['Confirmed', 'Approved', 'Reserved', 'Converted'] } }),
      Reservation.countDocuments({ status: { $in: ['Cancelled', 'Rejected'] } }),
    ]);
    res.json({ success: true, total, pending, confirmed, cancelled });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

// Shared delete handler for seat reservations
const handleDeleteReservation = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation ID' });
    }

    // Check if reservation exists
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const studentName = reservation.fullName || 'Student';

    // Permanently remove from MongoDB collection (no soft delete)
    await Reservation.findByIdAndDelete(id);

    // Record Activity Log
    try {
      const performer = req.user?.name || req.user?.email || (req.user?.role === 'superadmin' ? 'Super Admin' : 'Admin');
      await ActivityLog.create({
        action: 'Reservation Deleted',
        description: `Admin deleted reservation of ${studentName}`,
        module: 'Reservations',
        performedBy: performer,
        role: req.user?.role || 'admin',
        ip: req.ip || req.socket?.remoteAddress || '127.0.0.1'
      });
    } catch (logErr) {
      console.error('Failed to log activity for reservation deletion:', logErr);
    }

    // Real-time socket notification across connected clients
    try {
      getIoInstance()?.emit('reservationsUpdated');
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (err: any) {
    console.error('Error permanently deleting reservation:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting reservation',
      error: err.message
    });
  }
};

// DELETE /api/reservations/admin/:id - Delete reservation
router.delete('/admin/:id', authenticate, authorize(['admin', 'superadmin']), handleDeleteReservation);

// DELETE /api/reservations/:id - Delete reservation
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), handleDeleteReservation);

// POST /api/reservations/admin/:id/resend-sms - Manually resend SMS to verified admin number
router.post('/admin/:id/resend-sms', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const result = await SmsNotificationService.resendReservationSmsNotification(req.params.id);
    res.json({ success: true, message: 'SMS notification resent successfully', result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to resend SMS' });
  }
});

export default router;

