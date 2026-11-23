import mongoose from 'mongoose';

export interface ParsedQuestion {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SkippedItem {
  index: number;
  reason: string;
  rawPreview?: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  skipped: SkippedItem[];
  totalDetected: number;
}

/**
 * Extracts raw text from a PDF Buffer using pdf-parse (supports v1 & v2 interfaces)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import('pdf-parse');
    
    // v2 class-based interface
    if ((pdfModule as any).PDFParse) {
      const parser = new (pdfModule as any).PDFParse({ data: buffer });
      const textResult = await parser.getText();
      return textResult.text || '';
    }

    // v1 function-based interface
    if (typeof (pdfModule as any).default === 'function') {
      const data = await (pdfModule as any).default(buffer);
      return data.text || '';
    }

    if (typeof pdfModule === 'function') {
      const data = await (pdfModule as any)(buffer);
      return data.text || '';
    }

    throw new Error('Could not find compatible PDF parsing function');
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    throw new Error(`Failed to read PDF document: ${err.message || 'Corrupted or unreadable PDF'}`);
  }
}

/**
 * Parses raw text extracted from PDF into structured MCQ questions
 */
export function parseQuestionsFromText(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { questions: [], skipped: [], totalDetected: 0 };
  }

  // Normalize line breaks
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into question blocks
  const lines = text.split('\n');
  const rawBlocks: string[] = [];
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push(line);
      continue;
    }

    // Markers indicating a new question
    const isNewQuestion = 
      /^(?:(?:Q(?:uestion)?\.?\s*\d+[\.:\)\-]?)|(?:\d+[\.:\)\-]))\s+/i.test(trimmed) ||
      /^Question\s*\d*\s*[:\-]/i.test(trimmed) ||
      /^Q\s*\d*\s*[:\-]/i.test(trimmed);

    if (isNewQuestion && currentLines.length > 0) {
      const blockStr = currentLines.join('\n').trim();
      if (blockStr) {
        rawBlocks.push(blockStr);
      }
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const blockStr = currentLines.join('\n').trim();
    if (blockStr) {
      rawBlocks.push(blockStr);
    }
  }

  const validQuestions: ParsedQuestion[] = [];
  const skippedList: SkippedItem[] = [];

  let questionIndex = 0;

  for (const block of rawBlocks) {
    // Check if this block looks like a question or just header/instructions
    const hasOptions = /(?:[A-Da-d][\.\)\:\-]\s*|\([A-Da-d]\))/i.test(block);
    const hasAnswer = /(?:Answer|Ans|Key|Correct\s+Answer|Correct\s+Option)\s*[:\-]?/i.test(block);

    // If block has neither options nor answer, it might be intro/instructions, skip without counting as a failed question
    if (!hasOptions && !hasAnswer) {
      continue;
    }

    questionIndex++;

    // 1. Extract Correct Answer
    let correctAnswer: 'A' | 'B' | 'C' | 'D' | null = null;
    let contentWithoutAns = block;

    const ansRegex = /(?:(?:Correct\s+)?(?:Answer|Ans|Key|Opt(?:ion)?)\s*[:\-=\s]\s*(?:\n\s*)?(?:[\(\[]?([A-Da-d])[\)\]]?|option\s*([A-Da-d]))(?:\s*[\.\)]|\s+[^\n]*)?)/i;
    const ansMatch = block.match(ansRegex);

    if (ansMatch) {
      const letter = (ansMatch[1] || ansMatch[2] || '').toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(letter)) {
        correctAnswer = letter as 'A' | 'B' | 'C' | 'D';
      }
      contentWithoutAns = block.replace(ansMatch[0], '');
    }

    // 2. Extract Difficulty (if present)
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    const diffMatch = block.match(/(?:difficulty|level)\s*[:\-]?\s*(Easy|Medium|Hard)/i);
    if (diffMatch) {
      const d = diffMatch[1].toLowerCase();
      if (d === 'easy') difficulty = 'Easy';
      else if (d === 'hard') difficulty = 'Hard';
      else difficulty = 'Medium';
      contentWithoutAns = contentWithoutAns.replace(diffMatch[0], '');
    }

    // 3. Extract Options
    // Regex matches A. / A) / (A) / A: etc.
    const optRegex = /(?:^|\s|\n)(?:\(?([A-Da-d])[\.\)\:\-]\s*|\(([A-Da-d])\)\s*)([\s\S]*?)(?=(?:(?:\s|\n)(?:\(?[A-Da-d][\.\)\:\-]\s*|\([A-Da-d]\)\s*))|$)/gi;
    const matches = [...contentWithoutAns.matchAll(optRegex)];
    const optionsMap: Record<string, string> = {};

    for (const m of matches) {
      const letter = (m[1] || m[2] || '').toUpperCase();
      const optText = (m[3] || '').trim();
      if (letter && ['A', 'B', 'C', 'D'].includes(letter) && !optionsMap[letter]) {
        optionsMap[letter] = optText;
      }
    }

    const cleanOpt = (opt?: string) => (opt || '').replace(/\s+/g, ' ').replace(/[;,\.]$/, '').trim();

    const optionA = cleanOpt(optionsMap['A']);
    const optionB = cleanOpt(optionsMap['B']);
    const optionC = cleanOpt(optionsMap['C']);
    const optionD = cleanOpt(optionsMap['D']);

    // 4. Extract Question Text
    let questionText = contentWithoutAns;
    if (matches.length > 0 && matches[0].index !== undefined) {
      questionText = contentWithoutAns.substring(0, matches[0].index).trim();
    }

    // Clean question statement
    questionText = questionText
      .replace(/^\s*(?:(?:Q(?:uestion)?\.?\s*\d+[\.:\)\-]?)|(?:\d+[\.:\)\-]))\s*/i, '')
      .replace(/^\s*Question\s*\d*\s*[:\-]\s*/i, '')
      .replace(/^\s*Q\s*\d*\s*[:\-]\s*/i, '')
      .replace(/Options\s*:\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. Fallback answer detection by matching option values if answer letter was not directly specified
    if (!correctAnswer) {
      const textAnsMatch = block.match(/(?:(?:Correct\s+)?(?:Answer|Ans|Key)\s*[:\-]?\s*([^\n]+))/i);
      if (textAnsMatch) {
        const rawVal = textAnsMatch[1].trim().toLowerCase();
        if (rawVal.startsWith('a') && (rawVal === 'a' || rawVal.startsWith('a.') || rawVal.startsWith('a)'))) correctAnswer = 'A';
        else if (rawVal.startsWith('b') && (rawVal === 'b' || rawVal.startsWith('b.') || rawVal.startsWith('b)'))) correctAnswer = 'B';
        else if (rawVal.startsWith('c') && (rawVal === 'c' || rawVal.startsWith('c.') || rawVal.startsWith('c)'))) correctAnswer = 'C';
        else if (rawVal.startsWith('d') && (rawVal === 'd' || rawVal.startsWith('d.') || rawVal.startsWith('d)'))) correctAnswer = 'D';
        else if (optionA && optionA.toLowerCase() === rawVal) correctAnswer = 'A';
        else if (optionB && optionB.toLowerCase() === rawVal) correctAnswer = 'B';
        else if (optionC && optionC.toLowerCase() === rawVal) correctAnswer = 'C';
        else if (optionD && optionD.toLowerCase() === rawVal) correctAnswer = 'D';
      }
    }

    // Validation checks
    if (!questionText) {
      skippedList.push({
        index: questionIndex,
        reason: 'Missing question prompt text',
        rawPreview: block.substring(0, 80)
      });
      continue;
    }

    if (!optionA || !optionB) {
      skippedList.push({
        index: questionIndex,
        reason: 'Missing mandatory options A and B',
        rawPreview: questionText.substring(0, 80)
      });
      continue;
    }

    // If optionC or optionD are missing, fill sensible defaults or require all 4
    const finalOptionC = optionC || 'None of the above';
    const finalOptionD = optionD || 'All of the above';

    if (!correctAnswer) {
      skippedList.push({
        index: questionIndex,
        reason: 'Missing or unparseable correct answer (e.g. Answer: B)',
        rawPreview: questionText.substring(0, 80)
      });
      continue;
    }

    validQuestions.push({
      text: questionText,
      optionA,
      optionB,
      optionC: finalOptionC,
      optionD: finalOptionD,
      correctAnswer,
      difficulty
    });
  }

  return {
    questions: validQuestions,
    skipped: skippedList,
    totalDetected: questionIndex
  };
}

/**
 * Normalizes question string for duplicate detection
 */
export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
