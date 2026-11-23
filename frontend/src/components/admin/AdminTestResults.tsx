import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  X, 
  CheckSquare, 
  Square, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  ShieldAlert, 
  Loader2,
  FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AdminTestResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pass' | 'Fail'>('All');
  
  // Selection for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Single Delete Confirmation Modal State
  const [deleteModalItem, setDeleteModalItem] = useState<any | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Bulk Delete Confirmation Modal State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // View Details Modal State
  const [viewingResult, setViewingResult] = useState<any | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tests/admin/results', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setResults(data);
    } catch (err: any) {
      console.error('Failed to load test results:', err);
      toast.error(err.response?.data?.message || 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  // Filtered results
  const filtered = useMemo(() => {
    return results.filter(r => {
      const studentName = (r.userName || r.userId?.name || '').toLowerCase();
      const studentEmail = (r.email || r.userId?.email || '').toLowerCase();
      const testName = (r.testName || r.testSlug || '').toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || studentName.includes(q) || studentEmail.includes(q) || testName.includes(q);
      
      const isPass = r.passed !== undefined ? Boolean(r.passed) : (Number(r.percentage) || 0) >= 40;
      const matchesStatus = 
        statusFilter === 'All' ? true :
        statusFilter === 'Pass' ? isPass :
        !isPass;

      return matchesSearch && matchesStatus;
    });
  }, [results, search, statusFilter]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filtered.map(r => r._id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Single Delete Execution
  const executeSingleDelete = async () => {
    if (!deleteModalItem?._id) return;
    setIsDeletingSingle(true);
    const targetId = deleteModalItem._id;

    try {
      // Calls DELETE /api/test-results/:resultId
      const res = await axios.delete(`/api/test-results/${targetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success(res.data?.message || 'Test Result Deleted Successfully');

      // Instantly remove from UI
      setResults(prev => prev.filter(r => r._id !== targetId));
      setSelectedIds(prev => prev.filter(id => id !== targetId));
      if (viewingResult?._id === targetId) {
        setViewingResult(null);
      }
      setDeleteModalItem(null);
    } catch (err: any) {
      console.error('Delete result error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete test result');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Bulk Delete Execution
  const executeBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsDeletingBulk(true);

    try {
      const res = await axios.post('/api/test-results/bulk-delete', {
        resultIds: selectedIds
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success(res.data?.message || `${selectedIds.length} test results deleted successfully`);

      // Instantly remove deleted rows from state
      const deletedSet = new Set(selectedIds);
      setResults(prev => prev.filter(r => !deletedSet.has(r._id)));
      if (viewingResult && deletedSet.has(viewingResult._id)) {
        setViewingResult(null);
      }
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected test results');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const isAllFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.includes(r._id));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Test Results</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {results.length} Total Records
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Review student assessment submissions, inspect question answers, or permanently delete records.
          </p>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'All' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Pass')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Pass' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Passed
            </button>
            <button
              onClick={() => setStatusFilter('Fail')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Fail' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Failed
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student, email, test..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchResults}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Results"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bulk Action Banner when items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <p className="text-xs font-semibold text-rose-900">
              <strong className="font-bold">{selectedIds.length}</strong> result{selectedIds.length > 1 ? 's' : ''} selected across the results table.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold select-none">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleSelectAll}
                    disabled={filtered.length === 0}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all matching results"
                  />
                </th>
                <th className="p-4 font-semibold text-slate-600">Student</th>
                <th className="p-4 font-semibold text-slate-600">Test Name</th>
                <th className="p-4 font-semibold text-slate-600">Score</th>
                <th className="p-4 font-semibold text-slate-600">Percentage</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600">Date & Time</th>
                <th className="p-4 font-semibold text-slate-600 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((r) => {
                const isSelected = selectedIds.includes(r._id);
                const isPass = r.passed !== undefined ? Boolean(r.passed) : (Number(r.percentage) || 0) >= 40;
                const studentName = r.userName || r.userId?.name || 'Student';
                const studentEmail = r.email || r.userId?.email || 'N/A';
                const testTitle = r.testName || r.testSlug || 'Assessment Test';
                const dateObj = r.completedAt ? new Date(r.completedAt) : (r.createdAt ? new Date(r.createdAt) : null);

                return (
                  <tr 
                    key={r._id} 
                    className={`transition-colors ${isSelected ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(r._id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{studentEmail}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-semibold max-w-[180px] truncate">
                      {testTitle}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                        {r.score}
                      </span>
                      {r.totalQuestions > 0 && (
                        <span className="text-slate-400 text-[11px] font-mono"> / {r.totalQuestions}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(5, r.percentage || 0))}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 font-mono tabular-nums">
                          {r.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        isPass 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isPass ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{isPass ? 'PASS' : 'FAIL'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">
                      {dateObj ? (
                        <div>
                          <div>{dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-slate-400 text-[10px]">{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setViewingResult(r)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="View detailed assessment breakdown"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalItem(r)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs group"
                          title="Permanently delete test result"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:text-white transition-colors" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="py-16 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No test results found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filter status.</p>
            {(search || statusFilter !== 'All') && (
              <button 
                onClick={() => { setSearch(''); setStatusFilter('All'); }} 
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading student assessment results...</p>
          </div>
        )}
      </div>

      {/* SINGLE RESULT DELETE CONFIRMATION MODAL */}
      {deleteModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-rose-50/60 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Test Result</h3>
                  <p className="text-xs text-rose-700 font-medium">Permanent Database Removal</p>
                </div>
              </div>
              <button 
                onClick={() => !isDeletingSingle && setDeleteModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to permanently delete this assessment test result?
              </p>

              {/* Record Summary Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Student:</span>
                  <strong className="text-slate-900 font-bold">
                    {deleteModalItem.userName || deleteModalItem.userId?.name || 'Student'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Test:</span>
                  <span className="text-slate-900 font-semibold">
                    {deleteModalItem.testName || deleteModalItem.testSlug || 'Assessment Test'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Score / Percentage:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {deleteModalItem.score} pts ({deleteModalItem.percentage}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {deleteModalItem.completedAt ? new Date(deleteModalItem.completedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This action cannot be undone. The record will be permanently deleted from MongoDB and logged in the activity audit trail.
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={isDeletingSingle}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSingleDelete}
                disabled={isDeletingSingle}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isDeletingSingle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-rose-50/60 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Multiple Results</h3>
                  <p className="text-xs text-rose-700 font-medium">Bulk Database Deletion</p>
                </div>
              </div>
              <button 
                onClick={() => !isDeletingBulk && setShowBulkDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-rose-600 font-bold">{selectedIds.length}</strong> selected test results?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> All {selectedIds.length} records will be permanently removed from MongoDB. This action cannot be undone.
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeletingBulk}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                disabled={isDeletingBulk}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isDeletingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting {selectedIds.length}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete {selectedIds.length} Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RESULT DETAILS MODAL */}
      {viewingResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assessment Result Details</h3>
                <p className="text-xs text-slate-500">Full submission record & breakdown</p>
              </div>
              <button 
                onClick={() => setViewingResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Student Header Card */}
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Student Name</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {viewingResult.userName || viewingResult.userId?.name || 'Student'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{viewingResult.email || viewingResult.userId?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    (viewingResult.passed !== undefined ? viewingResult.passed : viewingResult.percentage >= 40)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {(viewingResult.passed !== undefined ? viewingResult.passed : viewingResult.percentage >= 40) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Assessment Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Score</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {viewingResult.score} pts
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Percentage</span>
                  <span className="text-lg font-bold text-blue-700 font-mono mt-1 block">
                    {viewingResult.percentage}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Level</span>
                  <span className="text-lg font-bold text-purple-700 font-mono mt-1 block">
                    {viewingResult.level || 'Intermediate'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Total Questions</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">
                    {viewingResult.totalQuestions || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Attempted</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">
                    {viewingResult.attemptedQuestions || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block">Correct / Wrong</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">
                    <span className="text-emerald-600">{viewingResult.correctAnswers || 0}</span> / <span className="text-rose-600">{viewingResult.wrongAnswers || 0}</span>
                  </span>
                </div>
              </div>

              {/* Timestamp & Meta */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Test Title:</span>
                  <span className="font-semibold text-slate-800">{viewingResult.testName || viewingResult.testSlug || 'Assessment Test'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed At:</span>
                  <span className="font-mono text-slate-700">
                    {viewingResult.completedAt ? new Date(viewingResult.completedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {viewingResult.durationTaken && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration Taken:</span>
                    <span className="font-mono text-slate-700">{Math.round(viewingResult.durationTaken / 60)} minutes</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Result ID:</span>
                  <span className="font-mono text-[11px] text-slate-500">{viewingResult._id}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const item = viewingResult;
                  setViewingResult(null);
                  setDeleteModalItem(item);
                }}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Result</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingResult(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
