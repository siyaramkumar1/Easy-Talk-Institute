// @ts-nocheck
import express from 'express';
import { authenticate } from '../middleware/auth';
import { User } from '../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { uploadUserImage } from '../middleware/upload';
import cloudinary from '../config/cloudinary';
import Enrollment from '../models/Enrollment';
import Reservation from '../models/Reservation';
import { Course } from '../models/Course';
import { Batch } from '../models/Batch';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { TestAttempt } from '../models/TestAttempt';
import TestResult from '../models/TestResult';

const router = express.Router();

router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

router.put('/profile', authenticate, uploadUserImage.single('avatar'), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, mobile, whatsapp } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    
    await ActivityLog.create({
      action: 'Profile Updated',
      module: 'User',
      performedBy: updatedUser?.name || 'Student',
      role: updatedUser?.role || 'student',
      ip: req.ip || '127.0.0.1'
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
});

// GET /api/users/dashboard - Real Student Dashboard Data
router.get('/dashboard', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        enrolledCoursesCount: 0,
        activeBatchesCount: 0,
        upcomingBatchesCount: 0,
        unreadNotificationsCount: 0,
        enrolledCourses: [],
        activeBatches: [],
        upcomingBatches: [],
        recentActivities: []
      });
    }

    const user = await User.findById(userId);
    const userEmail = user?.email?.toLowerCase();

    // 1. Enrolled Courses: Real data from Enrollments + Confirmed/Approved Reservations
    const [enrollments, reservations] = await Promise.all([
      Enrollment.find({ userId, status: { $ne: 'Cancelled' } }).sort({ createdAt: -1 }),
      Reservation.find({
        $or: [{ userId }, { email: userEmail }],
        status: { $in: ['Approved', 'Confirmed', 'Reserved'] }
      }).sort({ createdAt: -1 })
    ]);

    // Collect Course details
    const courseIdSet = new Set<string>();
    const courseTitleSet = new Set<string>();

    enrollments.forEach(e => {
      if (e.courseId) courseIdSet.add(e.courseId.toString());
      if (e.courseName) courseTitleSet.add(e.courseName.trim());
    });

    reservations.forEach(r => {
      if (r.courseId) courseIdSet.add(r.courseId.toString());
      if (r.courseInterested) courseTitleSet.add(r.courseInterested.trim());
      if (r.courseName) courseTitleSet.add(r.courseName.trim());
    });

    const validObjectIds = Array.from(courseIdSet).filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
    const titleList = Array.from(courseTitleSet);
    const titleRegexList = titleList.map(t => new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'));

    let enrolledCourses: any[] = [];
    if (validObjectIds.length > 0 || titleRegexList.length > 0) {
      const courseDocs = await Course.find({
        $or: [
          ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
          ...(titleRegexList.length > 0 ? [{ title: { $in: titleRegexList } }] : []),
          ...(titleRegexList.length > 0 ? [{ slug: { $in: titleRegexList } }] : [])
        ]
      });

      // Add found course IDs
      courseDocs.forEach(c => courseIdSet.add(c._id.toString()));

      enrolledCourses = courseDocs.map(c => {
        const matchingEnrollment = enrollments.find(e => 
          String(e.courseId) === String(c._id) || 
          (e.courseName && c.title && e.courseName.toLowerCase() === c.title.toLowerCase())
        );

        let admStatus = 'Approved';
        let step = 3;
        if (matchingEnrollment) {
          admStatus = matchingEnrollment.status || 'Pending';
          step = matchingEnrollment.admissionStep || 1;
        }

        return {
          _id: c._id,
          title: c.title,
          slug: c.slug,
          category: c.category,
          duration: c.duration,
          level: c.level,
          thumbnailUrl: c.thumbnailUrl || c.thumbnail?.url || c.imageUrl,
          thumbnail: c.thumbnail,
          status: admStatus === 'Approved' ? 'Enrolled' : admStatus,
          admissionStatus: admStatus,
          admissionStep: step,
          enrollmentId: matchingEnrollment?.enrollmentId,
          batchAssigned: matchingEnrollment?.batchAssigned || matchingEnrollment?.batchPreference
        };
      });
    }

    // Deduplicate enrolled courses count
    const uniqueCourseCount = Math.max(enrolledCourses.length, courseTitleSet.size);

    // 2. Active & Upcoming Batches assigned to logged-in student
    const allEnrolledCourseIds = Array.from(courseIdSet).filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));

    // A batch is assigned to this student if:
    // a) Student ID is in batch.students
    // b) Batch course belongs to one of student's enrolled courses
    // c) Batch name matches one of student's enrolled courses
    const studentBatches = await Batch.find({
      $or: [
        { students: userId },
        ...(allEnrolledCourseIds.length > 0 ? [{ course: { $in: allEnrolledCourseIds } }] : []),
        ...(titleRegexList.length > 0 ? [{ name: { $in: titleRegexList } }] : [])
      ]
    }).populate('course', 'title slug thumbnail imageUrl').sort({ startDate: 1 });

    const formatDateStr = (dateVal: any) => {
      if (!dateVal) return 'TBA';
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'TBA' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    let activeBatches = studentBatches
      .filter(b => b.status && b.status.toLowerCase() === 'active')
      .map(b => ({
        _id: b._id,
        name: b.name,
        courseName: b.course?.title || b.name,
        course: b.course ? { title: b.course.title, slug: b.course.slug } : { title: b.name },
        trainer: b.trainer || 'Expert Instructor',
        trainerName: b.trainer || 'Expert Instructor',
        timing: b.timing || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Daily Classes'),
        startDate: formatDateStr(b.startDate),
        endDate: formatDateStr(b.endDate),
        startTime: b.startTime,
        endTime: b.endTime,
        availableSeats: Math.max(0, (b.capacity || 30) - (b.enrolledStudents || 0)),
        status: 'Active',
        statusBadge: 'Active',
        isAssigned: true
      }));

    let upcomingBatches = studentBatches
      .filter(b => b.status && b.status.toLowerCase() === 'upcoming')
      .map(b => ({
        _id: b._id,
        name: b.name,
        courseName: b.course?.title || b.name,
        course: b.course ? { title: b.course.title, slug: b.course.slug } : { title: b.name },
        trainer: b.trainer || 'Expert Instructor',
        trainerName: b.trainer || 'Expert Instructor',
        timing: b.timing || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Daily Classes'),
        startDate: formatDateStr(b.startDate),
        endDate: formatDateStr(b.endDate),
        startTime: b.startTime,
        endTime: b.endTime,
        availableSeats: Math.max(0, (b.capacity || 30) - (b.enrolledStudents || 0)),
        status: 'Upcoming',
        statusBadge: 'Upcoming',
        isAssigned: true
      }));

    // If student has no assigned active batches, show institute's active batches
    if (activeBatches.length === 0) {
      const dbActive = await Batch.find({ status: { $regex: /^active$/i } })
        .populate('course', 'title slug thumbnail imageUrl')
        .sort({ startDate: 1 })
        .limit(6);
      activeBatches = dbActive.map(b => ({
        _id: b._id,
        name: b.name,
        courseName: b.course?.title || b.name,
        course: b.course ? { title: b.course.title, slug: b.course.slug } : { title: b.name },
        trainer: b.trainer || 'Expert Instructor',
        trainerName: b.trainer || 'Expert Instructor',
        timing: b.timing || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Daily Classes'),
        startDate: formatDateStr(b.startDate),
        endDate: formatDateStr(b.endDate),
        startTime: b.startTime,
        endTime: b.endTime,
        availableSeats: Math.max(0, (b.capacity || 30) - (b.enrolledStudents || 0)),
        status: 'Active',
        statusBadge: 'Active',
        isAssigned: false
      }));
    }

    // If student has no assigned upcoming batches, show institute's upcoming batches
    if (upcomingBatches.length === 0) {
      const dbUpcoming = await Batch.find({ status: { $regex: /^upcoming$/i } })
        .populate('course', 'title slug thumbnail imageUrl')
        .sort({ startDate: 1 })
        .limit(6);
      upcomingBatches = dbUpcoming.map(b => ({
        _id: b._id,
        name: b.name,
        courseName: b.course?.title || b.name,
        course: b.course ? { title: b.course.title, slug: b.course.slug } : { title: b.name },
        trainer: b.trainer || 'Expert Instructor',
        trainerName: b.trainer || 'Expert Instructor',
        timing: b.timing || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'Daily Classes'),
        startDate: formatDateStr(b.startDate),
        endDate: formatDateStr(b.endDate),
        startTime: b.startTime,
        endTime: b.endTime,
        availableSeats: Math.max(0, (b.capacity || 30) - (b.enrolledStudents || 0)),
        status: 'Upcoming',
        statusBadge: 'Upcoming',
        isAssigned: false
      }));
    }

    // Auto-calculate directly from MongoDB Batch collection
    const [activeBatchesCount, upcomingBatchesCount] = await Promise.all([
      Batch.countDocuments({ status: { $regex: /^active$/i } }),
      Batch.countDocuments({ status: { $regex: /^upcoming$/i } })
    ]);

    // 3. Unread Notifications Count (Real count for this student)
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const unreadNotificationsCount = await Notification.countDocuments({
      isDeleted: { $ne: true },
      $or: [
        { recipientId: userObjectId },
        { targetAudience: { $in: ['all', 'students'] } },
        { targetType: { $in: ['All Students', 'All Users', 'all'] } },
        { targetIds: userObjectId }
      ],
      readBy: { $ne: userObjectId }
    });

    // 4. Real Recent Activity Feed
    const recentActivities: any[] = [];

    // Check Enrollments
    enrollments.forEach(e => {
      recentActivities.push({
        type: 'Course Enrolled',
        description: `Course Enrolled: Enrolled in ${e.courseName || 'Course'}`,
        date: e.createdAt
      });
    });

    // Check Reservations
    reservations.forEach(r => {
      let activityType = 'Seat Reserved';
      if (r.status === 'Approved') activityType = 'Reservation Approved';
      else if (r.status === 'Rejected') activityType = 'Reservation Rejected';

      recentActivities.push({
        type: activityType,
        description: `${activityType}: ${r.courseInterested || r.courseName || 'Course'} seat reservation is ${r.status}`,
        date: r.updatedAt || r.createdAt
      });
    });

    // Check Batch Assignments
    studentBatches.forEach(b => {
      recentActivities.push({
        type: 'Batch Joined',
        description: `Batch Joined: Assigned to batch "${b.name}"`,
        date: b.updatedAt || b.createdAt
      });
    });

    // Check Test Attempts / Results
    try {
      const testResults = await TestResult.find({
        $or: [
          { userId },
          ...(userEmail ? [{ email: userEmail }] : [])
        ]
      }).sort({ completedAt: -1, createdAt: -1 }).limit(5);

      testResults.forEach((t: any) => {
        recentActivities.push({
          type: 'Test Submitted',
          description: `Test Submitted: Completed assessment "${t.testName || t.testSlug || 'Test'}" with score ${t.score ?? t.percentage ?? 0}%`,
          date: t.completedAt || t.createdAt
        });
      });
    } catch (e) {
      // ignore
    }

    try {
      const testAttempts = await TestAttempt.find({ userId, status: 'completed' }).sort({ submittedAt: -1, createdAt: -1 }).limit(5);
      testAttempts.forEach((t: any) => {
        // Only push if not already included
        const exists = recentActivities.some(a => a.type === 'Test Submitted' && Math.abs(new Date(a.date).getTime() - new Date(t.submittedAt || t.createdAt).getTime()) < 5000);
        if (!exists) {
          recentActivities.push({
            type: 'Test Submitted',
            description: `Test Submitted: Completed test attempt with score ${t.score || 0}`,
            date: t.submittedAt || t.createdAt
          });
        }
      });
    } catch (e) {
      // ignore
    }

    // Notifications Received
    try {
      const studentNotifs = await Notification.find({
        isDeleted: { $ne: true },
        $or: [
          { recipientId: userId },
          { targetAudience: { $in: ['all', 'students'] } },
          { targetType: { $in: ['All Students', 'All Users', 'all'] } },
          { targetIds: userId }
        ]
      }).sort({ createdAt: -1 }).limit(5);

      studentNotifs.forEach(n => {
        recentActivities.push({
          type: 'Notification Received',
          description: `Notification Received: ${n.title}`,
          date: n.createdAt
        });
      });
    } catch (e) {
      // ignore
    }

    // Profile or Auth Activities from ActivityLog
    try {
      const userLogs = await ActivityLog.find({
        performedBy: { $regex: new RegExp('^' + (user?.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
      }).sort({ createdAt: -1 }).limit(5);

      userLogs.forEach(l => {
        recentActivities.push({
          type: l.action === 'Profile Updated' ? 'Profile Updated' : l.action,
          description: `${l.action}: ${l.module || 'Account'} update recorded`,
          date: l.createdAt
        });
      });
    } catch (e) {
      // ignore
    }

    // Format all user enrollments with standard 5-step timeline
    const userEnrollmentsFormatted = enrollments.map((enr: any) => {
      const step = enr.admissionStep || 1;
      const isApproved = enr.status === 'Approved' || enr.approvalStatus === 'approved';
      const isRejected = enr.status === 'Rejected' || enr.approvalStatus === 'rejected' || enr.verificationStatus === 'rejected';
      const hasBatch = !!(enr.batchAssigned || (enr.batchPreference && enr.batchPreference !== 'None' && step >= 4));
      const welcomeSent = !!enr.welcomeNoticeSent || step >= 5;

      const timeline = Array.isArray(enr.timeline) && enr.timeline.length > 0 
        ? enr.timeline 
        : [
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

      return {
        _id: enr._id,
        enrollmentId: enr.enrollmentId,
        courseId: enr.courseId,
        courseName: enr.courseName,
        studentName: enr.studentName,
        status: enr.status || 'Pending',
        admissionStep: enr.admissionStep || 1,
        verificationStatus: enr.verificationStatus || 'pending',
        approvalStatus: enr.approvalStatus || 'pending',
        rejectionReason: enr.rejectionReason,
        batchPreference: enr.batchPreference,
        batchAssigned: enr.batchAssigned,
        batchStartDate: enr.batchStartDate,
        batchTiming: enr.batchTiming,
        trainerName: enr.trainerName,
        welcomeNoticeSent: !!enr.welcomeNoticeSent,
        welcomeNoticeSentAt: enr.welcomeNoticeSentAt,
        welcomeMessage: enr.welcomeMessage,
        createdAt: enr.createdAt,
        updatedAt: enr.updatedAt,
        timeline
      };
    });

    const admissionStatus = userEnrollmentsFormatted[0] || null;

    // Sort recent activities descending by date and limit to top 10
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const topActivities = recentActivities.slice(0, 10);

    res.json({
      enrolledCoursesCount: uniqueCourseCount,
      activeBatchesCount,
      upcomingBatchesCount,
      unreadNotificationsCount,
      admissionStatus,
      allEnrollments: userEnrollmentsFormatted,
      enrolledCourses,
      activeBatches,
      upcomingBatches,
      recentActivities: topActivities
    });
  } catch (error: any) {
    console.error('Error in student dashboard API:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching dashboard data' });
  }
});

export default router;
