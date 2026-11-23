import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Layers, 
  BookOpen, 
  Phone, 
  Mail, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminEnrollments() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [assignedBatch, setAssignedBatch] = useState('Morning Batch');
  const [notificationMsg, setNotificationMsg] = useState('');

  // Fetch admin enrollments
  const { data: enrollments = [], isLoading, refetch } = useQuery({
    queryKey: ['adminEnrollments'],
    queryFn: async () => {
      const res = await axios.get('/api/enrollments/admin');
      return res.data;
    }
  });

  // Mutation to update enrollment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, batchPreference }: { id: string; status: string; batchPreference?: string }) => {
      const res = await axios.put(`/api/enrollments/admin/${id}`, { status, batchPreference });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Enrollment marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['adminEnrollments'] });
      setShowBatchModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update enrollment');
    }
  });

  // Mutation to send notification to student
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ studentId, message }: { studentId: string; message: string }) => {
      const res = await axios.post('/api/notifications', {
        title: 'Admission & Batch Update',
        message,
        targetAudience: 'individual',
        recipientId: studentId,
        priority: 'high'
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Notification sent to student');
      setShowNotifyModal(false);
      setNotificationMsg('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    }
  });

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enr: any) => {
    const matchesSearch = 
      (enr.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enr.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enr.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enr.enrollmentId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (enr.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalCount = enrollments.length;
  const pendingCount = enrollments.filter((e: any) => e.status === 'Pending').length;
  const approvedCount = enrollments.filter((e: any) => e.status === 'Approved' || e.status === 'Enrolled').length;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Course Enrollments</h2>
          <p className="text-slate-500 text-sm">Review, verify, approve admissions, and allocate cohort batches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrollments</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Pending Review</span>
            <h3 className="text-2xl font-extrabold text-orange-600 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Approved Admissions</span>
            <h3 className="text-2xl font-extrabold text-green-700 mt-1">{approvedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, course, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-600 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading enrollments...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No enrollments found.</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Student & Reference</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Batch Preference</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr: any) => {
                  const studentName = enr.studentName || enr.userId?.name || 'Student';
                  const email = enr.email || enr.userId?.email || 'N/A';
                  const mobile = enr.mobile || enr.userId?.mobile || 'N/A';
                  const refId = enr.enrollmentId || `ENR-${enr._id?.slice(-6)}`;
                  const isApproved = enr.status === 'Approved' || enr.status === 'Enrolled';

                  return (
                    <tr key={enr._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{studentName}</div>
                        <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-0.5">
                          {refId}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{email}</span>
                        </div>
                        {mobile !== 'N/A' && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>+91 {mobile}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>{enr.courseName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                          {enr.batchPreference || 'Morning Batch'}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-slate-500">
                        {new Date(enr.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          isApproved 
                            ? 'bg-green-100 text-green-700' 
                            : enr.status === 'Rejected' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-orange-100 text-orange-700'
                        }`}>
                          {enr.status || 'Pending'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isApproved && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: enr._id, status: 'Approved' })}
                              className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                              title="Approve Admission"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}

                          {enr.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to reject enrollment for ${studentName}?`)) {
                                  updateStatusMutation.mutate({ id: enr._id, status: 'Rejected' });
                                }
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                              title="Reject Admission"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedEnrollment(enr);
                              setAssignedBatch(enr.batchPreference || 'Morning Batch');
                              setShowBatchModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                            title="Assign Batch"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Batch
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEnrollment(enr);
                              setNotificationMsg(`Hello ${studentName}, your admission for ${enr.courseName} is verified. Your class batch timing is confirmed.`);
                              setShowNotifyModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                            title="Send Notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Notify
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Assign Batch */}
      {showBatchModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Assign Cohort Batch</h3>
            <p className="text-xs text-slate-500">
              Allocating batch for <strong>{selectedEnrollment.studentName}</strong> ({selectedEnrollment.courseName}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Select Batch</label>
              <select
                value={assignedBatch}
                onChange={(e) => setAssignedBatch(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-blue-600 outline-none"
              >
                <option value="Morning Batch">🌅 Morning Batch (07:00 AM - 09:00 AM)</option>
                <option value="Afternoon Batch">☀️ Afternoon Batch (12:00 PM - 02:00 PM)</option>
                <option value="Evening Batch">🌇 Evening Batch (05:00 PM - 07:00 PM)</option>
                <option value="Weekend Batch">📅 Weekend Batch (Sat - Sun Intensive)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatusMutation.mutate({ 
                  id: selectedEnrollment._id, 
                  status: selectedEnrollment.status === 'Pending' ? 'Approved' : selectedEnrollment.status, 
                  batchPreference: assignedBatch 
                })}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
              >
                Save & Allocate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Direct Notification */}
      {showNotifyModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Send Notification to Student</h3>
            <p className="text-xs text-slate-500">
              Message will appear directly in <strong>{selectedEnrollment.studentName}</strong>'s dashboard.
            </p>

            <textarea
              rows={4}
              value={notificationMsg}
              onChange={(e) => setNotificationMsg(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-600"
              placeholder="Type your notification message..."
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!notificationMsg.trim()}
                onClick={() => sendNotificationMutation.mutate({ 
                  studentId: selectedEnrollment.userId?._id || selectedEnrollment.userId, 
                  message: notificationMsg 
                })}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
