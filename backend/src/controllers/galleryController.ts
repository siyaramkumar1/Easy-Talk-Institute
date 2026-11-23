// @ts-nocheck
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Gallery } from '../models/Gallery';
import { GalleryCategory } from '../models/GalleryCategory';
import { getIoInstance } from '../sockets/notificationSocket';
import fs from 'fs';
import path from 'path';


export const getPublicGallery = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json({ success: true, data: [] }); }
    const items = await Gallery.find({ status: { $in: ['Published', 'Active'] } }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch public gallery items' });
  }
};

export const getGallery = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { status, category, featured } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.featured = true;

    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const items = await Gallery.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gallery items' });
  }
};

export const getGalleryItem = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const item = await Gallery.findOne({ _id: req.params.id } as any).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};

import { deleteCloudinaryAsset } from '../utils/deleteCloudinaryAsset';

export const createGalleryItem = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { title, description, category, featured, displayOrder, status, imageUrl } = req.body;
    let finalImageUrl = imageUrl;
    
    // If a file was uploaded, use its path (cloudinary URL)
    if (req.file) {
      finalImageUrl = req.file.path;
      req.body.publicId = req.file.filename;
    }

    const item = new Gallery({
      title,
      description,
      category,
      featured: featured === 'true' || featured === true,
      displayOrder: Number(displayOrder) || 0,
      status: status || 'Draft',
      imageUrl: finalImageUrl,
      publicId: req.body.publicId,
      // @ts-ignore
      createdBy: req.user?.id
    });
    
    await item.save();
    getIoInstance()?.emit('galleryUpdated');
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create item' });
  }
};

export const updateGalleryItem = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { title, description, category, featured, displayOrder, status } = req.body;
    const updateData: any = { title, description, category, status };
    
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    
    if (req.file) {
      const oldItem = await Gallery.findOne({ _id: req.params.id } as any);
      if (oldItem && (oldItem.publicId || oldItem.imageUrl)) {
         await deleteCloudinaryAsset(oldItem.publicId || oldItem.imageUrl);
      }
      updateData.imageUrl = req.file.path;
      updateData.publicId = req.file.filename;
    }

    const item = await Gallery.findOneAndUpdate({ _id: req.params.id } as any, updateData, { returnDocument: 'after' });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    getIoInstance()?.emit('galleryUpdated');
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update item' });
  }
};

export const deleteGalleryItem = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const item = await Gallery.findOne({ _id: req.params.id } as any);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.publicId || item.imageUrl) {
      await deleteCloudinaryAsset(item.publicId || item.imageUrl);
    }
    await Gallery.findOneAndDelete({ _id: req.params.id } as any);
    getIoInstance()?.emit('galleryUpdated');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// Categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const categories = await GalleryCategory.find().sort({ displayOrder: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { name, displayOrder } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = new GalleryCategory({ name, slug, displayOrder: Number(displayOrder) || 0 });
    await category.save();
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const { name, displayOrder } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
    const updateData: any = {};
    if (name) { updateData.name = name; updateData.slug = slug; }
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

    const category = await GalleryCategory.findOneAndUpdate({ _id: req.params.id } as any, updateData, { returnDocument: 'after' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    await GalleryCategory.findOneAndDelete({ _id: req.params.id } as any);
    getIoInstance()?.emit('galleryUpdated');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};
