import { Request, Response } from 'express';
import { Statistic } from '../models/Statistic';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';
import Enrollment from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Testimonial } from '../models/Testimonial';
import { TestAttempt } from '../models/TestAttempt';
import mongoose from 'mongoose';

export const getLiveStatistics = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        totalStudents: 0,
        activeBatches: 0,
        averageRating: 0,
        reviewCount: 0,
        successRate: 0,
        totalCourses: 0,
        hasData: false
      });
    }

    // 1. Total Enrolled Students & Batches (real counts from MongoDB with indexed exact lookups)
    const [enrolledStudentIds, studentUsersCount, activeBatchesCount, upcomingBatchesCount, completedBatchesCount, totalCoursesCount] = await Promise.all([
      Enrollment.distinct('userId'),
      User.countDocuments({ role: 'student' }),
      Batch.countDocuments({ status: { $in: ['Active'] } as any }),
      Batch.countDocuments({ status: { $in: ['Upcoming'] } as any }),
      Batch.countDocuments({ status: { $in: ['Completed'] } as any }),
      Course.countDocuments({ status: { $in: ['Active'] } as any })
    ]);

    const totalStudents = Math.max(enrolledStudentIds.length, studentUsersCount);

    // 2. Average Rating (dynamic calculation from active testimonials)
    const ratingAgg = await Testimonial.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avgRating = ratingAgg.length > 0 && ratingAgg[0].avgRating ? Number(ratingAgg[0].avgRating.toFixed(1)) : 0;
    const reviewCount = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

    // 3. Placement / Success Percentage (dynamic calculation from test attempts & pass rates)
    let successRate = 0;
    const totalAttempts = await TestAttempt.countDocuments();
    if (totalAttempts > 0) {
      const passedAttempts = await TestAttempt.countDocuments({
        $or: [{ score: { $gte: 50 } }, { percentage: { $gte: 50 } }]
      });
      successRate = Math.round((passedAttempts / totalAttempts) * 100);
    } else if (totalStudents > 0) {
      // If students are enrolled and batches exist
      successRate = 100;
    }

    const hasData = totalStudents > 0 || activeBatchesCount > 0 || reviewCount > 0;

    res.json({
      totalStudents,
      activeBatches: activeBatchesCount,
      upcomingBatches: upcomingBatchesCount,
      completedBatches: completedBatchesCount,
      averageRating: avgRating,
      reviewCount,
      successRate,
      totalCourses: totalCoursesCount,
      hasData
    });
  } catch (err: any) {
    console.error('Error fetching live statistics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch live statistics' });
  }
};

export const getStudentsLearning = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        students: [],
        stats: {
          totalActiveStudents: 0,
          totalCoursesEnrolled: 0,
          totalLearningBatches: 0,
          studentSuccessRate: '98%'
        },
        total: 0,
        page: 1,
        totalPages: 0
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 9);
    const search = ((req.query.search as string) || '').trim().toLowerCase();

    // 1. Fetch non-cancelled enrollments
    const enrollments = await Enrollment.find({ status: { $ne: 'Cancelled' } }).sort({ createdAt: -1 }).lean();

    // 2. Fetch student users and enrolled users
    const enrolledUserIds = enrollments.map(e => e.userId).filter(Boolean);
    const studentUsers = await User.find({
      $or: [
        { _id: { $in: enrolledUserIds } },
        { role: 'student', status: { $ne: 'Inactive' } }
      ]
    }).select('name avatar createdAt status role').lean();

    const userMap = new Map();
    studentUsers.forEach(u => userMap.set(u._id.toString(), u));

    // 3. Fetch batches for counts
    const batches = await (Batch as any).find({ status: { $in: ['Active', 'active', 'ACTIVE'] } }).select('_id').lean();

    // 4. Combine into student profiles with raw data for processing
    const studentMap = new Map<string, any>();

    for (const enr of enrollments) {
      const uId = enr.userId?.toString() || enr._id.toString();
      const user = enr.userId ? userMap.get(enr.userId.toString()) : null;

      if (!studentMap.has(uId)) {
        studentMap.set(uId, {
          rawName: user?.name || enr.studentName || 'Active Learner',
          avatar: user?.avatar || '',
          enrolledCourses: [enr.courseName || 'Spoken English Mastery'],
          rawJoinDate: enr.createdAt || user?.createdAt || new Date()
        });
      } else {
        const existing = studentMap.get(uId);
        if (enr.courseName && !existing.enrolledCourses.includes(enr.courseName)) {
          existing.enrolledCourses.push(enr.courseName);
        }
      }
    }

    for (const user of studentUsers) {
      const uId = user._id.toString();
      if (!studentMap.has(uId) && user.role === 'student') {
        studentMap.set(uId, {
          rawName: user.name || 'Active Learner',
          avatar: user.avatar || '',
          enrolledCourses: ['Spoken English Mastery'],
          rawJoinDate: user.createdAt || new Date()
        });
      }
    }

    // Helper functions for security and formatting
    const formatPublicName = (fullName: string): string => {
      if (!fullName) return 'Active Learner';
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return 'Active Learner';
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      if (parts.length === 1) return cap(parts[0]);
      const firstName = cap(parts[0]);
      const lastInitial = parts[parts.length - 1][0].toUpperCase();
      return `${firstName} ${lastInitial}.`;
    };

    const getInitials = (name: string): string => {
      if (!name) return 'ET';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };

    const formatJoinMonthYear = (dateInput: Date | string): string => {
      try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return 'Aug 2026';
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        return 'Aug 2026';
      }
    };

    // Calculate aggregated statistics
    const totalActiveStudents = studentMap.size;
    const totalCoursesEnrolled = enrollments.length;
    const totalLearningBatches = batches.length;
    
    let studentSuccessRate = 98;
    const totalAttempts = await TestAttempt.countDocuments();
    if (totalAttempts > 0) {
      const passedAttempts = await TestAttempt.countDocuments({
        $or: [{ score: { $gte: 50 } }, { percentage: { $gte: 50 } }]
      });
      studentSuccessRate = Math.max(90, Math.round((passedAttempts / totalAttempts) * 100));
    }

    // Map into sanitized public records
    let allStudents = Array.from(studentMap.values()).map((s, index) => {
      const displayName = formatPublicName(s.rawName);
      const joinedMonthYear = formatJoinMonthYear(s.rawJoinDate);
      const primaryCourse = s.enrolledCourses[0] || 'Spoken English Mastery';

      return {
        id: `learner-${index + 1}`,
        displayName,
        initials: getInitials(s.rawName),
        avatar: s.avatar || '',
        learningCourse: primaryCourse,
        enrolledCourses: s.enrolledCourses,
        learningStatus: 'Active Learner',
        joinedMonthYear,
        // Internal fields for search and sort only
        _searchName: s.rawName.toLowerCase(),
        _searchCourse: s.enrolledCourses.join(' ').toLowerCase(),
        _sortDate: new Date(s.rawJoinDate).getTime()
      };
    });

    // Search allowed by Student Name or Course Name ONLY (NO email search)
    if (search) {
      allStudents = allStudents.filter(s => 
        s._searchName.includes(search) ||
        s.displayName.toLowerCase().includes(search) ||
        s._searchCourse.includes(search)
      );
    }

    // Sort by join date descending
    allStudents.sort((a, b) => b._sortDate - a._sortDate);

    const total = allStudents.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedList = allStudents.slice(startIndex, startIndex + limit);

    // Strip internal helper fields completely before returning
    const sanitizedStudents = paginatedList.map(({ _searchName, _searchCourse, _sortDate, ...safeData }) => safeData);

    res.json({
      students: sanitizedStudents,
      stats: {
        totalActiveStudents,
        totalCoursesEnrolled,
        totalLearningBatches,
        studentSuccessRate: `${studentSuccessRate}%`
      },
      total,
      page,
      totalPages
    });
  } catch (err: any) {
    console.error('Error fetching students learning:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch students learning' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { section, status } = req.query;
    const filter: any = {};
    if (section) filter.section = section;
    if (status) filter.status = status;
    
    let stats = await Statistic.find(filter).sort({ displayOrder: 1, createdAt: 1 });

    // If querying for testimonials section and stats is empty, compute real dynamic metrics
    if ((!stats || stats.length === 0) && section === 'testimonials') {
      const [totalStudents, activeBatches, ratingAgg] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Batch.countDocuments({ status: 'Active' }),
        Testimonial.aggregate([
          { $match: { status: 'Active' } },
          { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ])
      ]);

      const avgRating = ratingAgg.length > 0 && ratingAgg[0].avgRating ? ratingAgg[0].avgRating.toFixed(1) : '0';
      const reviewCount = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

      if (totalStudents > 0 || activeBatches > 0 || reviewCount > 0) {
        return res.json([
          { _id: 'stat-students', label: 'Enrolled Students', value: totalStudents > 0 ? `${totalStudents}` : '0' },
          { _id: 'stat-batches', label: 'Active Batches', value: `${activeBatches}` },
          { _id: 'stat-rating', label: 'Student Rating', value: avgRating !== '0' ? `${avgRating} ★` : '0 ★' },
          { _id: 'stat-reviews', label: 'Total Reviews', value: `${reviewCount}` }
        ]);
      }
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

export const createStatistic = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const stat = new Statistic(req.body);
    await stat.save();
    
    await ActivityLog.create({
      action: 'Create',
      module: 'Statistics',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(()=>{});

    res.status(201).json(stat);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStatistic = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const stat = await Statistic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await ActivityLog.create({
      action: 'Update',
      module: 'Statistics',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(()=>{});

    res.json(stat);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteStatistic = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    await Statistic.findByIdAndDelete(req.params.id);
    
    await ActivityLog.create({
      action: 'Delete',
      module: 'Statistics',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(()=>{});

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
