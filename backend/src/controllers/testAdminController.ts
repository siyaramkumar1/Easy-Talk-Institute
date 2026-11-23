// @ts-nocheck
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Test } from '../models/Test';

export const getAllTests = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([
        {
          _id: 'mock_test_1',
          title: 'General English Assessment',
          slug: 'general-english',
          description: 'A comprehensive test of grammar, vocabulary, and reading comprehension.',
          duration: 30,
          totalQuestions: 50,
          category: 'Assessment',
          difficulty: 'Intermediate',
          status: 'Published'
        }
      ]);
    }
    const tests = await Test.find({}).sort({ displayOrder: 1, createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tests' });
  }
};

export const getTestById = async (req: Request, res: Response) => {
  try {
    const test = await Test.findOne(req.params.id as any);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching test' });
  }
};

export const createTest = async (req: Request, res: Response) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTest = async (req: Request, res: Response) => {
  try {
    const test = await Test.findOneAndUpdate(req.params.id as any, req.body, { returnDocument: 'after', runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json(test);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTest = async (req: Request, res: Response) => {
  try {
    const test = await Test.findOneAndDelete(req.params.id as any);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting test' });
  }
};
