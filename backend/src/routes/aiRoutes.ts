import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

/**
 * Helper to safely verify whether Gemini API key is configured
 * Never calls GCP IAM GenerateAccessToken to avoid 401 Unauthorized errors
 */
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * GET /api/ai/status
 * Diagnostic endpoint for AI features
 */
router.get('/status', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');

  res.json({
    status: 'ok',
    configured,
    provider: 'Google Gemini API',
    model: 'gemini-2.5-flash',
    capabilities: ['spoken_english_feedback', 'grammar_analysis', 'chat_practice'],
    authMode: 'API_KEY', // Explains that API Key auth is used instead of IAM GenerateAccessToken
  });
});

/**
 * POST /api/ai/practice
 * Conversational English and speaking practice
 */
router.post('/practice', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        message: 'Google Gemini AI is not configured. Please set GEMINI_API_KEY in the environment secrets.',
      });
    }

    const { message, topic, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const systemInstruction = `You are a supportive, expert English teacher at Easy Talk Institute LMS. 
Your goal is to help students build confidence in conversational English. 
When replying to a student:
1. Provide a natural, engaging conversation response.
2. In a polite "Feedback" section, gently point out any grammar, pronunciation tip, or vocabulary upgrade.
3. Keep your response encouraging, concise, and easy to read. Topic: ${topic || 'General Conversation'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Keep practicing! Your English is improving every day.';

    return res.json({
      success: true,
      reply,
      model: 'gemini-2.5-flash',
    });
  } catch (error: any) {
    console.error('Error in Gemini AI practice endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error communicating with Google Gemini API',
    });
  }
});

/**
 * POST /api/ai/analyze-grammar
 * Grammatical correction and vocabulary enhancement
 */
router.post('/analyze-grammar', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        message: 'Google Gemini AI is not configured. Please set GEMINI_API_KEY in the environment secrets.',
      });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Text to analyze is required' });
    }

    const prompt = `Analyze this student English sentence or paragraph:
"${text}"

Provide:
1. Corrected Version (flawless, natural English).
2. Grammar & Vocabulary Explanations (bullet points).
3. CEFR Level estimation (A1, A2, B1, B2, C1, or C2).
4. Encouragement note from Easy Talk Institute.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error('Error in Gemini AI grammar analysis:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing grammar with Google Gemini API',
    });
  }
});

export default router;
