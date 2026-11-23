// @ts-nocheck
import { getIoInstance } from '../sockets/notificationSocket';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Batch } from '../models/Batch';
import { User } from '../models/User';
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

export const getAllBatches = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const filters: any = {};
    if (req.query.status) {
      const statusParam = String(req.query.status).trim().toLowerCase();
      if (['active', 'upcoming', 'completed'].includes(statusParam)) {
        filters.status = new RegExp(`^${statusParam}$`, 'i');
      }
    }
    const batches = await Batch.find(filters).populate('course', 'title').sort({ startDate: 1 }).lean();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching batches' });
  }
};

export const getPublicBatches = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const filters: any = {};
    if (req.query.status) {
      const statusParam = String(req.query.status).trim().toLowerCase();
      if (['active', 'upcoming', 'completed'].includes(statusParam)) {
        filters.status = new RegExp(`^${statusParam}$`, 'i');
      } else {
        filters.status = { $in: ['Upcoming', 'Active', 'Completed'] };
      }
    } else {
      filters.status = { $in: ['Upcoming', 'Active', 'Completed'] };
    }
    const batches = await Batch.find(filters).populate('course', 'title').sort({ startDate: 1 }).lean();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching public batches' });
  }
};

export const getBatchById = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const batch = await Batch.findById(req.params.id).populate('course');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    getIoInstance()?.emit('batchesUpdated');
    res.json(batch);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching batch' });
  }
};

export const createBatch = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { startDate, endDate, startTime, endTime, name } = req.body;
    
    const existingBatch = await Batch.findOne({ name: new RegExp('^' + name + '$', 'i') });
    if (existingBatch) {
      return res.status(400).json({ success: false, message: 'A batch with this name already exists' });
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }
    
    const timing = `${startTime} - ${endTime}`;
    
    const batchCode = 'BAT-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const batchData = {
      ...req.body,
      timing,
      enrolledStudents: 0,
      batchCode
    };

    if (req.file) {
      batchData.thumbnail = {
        url: req.file.path,
        imageUrl: req.file.path,
        publicId: req.file.filename
      };
      batchData.imageUrl = req.file.path;
      batchData.publicId = req.file.filename;
    } else if (req.body.defaultThumbnail === 'true') {
      batchData.thumbnail = {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        publicId: ''
      };
      batchData.imageUrl = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644';
      batchData.publicId = '';
    } else {
      return res.status(400).json({ success: false, message: 'Batch thumbnail is required' });
    }

    const newBatch = new Batch(batchData);
    await newBatch.save();
    
    await logActivity('Batch Created', 'Batches', req);
    
    getIoInstance()?.emit('batchesUpdated');
    
    const populated = await newBatch.populate('course', 'title');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating batch' });
  }
};

export const updateBatch = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { startDate, endDate, startTime, endTime } = req.body;
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const updateData = { ...req.body };
    if (startTime && endTime) {
      updateData.timing = `${startTime} - ${endTime}`;
    }

    if (req.file) {
      const oldPublicId = batch.thumbnail?.publicId || batch.publicId || batch.thumbnail?.url;
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
      const oldPublicId = batch.thumbnail?.publicId || batch.publicId || batch.thumbnail?.url;
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

    const updatedBatch = await Batch.findOneAndUpdate({ _id: req.params.id } as any, updateData, { returnDocument: 'after' }).populate('course', 'title');
    
    await logActivity('Batch Updated', 'Batches', req);
    
    getIoInstance()?.emit('batchesUpdated');
    
    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating batch' });
  }
};

export const deleteBatch = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    
    const publicId = batch.thumbnail?.publicId || batch.publicId || batch.thumbnail?.url;
    if (publicId) {
      await deleteCloudinaryAsset(publicId);
    }

    await batch.deleteOne();
    await logActivity('Batch Deleted', 'Batches', req);
    
    getIoInstance()?.emit('batchesUpdated');
    res.json({ message: 'Batch deleted successfully', deleted: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting batch' });
  }
};

export const getHomeBatchesStats = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { 
      return res.json({ studentsLearning: 0, activeCount: 0, upcomingCount: 0, completedCount: 0 }); 
    }
    
    const studentsLearning = await User.countDocuments({ role: { $in: ['student', 'user'] } });
    const activeCount = await Batch.countDocuments({ status: { $regex: /^active$/i } });
    const upcomingCount = await Batch.countDocuments({ status: { $regex: /^upcoming$/i } });
    const completedCount = await Batch.countDocuments({ status: { $regex: /^completed$/i } });
    
    res.json({ studentsLearning, activeCount, upcomingCount, completedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching batch stats' });
  }
};
