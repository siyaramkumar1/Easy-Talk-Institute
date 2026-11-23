// @ts-nocheck
import mongoose from 'mongoose';
import express from 'express';
import Enrollment from '../models/Enrollment';
import { Course } from '../models/Course';
import { Batch } from '../models/Batch';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, authorize } from '../middleware/auth';
import { getIoInstance } from '../sockets/notificationSocket';

const router = express.Router();

// Generate professional enrollment reference ID
const generateEnrollmentId = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ETI-ENR-${year}-${randomSuffix}`;
};

// Helper to build or ensure standard 5-step timeline
const buildDefaultTimeline = (enr: any) => {
  const step = enr.admissionStep || 1;
  const isApproved = enr.status === 'Approved' || enr.approvalStatus === 'approved';
  const isRejected = enr.status === 'Rejected' || enr.approvalStatus === 'rejected' || enr.verificationStatus === 'rejected';
  const hasBatch = !!(enr.batchAssigned || (enr.batchPreference && enr.batchPreference !== 'None' && step >= 4));
  const welcomeSent = !!enr.welcomeNoticeSent || step >= 5;

  return [
    {
      step: 1,
      title: 'Request Submitted',
      description: 'Enrollment received successfully',
      status: 'completed',
      timestamp: enr.createdAt || new Date(),
      updatedBy: enr.studentName || 'Student'
    },
    {
      step: 2,
      title: 'Admin Verification',
      description: enr.verificationStatus === 'verified' 
        ? 'Documents & profile reviewed by Admin' 
        : enr.verificationStatus === 'rejected'
          ? (enr.verificationNotes || 'Verification failed - needs review')
          : 'Waiting for Admin document verification',
      status: enr.verificationStatus === 'verified' 
        ? 'completed' 
        : enr.verificationStatus === 'rejected' 
          ? 'rejected' 
          : step >= 2 ? 'in_progress' : 'pending',
      timestamp: enr.verifiedAt || enr.createdAt || new Date(),
      updatedBy: enr.verifiedBy || 'Admin'
    },
    {
      step: 3,
      title: 'Admission Approval',
      description: isApproved
        ? 'Admission officially approved by institute administration'
        : isRejected
          ? (enr.rejectionReason || 'Admission request was rejected')
          : enr.approvalStatus === 'waiting'
            ? 'Admission decision in review'
            : 'Waiting for approval',
      status: isApproved 
        ? 'completed' 
        : isRejected 
          ? 'rejected' 
          : enr.approvalStatus === 'waiting' 
            ? 'waiting' 
            : step >= 3 ? 'in_progress' : 'pending',
      timestamp: enr.approvedAt || enr.updatedAt || new Date(),
      updatedBy: enr.approvedBy || 'Admin'
    },
    {
      step: 4,
      title: 'Batch Allocation',
      description: hasBatch
        ? `Allocated to ${enr.batchAssigned || enr.batchPreference}${enr.batchStartDate ? ` (Starts: ${enr.batchStartDate})` : ''}`
        : 'Batch allocation pending',
      status: hasBatch ? 'completed' : (isApproved && !isRejected) ? 'in_progress' : 'pending',
      timestamp: enr.batchAssignedAt || enr.updatedAt || new Date(),
      updatedBy: 'Admin'
    },
    {
      step: 5,
      title: 'Welcome Notice',
      description: welcomeSent
        ? (enr.welcomeMessage || 'Congratulations! Welcome notice sent with commencement schedule.')
        : 'Welcome notice pending batch readiness',
      status: welcomeSent ? 'completed' : (hasBatch && isApproved) ? 'in_progress' : 'pending',
      timestamp: enr.welcomeNoticeSentAt || enr.updatedAt || new Date(),
      updatedBy: 'Admin'
    }
  ];
};

// POST /api/enrollments - Submit admission enrollment
router.post('/', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ message: 'Database disconnected' });
    const { 
      courseId, 
      courseName, 
      studentName, 
      email, 
      mobile,
      batchPreference,
      notes,
      confirmationMethods,
      courseFee,
      courseDuration,
      trainerName
    } = req.body;
    
    // @ts-ignore
    const userId = req.user.id;
    
    // Check if already enrolled in this exact course
    const existing = await Enrollment.findOne({ userId, courseId, status: { $ne: 'Cancelled' } });
    if (existing) {
      return res.status(400).json({ 
        message: 'You have already enrolled in this course.',
        enrollment: existing
      });
    }

    // Try to fetch course details for richer snapshot if not fully supplied
    let resolvedFee = courseFee || 0;
    let resolvedDuration = courseDuration || '3 Months';
    let resolvedTrainer = trainerName || 'Senior Faculty';

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      const courseDoc = await Course.findById(courseId).lean();
      if (courseDoc) {
        resolvedFee = courseDoc.price || resolvedFee;
        resolvedDuration = courseDoc.duration || resolvedDuration;
        resolvedTrainer = courseDoc.instructor || resolvedTrainer;
      }
    } else if (courseName) {
      const courseDoc = await Course.findOne({ title: new RegExp('^' + courseName + '$', 'i') }).lean();
      if (courseDoc) {
        resolvedFee = courseDoc.price || resolvedFee;
        resolvedDuration = courseDoc.duration || resolvedDuration;
        resolvedTrainer = courseDoc.instructor || resolvedTrainer;
      }
    }

    const enrollmentId = generateEnrollmentId();

    const enrollment = new Enrollment({
      userId,
      enrollmentId,
      courseId: courseId || 'general',
      courseName: courseName || 'Spoken English Mastery',
      studentName: studentName || req.user.name || 'Student',
      email: email || req.user.email,
      mobile: mobile || req.user.mobile,
      batchPreference: batchPreference || 'Morning Batch',
      notes: (notes || '').slice(0, 500),
      confirmationMethods: Array.isArray(confirmationMethods) && confirmationMethods.length > 0 ? confirmationMethods : ['Email Confirmation'],
      courseFee: resolvedFee,
      courseDuration: resolvedDuration,
      trainerName: resolvedTrainer,
      location: 'Easy Talk Institute, Main Campus',
      status: 'Pending',
      admissionStep: 1,
      verificationStatus: 'pending',
      approvalStatus: 'pending',
      paymentStatus: 'pending',
      welcomeNoticeSent: false,
      timeline: buildDefaultTimeline({
        studentName: studentName || req.user.name || 'Student',
        createdAt: new Date(),
        admissionStep: 1,
        status: 'Pending',
        verificationStatus: 'pending',
        approvalStatus: 'pending'
      })
    });
    
    await enrollment.save();

    // 1. Send Student Dashboard Notification
    try {
      const studentNotification = new Notification({
        title: 'Enrollment Submitted Successfully',
        message: `Your enrollment request for "${enrollment.courseName}" has been successfully submitted (ID: ${enrollmentId}). Our team will review and contact you shortly.`,
        targetAudience: 'individual',
        recipientId: userId,
        priority: 'high',
        createdBy: userId,
        readBy: [],
        isDeleted: false
      });
      await studentNotification.save();
    } catch (notifErr) {
      console.warn('Student notification notice:', notifErr);
    }

    // 2. Send Admin Notification
    try {
      const adminNotification = new Notification({
        title: 'New Admission Enrollment Received',
        message: `${enrollment.studentName} enrolled in "${enrollment.courseName}" (${enrollmentId}). Batch: ${enrollment.batchPreference}.`,
        targetAudience: 'admins',
        priority: 'normal',
        createdBy: userId,
        readBy: [],
        isDeleted: false
      });
      await adminNotification.save();
    } catch (adminNotifErr) {
      console.warn('Admin notification notice:', adminNotifErr);
    }

    // 3. Log Activity
    try {
      await ActivityLog.create({
        action: `Enrolled: ${enrollment.courseName}`,
        module: 'Enrollment',
        performedBy: enrollment.studentName,
        role: req.user.role || 'student',
        ip: req.ip
      });
    } catch {}

    // 4. Socket notifications for real-time live updates
    const io = getIoInstance();
    if (io) {
      io.emit('coursesUpdated');
      io.emit('enrollmentsUpdated');
      io.emit('notification_created');
    }

    res.status(201).json({
      success: true,
      message: 'Enrollment confirmed successfully!',
      enrollment
    });
  } catch (err: any) {
    console.error('Enrollment error:', err);
    res.status(500).json({ message: 'Server error during enrollment', error: err.message });
  }
});

// GET /api/enrollments/my - Get current student's enrollments
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const enrollments = await Enrollment.find({ userId }).sort({ createdAt: -1 }).lean();
    if (!enrollments.length) return res.json([]);

    const courseIds = enrollments.map(e => e.courseId).filter(id => mongoose.Types.ObjectId.isValid(id));
    const courseNames = enrollments.map(e => e.courseName).filter(Boolean);

    // Batch query courses and batches in parallel
    const [courses, batches] = await Promise.all([
      Course.find({
        $or: [
          { _id: { $in: courseIds } },
          { title: { $in: courseNames } }
        ]
      }).lean(),
      Batch.find({
        $or: [
          { students: userId },
          { course: { $in: courseIds } }
        ],
        status: { $in: ['Active', 'Upcoming', 'active', 'upcoming'] }
      }).lean()
    ]);

    const courseMap = new Map();
    for (const c of courses) {
      courseMap.set(String(c._id), c);
      if (c.title) courseMap.set(c.title.toLowerCase(), c);
    }

    const enriched = enrollments.map((enr) => {
      let courseDoc = null;
      if (enr.courseId && courseMap.has(String(enr.courseId))) {
        courseDoc = courseMap.get(String(enr.courseId));
      } else if (enr.courseName && courseMap.has(enr.courseName.toLowerCase())) {
        courseDoc = courseMap.get(enr.courseName.toLowerCase());
      }

      const enrObj: any = { ...enr };
      if (courseDoc) {
        enrObj.course = {
          _id: courseDoc._id,
          title: courseDoc.title,
          slug: courseDoc.slug,
          thumbnail: courseDoc.thumbnail || { url: courseDoc.thumbnailUrl || courseDoc.imageUrl }
        };
      }

      // Check assigned batch from batch list
      const batchDoc = batches.find(b => {
        const hasStudent = Array.isArray(b.students) && b.students.some((s: any) => String(s) === String(userId));
        const matchesCourse = courseDoc && String(b.course) === String(courseDoc._id);
        return hasStudent || matchesCourse;
      });

      if (batchDoc) {
        enrObj.batch = {
          name: batchDoc.name,
          startDate: new Date(batchDoc.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          endDate: new Date(batchDoc.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          timing: batchDoc.timing || `${batchDoc.startTime} - ${batchDoc.endTime}`
        };
      }

      // Ensure timeline is fully populated
      enrObj.timeline = Array.isArray(enr.timeline) && enr.timeline.length > 0 
        ? enr.timeline 
        : buildDefaultTimeline(enr);

      return enrObj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/enrollments/admin - Admin view of all enrollments
router.get('/admin', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const enrollments = await Enrollment.find().sort({ createdAt: -1 }).populate('userId', 'name email mobile').lean();
    
    // Ensure all have timeline populated
    const formatted = enrollments.map(e => ({
      ...e,
      timeline: Array.isArray(e.timeline) && e.timeline.length > 0 ? e.timeline : buildDefaultTimeline(e)
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/enrollments/admin/:id/verify - Verify student documents & application
router.patch('/admin/:id/verify', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body; // 'verified' | 'rejected'
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const status = verificationStatus || 'verified';
    enrollment.verificationStatus = status;
    enrollment.verifiedAt = new Date();
    enrollment.verifiedBy = (req as any).user?.name || 'Admin';
    if (notes) enrollment.verificationNotes = notes;

    if (status === 'verified') {
      if ((enrollment.admissionStep || 1) < 2) enrollment.admissionStep = 2;
    } else if (status === 'rejected') {
      enrollment.status = 'Rejected';
      enrollment.approvalStatus = 'rejected';
      enrollment.rejectionReason = notes || 'Document verification rejected by Admin.';
    }

    enrollment.timeline = buildDefaultTimeline(enrollment);
    await enrollment.save();

    // Send real-time notification to student
    try {
      const notifTitle = status === 'verified' 
        ? '📋 Admission Documents Verified' 
        : '❌ Admission Verification Issue';
      const notifMsg = status === 'verified'
        ? `Your profile and enrollment details for "${enrollment.courseName}" have been verified by Admin. Waiting for admission approval.`
        : `Admin flagged an issue during verification for "${enrollment.courseName}": ${notes || 'Please contact the institute administration.'}`;

      const notif = new Notification({
        title: notifTitle,
        message: notifMsg,
        targetAudience: 'individual',
        recipientId: enrollment.userId,
        priority: status === 'verified' ? 'normal' : 'high',
        createdBy: (req as any).user?.id,
        readBy: [],
        isDeleted: false
      });
      await notif.save();
    } catch (e) {
      console.warn('Student notification error:', e);
    }

    // Create activity log
    try {
      await ActivityLog.create({
        action: `Admission Verified: ${enrollment.courseName} (${status})`,
        module: 'Enrollment',
        performedBy: (req as any).user?.name || 'Admin',
        role: (req as any).user?.role || 'admin',
        ip: req.ip
      });
    } catch {}

    const io = getIoInstance();
    if (io) {
      io.emit('enrollmentsUpdated');
      io.emit('notification_created');
    }

    res.json({ success: true, message: `Admission verification updated to ${status}`, enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Error verifying enrollment', error: err.message });
  }
});

// PATCH /api/enrollments/admin/:id/approve - Approve or reject admission
router.patch('/admin/:id/approve', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { approvalStatus, notes } = req.body; // 'approved' | 'rejected' | 'waiting'
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const decision = approvalStatus || 'approved';
    enrollment.approvalStatus = decision;

    if (decision === 'approved') {
      enrollment.status = 'Approved';
      enrollment.approvedAt = new Date();
      enrollment.approvedBy = (req as any).user?.name || 'Admin';
      if ((enrollment.admissionStep || 1) < 3) enrollment.admissionStep = 3;
    } else if (decision === 'rejected') {
      enrollment.status = 'Rejected';
      enrollment.rejectionReason = notes || 'Admission rejected by Admin.';
    } else if (decision === 'waiting') {
      enrollment.status = 'Pending';
      enrollment.approvalStatus = 'waiting';
    }

    enrollment.timeline = buildDefaultTimeline(enrollment);
    await enrollment.save();

    // Send real-time notification to student
    try {
      const notifTitle = decision === 'approved' 
        ? '🎉 Your admission has been approved' 
        : decision === 'waiting'
          ? '⏳ Admission Under Review'
          : '❌ Your admission request needs review';

      const notifMsg = decision === 'approved'
        ? `Congratulations! Your admission for "${enrollment.courseName}" has been approved. Cohort batch allocation is now in progress.`
        : decision === 'waiting'
          ? `Your admission for "${enrollment.courseName}" is currently waiting for seat clearance.`
          : `Your admission request for "${enrollment.courseName}" was reviewed: ${notes || 'Needs review.'}`;

      const notif = new Notification({
        title: notifTitle,
        message: notifMsg,
        targetAudience: 'individual',
        recipientId: enrollment.userId,
        priority: 'high',
        createdBy: (req as any).user?.id,
        readBy: [],
        isDeleted: false
      });
      await notif.save();
    } catch (e) {
      console.warn('Student notification error:', e);
    }

    // Create activity log
    try {
      await ActivityLog.create({
        action: `Admission ${decision === 'approved' ? 'Approved' : decision}: ${enrollment.courseName}`,
        module: 'Enrollment',
        performedBy: (req as any).user?.name || 'Admin',
        role: (req as any).user?.role || 'admin',
        ip: req.ip
      });
    } catch {}

    const io = getIoInstance();
    if (io) {
      io.emit('enrollmentsUpdated');
      io.emit('coursesUpdated');
      io.emit('notification_created');
    }

    res.json({ success: true, message: `Admission decision set to ${decision}`, enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Error approving enrollment', error: err.message });
  }
});

// PATCH /api/enrollments/admin/:id/assign-batch - Allocate cohort batch
router.patch('/admin/:id/assign-batch', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { batchName, batchId, startDate, timing, trainerName } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (batchName) {
      enrollment.batchAssigned = batchName;
      enrollment.batchPreference = batchName;
    }
    if (startDate) enrollment.batchStartDate = startDate;
    if (timing) enrollment.batchTiming = timing;
    if (trainerName) {
      enrollment.trainerName = trainerName;
      enrollment.assignedTrainer = trainerName;
    }
    enrollment.batchAssignedAt = new Date();

    if ((enrollment.admissionStep || 1) < 4) enrollment.admissionStep = 4;

    // Link student to Batch document if valid ID provided
    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
      enrollment.batchId = batchId;
      try {
        await Batch.findByIdAndUpdate(batchId, {
          $addToSet: { students: enrollment.userId },
          $inc: { enrolledStudents: 1 }
        });
      } catch (bErr) {
        console.warn('Batch student linking error:', bErr);
      }
    }

    enrollment.timeline = buildDefaultTimeline(enrollment);
    await enrollment.save();

    // Send real-time notification to student
    try {
      const assignedName = batchName || enrollment.batchPreference || 'Cohort Batch';
      const notif = new Notification({
        title: `📚 You have been assigned to ${assignedName}`,
        message: `Your class schedule for "${enrollment.courseName}" is confirmed. Timing: ${timing || enrollment.batchTiming || 'Daily Classes'}. Batch starts on: ${startDate || enrollment.batchStartDate || 'Scheduled Date'}.`,
        targetAudience: 'individual',
        recipientId: enrollment.userId,
        priority: 'high',
        createdBy: (req as any).user?.id,
        readBy: [],
        isDeleted: false
      });
      await notif.save();
    } catch (e) {
      console.warn('Student notification error:', e);
    }

    // Activity Log
    try {
      await ActivityLog.create({
        action: `Batch Allocated: ${enrollment.studentName} -> ${batchName || enrollment.batchPreference}`,
        module: 'Enrollment',
        performedBy: (req as any).user?.name || 'Admin',
        role: (req as any).user?.role || 'admin',
        ip: req.ip
      });
    } catch {}

    const io = getIoInstance();
    if (io) {
      io.emit('enrollmentsUpdated');
      io.emit('batchesUpdated');
      io.emit('notification_created');
    }

    res.json({ success: true, message: 'Batch allocated successfully', enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Error allocating batch', error: err.message });
  }
});

// PATCH /api/enrollments/admin/:id/welcome-notice - Send congratulatory welcome notice
router.patch('/admin/:id/welcome-notice', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { welcomeMessage, startDate, trainerName } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (startDate) enrollment.batchStartDate = startDate;
    if (trainerName) enrollment.trainerName = trainerName;

    enrollment.welcomeNoticeSent = true;
    enrollment.welcomeNoticeSentAt = new Date();
    enrollment.welcomeMessage = welcomeMessage || `Congratulations! Your admission has been approved. Your batch starts on: ${enrollment.batchStartDate || startDate || 'Scheduled Date'}, Trainer: ${enrollment.trainerName || trainerName || 'Senior Faculty'}, Course: ${enrollment.courseName}.`;
    enrollment.admissionStep = 5;

    enrollment.timeline = buildDefaultTimeline(enrollment);
    await enrollment.save();

    // High priority notification to student
    try {
      const notif = new Notification({
        title: '🎉 Welcome to Easy Talk Institute!',
        message: enrollment.welcomeMessage,
        targetAudience: 'individual',
        recipientId: enrollment.userId,
        priority: 'urgent',
        createdBy: (req as any).user?.id,
        readBy: [],
        isDeleted: false
      });
      await notif.save();
    } catch (e) {
      console.warn('Student notification error:', e);
    }

    // Activity Log
    try {
      await ActivityLog.create({
        action: `Welcome Notice Sent: ${enrollment.studentName} (${enrollment.courseName})`,
        module: 'Enrollment',
        performedBy: (req as any).user?.name || 'Admin',
        role: (req as any).user?.role || 'admin',
        ip: req.ip
      });
    } catch {}

    const io = getIoInstance();
    if (io) {
      io.emit('enrollmentsUpdated');
      io.emit('notification_created');
    }

    res.json({ success: true, message: 'Welcome notice sent successfully', enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Error sending welcome notice', error: err.message });
  }
});

// PUT /api/enrollments/admin/:id - Update enrollment status or batch assignment
router.put('/admin/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { 
      status, 
      admissionStep, 
      batchPreference,
      verificationStatus,
      approvalStatus,
      rejectionReason,
      batchAssigned,
      batchStartDate,
      batchTiming,
      trainerName,
      welcomeNoticeSent,
      welcomeMessage
    } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (status) enrollment.status = status;
    if (admissionStep !== undefined) enrollment.admissionStep = Number(admissionStep);
    if (batchPreference) enrollment.batchPreference = batchPreference;
    if (verificationStatus) enrollment.verificationStatus = verificationStatus;
    if (approvalStatus) enrollment.approvalStatus = approvalStatus;
    if (rejectionReason !== undefined) enrollment.rejectionReason = rejectionReason;
    if (batchAssigned) enrollment.batchAssigned = batchAssigned;
    if (batchStartDate) enrollment.batchStartDate = batchStartDate;
    if (batchTiming) enrollment.batchTiming = batchTiming;
    if (trainerName) enrollment.trainerName = trainerName;
    if (welcomeNoticeSent !== undefined) enrollment.welcomeNoticeSent = Boolean(welcomeNoticeSent);
    if (welcomeMessage) enrollment.welcomeMessage = welcomeMessage;

    enrollment.timeline = buildDefaultTimeline(enrollment);
    await enrollment.save();

    const io = getIoInstance();
    if (io) {
      io.emit('enrollmentsUpdated');
      io.emit('notification_created');
    }

    res.json({ success: true, enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating enrollment', error: err.message });
  }
});

export default router;
