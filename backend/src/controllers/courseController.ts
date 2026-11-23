// @ts-nocheck
import { getIoInstance } from '../sockets/notificationSocket';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Course } from '../models/Course';
import Enrollment from '../models/Enrollment';
import { deleteCloudinaryAsset } from '../utils/deleteCloudinaryAsset';
import { ActivityLog } from '../models/ActivityLog';

const logActivity = async (action: string, module: string, req: Request) => {
  try {
    if (mongoose.connection.readyState !== 1) { return; }
    await ActivityLog.create({
      action,
      module,
      performedBy: req.user?.name || 'Unknown',
      role: req.user?.role || 'Unknown',
      ip: req.ip
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const status = req.query.status as string;
    let filter: any = {};
    if (status) {
      if (status.toLowerCase() !== 'all') {
        const statusArray = status.split(',').map(s => new RegExp('^' + s.trim() + '$', 'i'));
        filter = { status: { $in: statusArray } };
      }
    } else {
      // Default for public queries: Return ONLY Active courses
      filter = { status: { $in: ['Active', 'active'] } };
    }
    
    const courses = await Course.find(filter as any).sort({ createdAt: -1 }).lean();
    
    // Batch aggregate enrollment counts in a single query to eliminate N+1 query bottlenecks
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { 
        $group: { 
          _id: { 
            courseId: '$courseId', 
            courseName: { $toLower: '$courseName' } 
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const countMap = new Map<string, number>();
    for (const ec of enrollmentCounts) {
      if (ec._id?.courseId) {
        const k = String(ec._id.courseId).toLowerCase();
        countMap.set(k, (countMap.get(k) || 0) + ec.count);
      }
      if (ec._id?.courseName) {
        const k = String(ec._id.courseName).toLowerCase();
        countMap.set(k, (countMap.get(k) || 0) + ec.count);
      }
    }

    const enriched = courses.map((c: any) => {
      const idKey = String(c._id).toLowerCase();
      const slugKey = String(c.slug || '').toLowerCase();
      const titleKey = String(c.title || '').toLowerCase();

      const count = Math.max(
        countMap.get(idKey) || 0,
        countMap.get(slugKey) || 0,
        countMap.get(titleKey) || 0
      );

      return {
        ...c,
        enrolledStudents: Math.max(c.enrolledStudents || 0, count)
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

export const getCourseByIdOrSlug = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { id } = req.params;
    
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let course;
    if (isObjectId) {
      course = await Course.findOne({ _id: id } as any).lean();
    } else {
      course = await Course.findOne({ slug: id } as any).lean();
    }
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching course' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    
    const existingCourse = await Course.findOne({ title: new RegExp('^' + req.body.title + '$', 'i') });
    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'A course with this title already exists' });
    }
   
    const courseData = { ...req.body };
    if (!courseData.slug) {
      courseData.slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (req.file) {
      courseData.thumbnail = {
        url: req.file.path,
        imageUrl: req.file.path,
        publicId: req.file.filename
      };
      courseData.imageUrl = req.file.path;
      courseData.publicId = req.file.filename;
    } else if (req.body.defaultThumbnail === 'true') {
      courseData.thumbnail = {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        publicId: ''
      };
      courseData.imageUrl = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644';
      courseData.publicId = '';
    } else {
      return res.status(400).json({ success: false, message: 'Course thumbnail is required' });
    }

    const course = new Course(courseData);
    await course.save();
   
    await logActivity('Course Created', 'Courses', req);
   
    getIoInstance()?.emit('coursesUpdated');
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error creating course' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const updateData = { ...req.body };

    if (req.file) {
      const oldPublicId = course.thumbnail?.publicId || course.publicId || course.thumbnail?.url;
      if (oldPublicId) {
        await deleteCloudinaryAsset(oldPublicId);
      }
      updateData.thumbnail = {
        url: req.file.path,
        imageUrl: req.file.path,
        publicId: req.file.filename
      };
      updateData.imageUrl = req.file.path;
      updateData.publicId = req.file.filename;
    } else if (req.body.defaultThumbnail === 'true') {
      const oldPublicId = course.thumbnail?.publicId || course.publicId || course.thumbnail?.url;
      if (oldPublicId) {
        await deleteCloudinaryAsset(oldPublicId);
      }
      updateData.thumbnail = {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        publicId: ''
      };
      updateData.imageUrl = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644';
      updateData.publicId = '';
    }

    const updatedCourse = await Course.findOneAndUpdate({ _id: id } as any, updateData, { returnDocument: 'after', runValidators: true });
   
    await logActivity('Course Updated', 'Courses', req);

    getIoInstance()?.emit('coursesUpdated');

    res.json(updatedCourse);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating course' });
  }
};

export const updateCourseStatus = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { id } = req.params;
    const { status } = req.body;
    const course = await Course.findOneAndUpdate({ _id: id } as any, { status }, { returnDocument: 'after' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
   
    await logActivity('Course Status Changed', 'Courses', req);
   
    getIoInstance()?.emit('coursesUpdated');
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating status' });
  }
};

export const updateCourseFeature = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { id } = req.params;
    const { featured } = req.body;
    const course = await Course.findOneAndUpdate({ _id: id } as any, { featured }, { returnDocument: 'after' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    getIoInstance()?.emit('coursesUpdated');
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating feature' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const publicId = course.thumbnail?.publicId || course.publicId || course.thumbnail?.url;
    if (publicId) {
      await deleteCloudinaryAsset(publicId);
    }

    await course.deleteOne();
   
    await logActivity('Course Deleted', 'Courses', req);
   
    getIoInstance()?.emit('coursesUpdated');
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting course' });
  }
};
