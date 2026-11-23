// @ts-nocheck
import { getIoInstance } from '../sockets/notificationSocket';
import mongoose from "mongoose";
import { Request, Response } from 'express';
import { Testimonial } from '../models/Testimonial';
import { deleteCloudinaryAsset } from '../utils/deleteCloudinaryAsset';

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    if (!req.body.studentName || req.body.studentName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid student name' });
    }
    if (!req.body.reviewMessage || req.body.reviewMessage.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review message must be at least 5 characters' });
    }
    const data = { ...req.body, createdBy: (req as any).user?._id };
    if (req.file) {
      data.studentPhoto = {
        url: req.file.path,
        imageUrl: req.file.path,
        publicId: req.file.filename
      };
      data.imageUrl = req.file.path;
      data.publicId = req.file.filename;
    }
    const testimonial = new Testimonial(data);
    await testimonial.save();
    
    getIoInstance()?.emit('testimonialsUpdated');
    res.status(201).json({ success: true, message: 'Testimonial Added Successfully', testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed To Save Testimonial' });
  }
};

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { status, featured, verified } = req.query;
    let query: any = {};
    if (status) query.status = status;
    if (featured !== undefined) query.featured = featured === 'true';
    if (verified !== undefined) query.verified = verified === 'true';

    const testimonials = await Testimonial.find(query as any).sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.json(testimonials);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to fetch testimonials' });
  }
};

export const getTestimonial = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const testimonial = await Testimonial.findOne({ _id: req.params.id } as any).lean();
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(testimonial);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to fetch testimonial' });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const updateData = { ...req.body };
    if (req.file) {
       const oldTestimonial = await Testimonial.findOne({ _id: req.params.id } as any);
       const oldPublicId = oldTestimonial?.publicId || oldTestimonial?.studentPhoto?.publicId || oldTestimonial?.studentPhoto?.url;
       if (oldPublicId) {
          await deleteCloudinaryAsset(oldPublicId);
       }
       updateData.studentPhoto = {
         url: req.file.path,
         imageUrl: req.file.path,
         publicId: req.file.filename
       };
       updateData.imageUrl = req.file.path;
       updateData.publicId = req.file.filename;
    }
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: req.params.id } as any,
      updateData,
      { returnDocument: 'after' } as any
    );
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    
    getIoInstance()?.emit('testimonialsUpdated');
    res.json({ success: true, message: 'Testimonial Updated Successfully', testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update testimonial' });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const oldTestimonial = await Testimonial.findOne({ _id: req.params.id } as any);
    if (!oldTestimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    const publicId = oldTestimonial.publicId || oldTestimonial.studentPhoto?.publicId || oldTestimonial.studentPhoto?.url;
    if (publicId) {
       await deleteCloudinaryAsset(publicId);
    }
    await Testimonial.findOneAndDelete({ _id: req.params.id } as any);
    
    getIoInstance()?.emit('testimonialsUpdated');
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete testimonial' });
  }
};

export const updateTestimonialStatus = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { status } = req.body;
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: req.params.id } as any,
      { status },
      { returnDocument: 'after' } as any
    );
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    
    getIoInstance()?.emit('testimonialsUpdated');
    res.json({ message: 'Testimonial Published Successfully', testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

export const updateTestimonialFeature = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { featured } = req.body;
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: req.params.id } as any,
      { featured },
      { returnDocument: 'after' } as any
    );
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    getIoInstance()?.emit('testimonialsUpdated');
    res.json({ message: 'Testimonial Updated Successfully', testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to feature testimonial' });
  }
};

export const verifyTestimonialStudent = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { verified } = req.body;
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: req.params.id } as any,
      { verified },
      { returnDocument: 'after' } as any
    );
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    
    getIoInstance()?.emit('testimonialsUpdated');
    res.json({ message: 'Student Verified Successfully', testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to verify student' });
  }
};
