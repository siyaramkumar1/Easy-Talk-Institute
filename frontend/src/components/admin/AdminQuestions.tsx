import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileUp, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface AdminQuestionsProps {
  initialTestId?: string;
  autoOpenPdfModal?: boolean;
  onBackToTests?: () => void;
}

export const AdminQuestions: React.FC<AdminQuestionsProps> = ({ 
  initialTestId, 
  autoOpenPdfModal, 
  onBackToTests 
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '');
  
  // PDF Import System States
  const [showPdfModal, setShowPdfModal] = useState(Boolean(autoOpenPdfModal));
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importError, setImportError] = useState<string>('');
  const [skippedDetails, setSkippedDetails] = useState<any[]>([]);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [defaultDifficulty, setDefaultDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId);
    }
  }, [initialTestId]);

  useEffect(() => {
    if (autoOpenPdfModal) {
      setShowPdfModal(true);
    }
  }, [autoOpenPdfModal]);

  const [formData, setFormData] = useState({
    testId: '', 
    text: '', 
    optionA: '', 
    optionB: '', 
    optionC: '', 
    optionD: '', 
    correctAnswer: 'A', 
    difficulty: 'Medium', 
    status: 'Active'
  });

  const fetchQuestions = async () => {
    try {
      const url = selectedTestId ? `/api/tests/admin/questions?testId=${selectedTestId}` : '/api/tests/admin/questions';
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await axios.get('/api/admin-tests');
      setTests(res.data);
      if (res.data.length > 0 && !selectedTestId) {
        setSelectedTestId(res.data[0].slug);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions();
    }
  }, [selectedTestId]);

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setFormData(question);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this question?')) {
      try {
        await axios.delete(`/api/tests/admin/questions/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete question');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (editingQuestion) {
        await axios.put(`/api/tests/admin/questions/${editingQuestion._id}`, formData, config);
        toast.success('Question updated successfully');
      } else {
        await axios.post('/api/tests/admin/questions', formData, config);
        toast.success('Question created successfully');
      }
      
      setShowModal(false);
      setEditingQuestion(null);
      setFormData({ 
        testId: selectedTestId, 
        text: '', 
        optionA: '', 
        optionB: '', 
        optionC: '', 
        optionD: '', 
        correctAnswer: 'A', 
        difficulty: 'Medium', 
        status: 'Active' 
      });
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving question');
    }
  };

  const handleAddNew = () => {
    setFormData({ ...formData, testId: selectedTestId });
    setEditingQuestion(null);
    setShowModal(true);
  };

  // PDF Import Handlers
  const handleOpenPdfModal = () => {
    if (!selectedTestId) {
      toast.error('Please select an Assessment Test first.');
      return;
    }
    setPdfFile(null);
    setImportSummary(null);
    setImportError('');
    setSkippedDetails([]);
    setShowSkippedDetails(false);
    setIsUploading(false);
    setShowPdfModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setImportError('Please select a valid .pdf file.');
      setPdfFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setImportError('File size exceeds the 20MB limit.');
      setPdfFile(null);
      return;
    }

    setImportError('');
    setPdfFile(file);
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      setImportError('Please select a PDF file to upload.');
      return;
    }

    if (!selectedTestId) {
      setImportError('Please choose a valid assessment test.');
      return;
    }

    setIsUploading(true);
    setImportError('');
    setImportSummary(null);
    setSkippedDetails([]);
    setUploadStep('Reading PDF...');

    // Progress simulation for responsive UX
    const timer1 = setTimeout(() => {
      setUploadStep('Extracting Questions...');
    }, 600);

    const timer2 = setTimeout(() => {
      setUploadStep('Saving Questions to MongoDB...');
    }, 1200);

    try {
      const uploadData = new FormData();
      uploadData.append('pdf', pdfFile);
      uploadData.append('testId', selectedTestId);
      uploadData.append('defaultDifficulty', defaultDifficulty);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/questions/import-pdf', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadStep('Import Completed');
      setImportSummary(response.data.summary);
      setSkippedDetails(response.data.skippedDetails || []);

      toast.success(response.data.message || 'Questions imported successfully!');
      fetchQuestions();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('PDF Import error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to process PDF.';
      setImportError(msg);
      if (err.response?.data?.summary) {
        setImportSummary(err.response.data.summary);
      }
      if (err.response?.data?.skippedDetails) {
        setSkippedDetails(err.response.data.skippedDetails);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const selectedTestObj = tests.find(t => t.slug === selectedTestId);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBackToTests && (
            <button
              type="button"
              onClick={onBackToTests}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Assessment Tests</span>
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Question Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage question bank, add questions manually, or batch import from PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Test Selector */}
          <select 
            value={selectedTestId} 
            onChange={(e) => setSelectedTestId(e.target.value)} 
            className="border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-sm font-semibold text-slate-700 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select a Test</option>
            {tests.map(t => (
              <option key={t.slug} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Import PDF Button */}
          <button 
            type="button"
            onClick={handleOpenPdfModal} 
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            title="Automatically extract and import questions from a PDF file"
          >
            <FileUp className="w-4 h-4" /> 
            <span>Import PDF</span>
          </button>

          {/* Manual Add Question Button */}
          <button 
            type="button"
            onClick={handleAddNew} 
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Selected Test Context Card */}
      {selectedTestObj && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <span className="text-slate-500">Active Test: </span>
              <strong className="text-blue-950 font-bold">{selectedTestObj.title}</strong>
              <span className="text-slate-400 text-xs ml-2 font-mono">({selectedTestObj.slug})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span>Total in Bank: <strong className="text-blue-900">{questions.length}</strong></span>
            <span>Duration: <strong className="text-slate-800">{selectedTestObj.duration || 15}m</strong></span>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="p-4 w-1/2">Question</th>
              <th className="p-4">Options & Answer</th>
              <th className="p-4">Difficulty</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map((q, idx) => (
              <tr key={q._id || idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4 font-medium text-slate-800">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 mt-0.5">#{idx + 1}</span>
                    <p className="line-clamp-2 text-sm leading-relaxed">{q.text}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-xs space-y-0.5 text-slate-600">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 mb-1">
                      Answer: Option {q.correctAnswer}
                    </span>
                    <p className="truncate max-w-[200px] text-slate-500">A: {q.optionA}</p>
                    <p className="truncate max-w-[200px] text-slate-500">B: {q.optionB}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {q.difficulty || 'Medium'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    q.status === 'Active' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(q)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                      title="Edit Question"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(q._id)} 
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {questions.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No questions found for this test.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Use "Import PDF" to automatically load questions or click "Add Question" to create one manually.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PDF QUESTION IMPORT MODAL                                 */}
      {/* ========================================================= */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Import Questions from PDF</h3>
                  <p className="text-xs text-slate-500">
                    Target Test: <span className="font-semibold text-indigo-600">{selectedTestObj?.title || selectedTestId}</span>
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowPdfModal(false)}
                disabled={isUploading}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1">
              
              {/* Error Message */}
              {importError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Import Issue</p>
                    <p className="mt-0.5 text-red-600 leading-relaxed">{importError}</p>
                  </div>
                </div>
              )}

              {/* Processing Screen */}
              {isUploading ? (
                <div className="py-10 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{uploadStep}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Extracting questions, options, and answers automatically. Please wait...
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>
              ) : importSummary ? (
                /* Import Summary Screen */
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm sm:text-base">Import Completed Successfully</h4>
                      <p className="text-xs text-emerald-700">Questions were saved directly into MongoDB question bank.</p>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Imported</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{importSummary.totalDetected || 0}</p>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase">Successfully Added</p>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{importSummary.successfullyAdded || 0}</p>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                      <p className="text-[11px] font-bold text-amber-700 uppercase">Duplicates</p>
                      <p className="text-2xl font-black text-amber-700 mt-1">{importSummary.duplicatesFound || 0}</p>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                      <p className="text-[11px] font-bold text-slate-600 uppercase">Skipped</p>
                      <p className="text-2xl font-black text-slate-600 mt-1">{importSummary.questionsSkipped || 0}</p>
                    </div>
                  </div>

                  {/* Skipped Details Accordion if any questions were skipped */}
                  {skippedDetails.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                      <button 
                        type="button"
                        onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span>View Skipped Items ({skippedDetails.length})</span>
                        {showSkippedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showSkippedDetails && (
                        <div className="mt-2.5 max-h-40 overflow-y-auto space-y-2 text-xs border-t border-slate-200 pt-2">
                          {skippedDetails.map((s, i) => (
                            <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1">
                              <span className="font-semibold text-rose-600">Item #{s.index}: {s.reason}</span>
                              {s.rawPreview && (
                                <span className="text-slate-500 font-mono text-[11px] truncate">{s.rawPreview}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* PDF Selection Screen */
                <div className="space-y-4">
                  {/* File Dropzone */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      pdfFile 
                        ? 'border-indigo-500 bg-indigo-50/40' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden" 
                    />

                    {pdfFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{pdfFile.name}</p>
                        <p className="text-xs text-slate-500">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p className="text-xs text-indigo-600 font-semibold hover:underline">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">Choose PDF File</p>
                        <p className="text-xs text-slate-500">
                          Supported format: <strong className="text-slate-700">.pdf</strong> (Maximum 20MB)
                        </p>
                        <span className="inline-block mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                          Browse Computer
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fallback Difficulty Selector */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Default Difficulty</p>
                      <p className="text-[11px] text-slate-500">Used if difficulty is not specified in the PDF</p>
                    </div>
                    <select
                      value={defaultDifficulty}
                      onChange={(e) => setDefaultDifficulty(e.target.value as any)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Format Guidelines Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Supported PDF Formats</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Accepts standard formats (e.g., <em>1. Question text ... A. option B. option ... Answer: B</em>, or <em>Q1. ... a) ... Correct Answer: b</em>). Duplicate questions are automatically detected and skipped.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-3xl">
              {importSummary ? (
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(false)}
                    disabled={isUploading}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadPdf}
                    disabled={isUploading || !pdfFile}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4" />
                        <span>Upload PDF</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Manual Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {editingQuestion ? 'Edit Question' : 'Add Question Manually'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Test Slug
                </label>
                <input 
                  type="text" 
                  value={formData.testId} 
                  onChange={e => setFormData({ ...formData, testId: e.target.value })} 
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-sm" 
                  required 
                  readOnly 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Question Text *
                </label>
                <textarea 
                  value={formData.text} 
                  onChange={e => setFormData({ ...formData, text: e.target.value })} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm leading-relaxed" 
                  rows={3} 
                  placeholder="Enter the question statement here..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Option A *</label>
                  <input 
                    type="text" 
                    value={formData.optionA} 
                    onChange={e => setFormData({ ...formData, optionA: e.target.value })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Option B *</label>
                  <input 
                    type="text" 
                    value={formData.optionB} 
                    onChange={e => setFormData({ ...formData, optionB: e.target.value })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Option C *</label>
                  <input 
                    type="text" 
                    value={formData.optionC} 
                    onChange={e => setFormData({ ...formData, optionC: e.target.value })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Option D *</label>
                  <input 
                    type="text" 
                    value={formData.optionD} 
                    onChange={e => setFormData({ ...formData, optionD: e.target.value })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Correct Answer</label>
                  <select 
                    value={formData.correctAnswer} 
                    onChange={e => setFormData({ ...formData, correctAnswer: e.target.value as any })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Difficulty</label>
                  <select 
                    value={formData.difficulty} 
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
