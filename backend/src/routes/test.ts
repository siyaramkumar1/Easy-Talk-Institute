// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import Question from '../models/Question';
import TestResult from '../models/TestResult';
import TestAttempt from '../models/TestAttempt';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, authorize } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get the current active attempt or create a new one
router.get('/attempt/:slug', authenticate, async (req, res) => {
  try {
    
    const { slug } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const TestModel = (await import('../models/Test')).Test;
    const testDef = await TestModel.findOne({ slug });
    if (!testDef) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if there is an in-progress attempt
    let attempt = await TestAttempt.findOne({ userId, testSlug: slug, status: 'in_progress', expiresAt: { $gt: new Date() } } as any);

    if (!attempt) {
      // Find past attempts to increment attempt number
      const pastAttempts = await TestAttempt.countDocuments({ userId, testSlug: slug });
      
      // Get random questions for this test
      const questionCount = testDef.totalQuestions > 0 ? testDef.totalQuestions : 30;
      const questions = await Question.aggregate([
        { $match: { testId: slug, status: 'Active' } },
        { $sample: { size: questionCount } }
      ]);
      
      const clientQuestions = questions.map(q => ({
        _id: q._id,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        difficulty: q.difficulty
      }));

      const durationMins = testDef.duration || 15;
      const expiresAt = new Date(Date.now() + durationMins * 60000);

      attempt = new TestAttempt({
        userId,
        testSlug: slug,
        attemptNumber: pastAttempts + 1,
        questions: clientQuestions,
        answers: {},
        expiresAt
      });
      await attempt.save();
    }


    res.json({
      attemptId: attempt._id,
      questions: attempt.questions,
      answers: attempt.answers,
      expiresAt: attempt.expiresAt,
      testTitle: testDef.title,
      duration: testDef.duration || 15
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-save answers
router.post('/save/:attemptId', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    await (TestAttempt as any).findOneAndUpdate({ _id: attemptId, userId, status: 'in_progress' } as any,
      { $set: { answers } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit test
router.post('/submit/:attemptId', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, testName } = req.body;
    // @ts-ignore
    const userId = req.user.id;
    
    // Fetch user details from DB
    const User = (await import('../models/User')).User;
    
    let userName = 'Unknown User';
    let email = 'unknown@example.com';
    
    try {
      if (userId !== 'mock') {
        const user = await User.findById(userId);
        if (user) {
          userName = user.name;
          email = user.email;
        }
      } else {
        userName = 'Mock User';
        email = 'mock@example.com';
      }
    } catch (err) {
      console.warn("Could not fetch user:", err);
    }
    
    if (!userName || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and Email are required"
      });
    }

    const attempt = await TestAttempt.findOne({ _id: attemptId, userId } as any);
    
    if (!attempt || attempt.status === 'completed') {
      return res.status(400).json({ message: 'Invalid or already submitted attempt' });
    }

    // Calculate score by fetching full questions
    const questionIds = attempt.questions.map(q => q._id);
    const fullQuestions = await Question.find({ _id: { $in: questionIds } } as any);
    
    let correct = 0;
    let wrong = 0;

    for (const q of fullQuestions) {
      const qId = q._id.toString();
      const answer = answers[qId];
      if (answer) {
        if (answer === q.correctAnswer) {
          correct++;
        } else {
          wrong++;
        }
      } else {
        wrong++; // Unanswered count as wrong
      }
    }

    const total = attempt.questions.length || 30;
    const attemptedCount = Object.keys(answers || {}).length;
    const skippedCount = Math.max(0, total - attemptedCount);
    const percentage = Math.round((correct / total) * 100);
    
    let level = 'Beginner';
    if (percentage >= 80) level = 'Advanced';
    else if (percentage >= 60) level = 'Intermediate';

    const passed = percentage >= 60;

    attempt.status = 'completed';
    attempt.score = correct;
    attempt.submittedAt = new Date();
    attempt.answers = answers;
    await attempt.save();

    const result = new TestResult({
      userId,
      userName,
      email,
      testName: testName || attempt.testSlug || 'English Assessment Test',
      testSlug: attempt.testSlug,
      totalQuestions: total,
      attemptedQuestions: attemptedCount,
      skippedAnswers: skippedCount,
      score: correct,
      correctAnswers: correct,
      wrongAnswers: wrong,
      percentage,
      level,
      passed,
      completedAt: new Date()
    });
    await result.save();

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-results', authenticate, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const results = await TestResult.find({ userId } as any).sort({ completedAt: -1, createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch specific test result by ID with fallback to student's latest result
router.get('/results/:id', authenticate, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: 'Database disconnected' });
    }

    let result = null;
    if (id && id !== 'latest' && mongoose.isValidObjectId(id)) {
      result = await TestResult.findOne({ _id: id, userId } as any);
      if (!result) {
        result = await TestResult.findById(id);
      }
    }

    if (!result) {
      // Fallback: Fetch latest result of this student
      result = await TestResult.findOne({ userId } as any).sort({ completedAt: -1, createdAt: -1 });
    }

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Fetch result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    if (id === 'my-results' || id === 'admin' || id === 'attempt' || id === 'save' || id === 'submit') {
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: 'Database disconnected' });
    }

    let result = null;
    if (id && id !== 'latest' && mongoose.isValidObjectId(id)) {
      result = await TestResult.findOne({ _id: id, userId } as any);
      if (!result) {
        result = await TestResult.findById(id);
      }
    }

    if (!result) {
      result = await TestResult.findOne({ userId } as any).sort({ completedAt: -1, createdAt: -1 });
    }

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Fetch result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Routes for Question Bank CRUD
router.get('/admin/questions', authenticate, authorize(['superadmin', 'admin']), async (req, res) => {
  try {
    const filter = req.query.testId ? { testId: req.query.testId } : {};
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const questions = await Question.find(filter as any).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/admin/questions', authenticate, authorize(['superadmin', 'admin']), async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/questions/:id', authenticate, authorize(['superadmin', 'admin']), async (req, res) => {
  try {
    const question = await (Question as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' } as any);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/questions/:id', authenticate, authorize(['superadmin', 'admin']), async (req, res) => {
  try {
    await (Question as any).findByIdAndDelete(req.params.id as any);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

import multer from 'multer';
import { handlePdfImport } from './questionRoutes';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post(
  '/admin/questions/import-pdf',
  authenticate,
  authorize(['superadmin', 'admin']),
  memoryUpload.single('pdf'),
  handlePdfImport
);

// Admin Get All Results
router.get('/admin/results', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    const results = await TestResult.find({}).sort({ completedAt: -1 }).populate('userId', 'name email');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Single result deletion handler
const handleDeleteSingleResult = async (req: express.Request, res: express.Response) => {
  try {
    const targetId = req.params.resultId || req.params.id;

    if (!targetId || !mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid result ID' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, message: 'Database disconnected' });
    }

    const result = await TestResult.findById(targetId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Test result not found or already deleted' });
    }

    const studentName = result.userName || 'Student';
    const testTitle = result.testName || result.testSlug || 'Assessment Test';

    // Permanently remove from database (no soft delete)
    await TestResult.findByIdAndDelete(targetId);

    // Audit Logging
    try {
      const adminUser = await User.findById(req.user?.id);
      const adminName = adminUser?.name || 'Administrator';
      await ActivityLog.create({
        action: `Admin ${adminName} deleted ${testTitle} result of student ${studentName}`,
        module: 'Assessment Results',
        performedBy: adminName,
        role: req.user?.role || 'admin',
        ip: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log test result deletion:', logErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Test Result Deleted Successfully'
    });
  } catch (error: any) {
    console.error('Delete test result error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting test result'
    });
  }
};

// Bulk result deletion handler
const handleBulkDeleteResults = async (req: express.Request, res: express.Response) => {
  try {
    const { ids, resultIds } = req.body;
    const rawIds = resultIds || ids;

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one result ID to delete' });
    }

    const validIds = rawIds.filter((id: string) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid result IDs provided' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, message: 'Database disconnected' });
    }

    const existingResults = await TestResult.find({ _id: { $in: validIds } });
    if (!existingResults.length) {
      return res.status(404).json({ success: false, message: 'Selected test results not found or already deleted' });
    }

    const deleteOp = await TestResult.deleteMany({ _id: { $in: validIds } });

    // Audit Logging
    try {
      const adminUser = await User.findById(req.user?.id);
      const adminName = adminUser?.name || 'Administrator';
      await ActivityLog.create({
        action: `Admin ${adminName} bulk deleted ${deleteOp.deletedCount} test results`,
        module: 'Assessment Results',
        performedBy: adminName,
        role: req.user?.role || 'admin',
        ip: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log bulk delete activity:', logErr);
    }

    return res.status(200).json({
      success: true,
      message: `${deleteOp.deletedCount} test results deleted successfully`,
      deletedCount: deleteOp.deletedCount
    });
  } catch (error: any) {
    console.error('Bulk delete test results error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting test results'
    });
  }
};

// API: Single result delete
router.delete('/admin/results/:id', authenticate, authorize(['admin', 'superadmin']), handleDeleteSingleResult);
router.delete('/:resultId', authenticate, authorize(['admin', 'superadmin']), async (req, res, next) => {
  const { resultId } = req.params;
  if (!mongoose.isValidObjectId(resultId)) {
    return next();
  }
  return handleDeleteSingleResult(req, res);
});

// API: Bulk delete
router.post('/admin/results/bulk-delete', authenticate, authorize(['admin', 'superadmin']), handleBulkDeleteResults);
router.post('/bulk-delete', authenticate, authorize(['admin', 'superadmin']), handleBulkDeleteResults);
router.delete('/bulk-delete', authenticate, authorize(['admin', 'superadmin']), handleBulkDeleteResults);

export default router;
