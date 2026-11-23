import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Question from '../models/Question';
import { authenticate, authorize } from '../middleware/auth';
import { extractTextFromPDF, parseQuestionsFromText, normalizeQuestionText } from '../utils/pdfQuestionParser';

const router = express.Router();

// Multer in-memory storage for handling up to 20MB PDF files cleanly without leftover temp files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  },
  fileFilter: (req, file, cb) => {
    const isPdf = 
      file.mimetype === 'application/pdf' || 
      file.originalname.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF (.pdf) files are supported'));
    }
  }
});

/**
 * POST /api/questions/import-pdf
 * Admin / SuperAdmin only
 */
export async function handlePdfImport(req: express.Request, res: express.Response) {
  try {
    const { testId, defaultDifficulty } = req.body;

    if (!testId || typeof testId !== 'string' || !testId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid test ID (slug) is required to import questions.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file was uploaded or file is empty. Please select a valid PDF file.'
      });
    }

    // 1. Extract text from PDF
    let rawText = '';
    try {
      rawText = await extractTextFromPDF(req.file.buffer);
    } catch (pdfErr: any) {
      return res.status(400).json({
        success: false,
        message: pdfErr.message || 'Unable to read or parse the uploaded PDF file. The file may be corrupted.'
      });
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No readable text could be extracted from this PDF. Please verify it contains text and not scanned images.'
      });
    }

    // 2. Parse text into structured questions
    const parseResult = parseQuestionsFromText(rawText);

    if (parseResult.totalDetected === 0 || parseResult.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions matching the supported MCQ format (Question, Options A-D, Answer) were detected in the PDF.',
        summary: {
          totalDetected: 0,
          successfullyAdded: 0,
          duplicatesFound: 0,
          questionsSkipped: parseResult.skipped.length
        },
        skippedDetails: parseResult.skipped
      });
    }

    // 3. Fetch existing questions to detect duplicates
    const existingQuestions = await Question.find({ testId: testId.trim() });
    const existingNormalizedSet = new Set<string>();

    for (const eq of existingQuestions) {
      existingNormalizedSet.add(normalizeQuestionText(eq.text));
    }

    // Track duplicates within the uploaded batch as well
    const batchSeenSet = new Set<string>();
    const questionsToInsert: any[] = [];
    let duplicatesFound = 0;

    for (const q of parseResult.questions) {
      const normalized = normalizeQuestionText(q.text);

      if (existingNormalizedSet.has(normalized) || batchSeenSet.has(normalized)) {
        duplicatesFound++;
        continue;
      }

      batchSeenSet.add(normalized);

      questionsToInsert.push({
        testId: testId.trim(),
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || defaultDifficulty || 'Medium',
        status: 'Active'
      });
    }

    // 4. Save non-duplicate questions into MongoDB
    let insertedQuestions: any[] = [];

    if (questionsToInsert.length > 0) {
      // Try using MongoDB transaction if supported
      let session: mongoose.ClientSession | null = null;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        insertedQuestions = await Question.insertMany(questionsToInsert, { session });
        await session.commitTransaction();
      } catch (txErr) {
        // Fallback for standalone MongoDB deployments where transactions are not supported
        if (session) {
          try { await session.abortTransaction(); } catch (_) {}
        }
        insertedQuestions = await Question.insertMany(questionsToInsert);
      } finally {
        if (session) {
          session.endSession();
        }
      }

      // Update total questions count on the Test model if test exists
      try {
        const TestModel = (await import('../models/Test')).Test;
        const totalCount = await Question.countDocuments({ testId: testId.trim(), status: 'Active' });
        await TestModel.findOneAndUpdate(
          { slug: testId.trim() },
          { $set: { totalQuestions: totalCount } }
        );
      } catch (updateErr) {
        console.warn('Could not update test total questions count:', updateErr);
      }
    }

    const successfullyAdded = insertedQuestions.length;
    const questionsSkipped = parseResult.skipped.length;
    const totalDetected = parseResult.totalDetected;

    return res.status(200).json({
      success: true,
      message: `PDF Import Completed: ${successfullyAdded} question(s) added successfully.`,
      summary: {
        totalDetected,
        questionsImported: successfullyAdded,
        successfullyAdded,
        duplicatesFound,
        questionsSkipped
      },
      skippedDetails: parseResult.skipped
    });

  } catch (error: any) {
    console.error('Error in handlePdfImport:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while processing PDF import'
    });
  }
}

// Multer error handling wrapper
const uploadMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.single('pdf')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file exceeds the 20MB maximum size limit.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file upload'
      });
    }
    next();
  });
};

router.post(
  '/import-pdf',
  authenticate,
  authorize(['superadmin', 'admin']),
  uploadMiddleware,
  handlePdfImport
);

export default router;
