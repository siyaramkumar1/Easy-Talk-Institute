import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Target, 
  MessageSquare, 
  CheckCircle2, 
  ArrowUpDown,
  Filter,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Users
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getAppSocket } from '../../utils/socket';

export const AdminSeatReservations = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Details Modal State
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [modalStatus, setModalStatus] = useState('Pending');
  const [modalRemarks, setModalRemarks] = useState('');

  // Delete Confirmation Modal State
  const [reservationToDelete, setReservationToDelete] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reservations/admin', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch seat reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    const socket = getAppSocket();
    const handleSync = () => {
      fetchReservations();
    };

    if (socket) {
      socket.on('reservationsUpdated', handleSync);
    }

    return () => {
      if (socket) {
        socket.off('reservationsUpdated', handleSync);
      }
    };
  }, []);

  // Real-time calculated dashboard counts from MongoDB reservation documents
  const reservationStats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'Pending' || r.status === 'Contacted').length;
    const confirmed = reservations.filter(r => ['Confirmed', 'Approved', 'Reserved', 'Converted'].includes(r.status)).length;
    const cancelled = reservations.filter(r => ['Cancelled', 'Rejected'].includes(r.status)).length;
    return { total, pending, confirmed, cancelled };
  }, [reservations]);

  const handleOpenDetails = (res: any) => {
    setSelectedRes(res);
    setModalStatus(res.status || 'Pending');
    setModalRemarks(res.remarks || '');
    setShowModal(true);
  };

  const handleStatusChange = async (id: string, newStatus: string, remarks?: string) => {
    try {
      setUpdatingStatus(true);
      await axios.put(`/api/reservations/admin/${id}`, { 
        status: newStatus,
        remarks: remarks !== undefined ? remarks : selectedRes?.remarks
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (newStatus === 'Approved') {
        toast.success('Reservation Approved Successfully', { duration: 3000 });
      } else if (newStatus === 'Rejected') {
        toast.success('Reservation Rejected Successfully', { duration: 3000 });
      } else {
        toast.success('Reservation status updated successfully', { duration: 3000 });
      }
      
      // Update local state in modal if currently open
      if (selectedRes && selectedRes._id === id) {
        setSelectedRes({ ...selectedRes, status: newStatus, remarks: remarks !== undefined ? remarks : selectedRes.remarks });
        setModalStatus(newStatus);
      }
      
      fetchReservations();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update reservation status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    await handleStatusChange(selectedRes._id, modalStatus, modalRemarks);
    setShowModal(false);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (res: any) => {
    setReservationToDelete(res);
    setShowDeleteModal(true);
  };

  // Close Delete Confirmation Modal
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setReservationToDelete(null);
  };

  // Permanent Delete Execution
  const handleConfirmPermanentDelete = async () => {
    if (!reservationToDelete?._id) return;
    const targetId = reservationToDelete._id;

    try {
      setIsDeleting(true);

      // Call backend DELETE API endpoint: DELETE /api/admin/reservations/:id
      const response = await axios.delete(`/api/admin/reservations/${targetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Show success toast notification
      toast.success(response.data?.message || 'Reservation deleted successfully');

      // Optimistic UI update: Remove deleted record immediately from state without page reload
      setReservations(prev => prev.filter(r => r._id !== targetId));

      // Close details modal if open for this same reservation
      if (selectedRes && selectedRes._id === targetId) {
        setShowModal(false);
        setSelectedRes(null);
      }

      // Close delete confirmation modal
      setShowDeleteModal(false);
      setReservationToDelete(null);

      // Re-fetch in background to ensure 100% sync with MongoDB collection
      fetchReservations();
    } catch (err: any) {
      console.error('Failed to permanently delete reservation:', err);
      const msg = err.response?.data?.message || 'Failed to delete reservation';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMobileNumber = (mobile?: string) => {
    if (!mobile) return '—';
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    return mobile.startsWith('+') ? mobile : `+91 ${mobile}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmed':
      case 'Approved':
      case 'Reserved':
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filter & Search Logic: preserves current search, filter, and sorting
  const filtered = reservations.filter(r => {
    const course = r.courseInterested || r.courseName || '';
    const mobile = r.mobileNumber || r.mobile || '';
    const name = r.fullName || '';
    const email = r.email || '';
    const refId = r.referenceId || '';

    const query = search.toLowerCase();
    const matchesSearch = 
      name.toLowerCase().includes(query) || 
      mobile.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      course.toLowerCase().includes(query) ||
      refId.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' 
      ? true 
      : statusFilter === 'Pending'
        ? r.status === 'Pending' || r.status === 'Contacted'
        : statusFilter === 'Confirmed'
          ? ['Confirmed', 'Approved', 'Reserved', 'Converted'].includes(r.status)
          : statusFilter === 'Cancelled'
            ? ['Cancelled', 'Rejected'].includes(r.status)
            : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort Logic: Newest First / Oldest First
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Export to CSV Feature
  const handleExportCSV = () => {
    if (sorted.length === 0) {
      toast.error('No reservation records to export.');
      return;
    }

    const headers = [
      'Student Name',
      'Mobile Number',
      'Email',
      'Course',
      'Batch Preference',
      'Qualification',
      'Purpose',
      'Message',
      'Status',
      'Reservation Date',
      'Remarks'
    ];

    const rows = sorted.map(r => [
      r.fullName || '',
      formatMobileNumber(r.mobileNumber || r.mobile),
      r.email || '',
      r.courseInterested || r.courseName || '',
      r.batchPreference || '',
      r.highestQualification || '',
      r.purposeOfJoining || '',
      r.message || '',
      r.status || 'Pending',
      formatDisplayDate(r.createdAt),
      r.remarks || ''
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seat_reservations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reservation data exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Seat Reservations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            View complete prospective student inquiries and manage admission workflows.
          </p>
        </div>

        {/* Search, Filter, Sort & Export */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search by Name, Mobile, Email, Course */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, Mobile, Email, Course..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter reservations by status"
              className="bg-transparent text-sm focus:outline-none cursor-pointer pr-1 text-slate-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending / Contacted</option>
              <option value="Confirmed">Confirmed / Approved</option>
              <option value="Cancelled">Cancelled / Rejected</option>
            </select>
          </div>

          {/* Sort Support: Newest First / Oldest First */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            title="Toggle sort order"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export all records to CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time Dashboard Summary Cards (Requirement 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reservations */}
        <div 
          onClick={() => setStatusFilter('All')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'All' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reservations</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {reservationStats.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">All student inquiries in database</p>
        </div>

        {/* Pending Inquiries */}
        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'Pending' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono tabular-nums">
            {reservationStats.pending}
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting counseling / review</p>
        </div>

        {/* Confirmed / Approved */}
        <div 
          onClick={() => setStatusFilter('Confirmed')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'Confirmed' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Confirmed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
            {reservationStats.confirmed}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Seats approved & confirmed</p>
        </div>

        {/* Cancelled / Rejected */}
        <div 
          onClick={() => setStatusFilter('Cancelled')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'Cancelled' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Cancelled</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-700 font-mono tabular-nums">
            {reservationStats.cancelled}
          </div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">Declined or cancelled inquiries</p>
        </div>
      </div>

      {/* Desktop & Tablet Table (lg screens and up) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Student Name</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">Email</th>
                <th className="p-4">Course</th>
                <th className="p-4">Batch Preference</th>
                <th className="p-4">Qualification</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sorted.map((r) => {
                const mobileFormatted = formatMobileNumber(r.mobileNumber || r.mobile);
                const displayDate = formatDisplayDate(r.createdAt);

                return (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Name */}
                    <td className="p-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div>
                        <span>{r.fullName}</span>
                        {r.referenceId && (
                          <span className="block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            {r.referenceId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="p-4 text-slate-700 font-mono text-xs whitespace-nowrap">
                      {mobileFormatted}
                    </td>

                    {/* Email */}
                    <td className="p-4 text-slate-600 text-xs max-w-[160px] truncate" title={r.email}>
                      {r.email || <span className="text-slate-400 italic">Not provided</span>}
                    </td>

                    {/* Course */}
                    <td className="p-4 text-slate-800 font-medium whitespace-nowrap">
                      {r.courseInterested || r.courseName || 'General Admission'}
                    </td>

                    {/* Batch Preference */}
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {r.batchPreference || 'Any Batch'}
                      </span>
                    </td>

                    {/* Qualification */}
                    <td className="p-4 text-slate-600 text-xs whitespace-nowrap">
                      {r.highestQualification || '—'}
                    </td>

                    {/* Purpose */}
                    <td className="p-4 text-slate-600 text-xs max-w-[150px] truncate" title={r.purposeOfJoining}>
                      {r.purposeOfJoining || '—'}
                    </td>

                    {/* Status with dropdown support */}
                    <td className="p-4 whitespace-nowrap">
                      <select
                        value={r.status || 'Pending'}
                        onChange={(e) => handleStatusChange(r._id, e.target.value)}
                        aria-label={`Change status for ${r.fullName}`}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border uppercase tracking-wider bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 ${getStatusBadge(r.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-500 text-xs whitespace-nowrap font-medium">
                      {displayDate}
                    </td>

                    {/* Requirement 1: Actions Column with View Details and Delete Buttons */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details Button */}
                        <button 
                          type="button"
                          onClick={() => handleOpenDetails(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          type="button"
                          onClick={() => handleOpenDeleteModal(r)} 
                          title="Delete Reservation"
                          aria-label={`Delete reservation for ${r.fullName}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-900 border border-red-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
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

        {sorted.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold text-slate-700">No seat reservations found.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter options.</p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout (< lg screens) */}
      <div className="lg:hidden space-y-4">
        {sorted.map((r) => {
          const mobileFormatted = formatMobileNumber(r.mobileNumber || r.mobile);
          const displayDate = formatDisplayDate(r.createdAt);

          return (
            <div key={r._id} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-3.5">
              {/* Top Row: Name and Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{r.fullName}</h3>
                  {r.referenceId && (
                    <span className="inline-block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">
                      {r.referenceId}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{displayDate}</span>
                  </div>
                </div>
                <select
                  value={r.status || 'Pending'}
                  onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  aria-label={`Change status for ${r.fullName}`}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border uppercase tracking-wider bg-white cursor-pointer focus:outline-none ${getStatusBadge(r.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Middle Info Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Number</span>
                  <span className="font-semibold text-slate-800 font-mono">{mobileFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Course</span>
                  <span className="font-semibold text-slate-800 truncate block">{r.courseInterested || r.courseName || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Batch</span>
                  <span className="font-semibold text-slate-800">{r.batchPreference || 'Any'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Qualification</span>
                  <span className="font-semibold text-slate-800">{r.highestQualification || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Purpose</span>
                  <span className="font-semibold text-slate-800">{r.purposeOfJoining || '—'}</span>
                </div>
              </div>

              {/* Requirement 1: Mobile Bottom Actions with View Details & Delete Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(r)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeleteModal(r)}
                  title="Delete Reservation"
                  aria-label={`Delete reservation for ${r.fullName}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
            <p className="text-base font-semibold text-slate-700">No seat reservations found.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>

      {/* REQUIREMENTS 2, 3, 4: DELETE CONFIRMATION MODAL */}
      {showDeleteModal && reservationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            {/* Header with Warning Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">Delete Reservation</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this reservation?
                  <span className="block font-medium text-red-600 mt-0.5">This action cannot be undone.</span>
                </p>
              </div>
            </div>

            {/* Target Reservation Preview Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Student:</span>
                <span className="font-bold text-slate-900 text-sm">{reservationToDelete.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Course:</span>
                <span className="font-semibold text-blue-900">
                  {reservationToDelete.courseInterested || reservationToDelete.courseName || 'General Admission'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mobile:</span>
                <span className="font-mono text-slate-700">
                  {formatMobileNumber(reservationToDelete.mobileNumber || reservationToDelete.mobile)}
                </span>
              </div>
              {reservationToDelete.referenceId && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Reference ID:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {reservationToDelete.referenceId}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Buttons: Cancel & Delete Permanently */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleCloseDeleteModal}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmPermanentDelete}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
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

      {/* RESERVATION DETAILS MODAL */}
      {showModal && selectedRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Reservation Details</h2>
                  <p className="text-xs text-slate-500">Submitted by prospective student</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete Information Display */}
            <div className="p-6 space-y-4 text-sm">
              {/* Full Name */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Full Name:
                </span>
                <span className="text-base font-bold text-slate-900">
                  {selectedRes.fullName}
                </span>
              </div>

              {/* Mobile Number */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Mobile Number:
                </span>
                <span className="text-base font-semibold text-blue-950 font-mono">
                  {formatMobileNumber(selectedRes.mobileNumber || selectedRes.mobile)}
                </span>
              </div>

              {/* Email */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Email:
                </span>
                <span className="text-slate-800 font-medium">
                  {selectedRes.email ? selectedRes.email : <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>

              {/* Course Interested */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Course Interested:
                </span>
                <span className="text-base font-semibold text-blue-900">
                  {selectedRes.courseInterested || selectedRes.courseName || 'General Admission'}
                </span>
              </div>

              {/* Batch Preference */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Batch Preference:
                </span>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs mt-1 border border-slate-200">
                  {selectedRes.batchPreference || 'Any Batch'}
                </span>
              </div>

              {/* Highest Qualification */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Highest Qualification:
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedRes.highestQualification || '—'}
                </span>
              </div>

              {/* Purpose of Joining */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Purpose of Joining:
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedRes.purposeOfJoining || '—'}
                </span>
              </div>

              {/* Message */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Message:
                </span>
                {selectedRes.message && selectedRes.message.trim() ? (
                  <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedRes.message}
                  </p>
                ) : (
                  <span className="text-slate-400 italic text-xs">No message provided.</span>
                )}
              </div>

              {/* Reservation Status & Date */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Reservation Status:
                  </span>
                  <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border uppercase tracking-wider ${getStatusBadge(selectedRes.status)}`}>
                    {selectedRes.status || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Reservation Date:
                  </span>
                  <span className="text-slate-800 font-medium text-sm">
                    {formatDisplayDate(selectedRes.createdAt)}
                  </span>
                </div>
              </div>

              {/* Admin Action Form: Update Status & Counseling Remarks */}
              <form onSubmit={handleModalSave} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Update Reservation Status:
                  </label>
                  <select 
                    value={modalStatus} 
                    onChange={e => setModalStatus(e.target.value)} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Quick Status Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => {
                      setModalStatus('Approved');
                      handleStatusChange(selectedRes._id, 'Approved', modalRemarks);
                      setShowModal(false);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    ✓ Approve Seat
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => {
                      if (!modalRemarks.trim()) {
                        toast.error('Please enter remarks/reason before rejecting');
                        return;
                      }
                      setModalStatus('Rejected');
                      handleStatusChange(selectedRes._id, 'Rejected', modalRemarks);
                      setShowModal(false);
                    }}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    ✕ Reject Reservation
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Counseling Remarks / Notes / Reason:
                  </label>
                  <textarea 
                    value={modalRemarks} 
                    onChange={e => setModalRemarks(e.target.value)} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" 
                    rows={3}
                    placeholder="e.g. Approved for Morning batch / Batch slot full / Contacted for counseling..."
                  ></textarea>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Delete from inside details modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleOpenDeleteModal(selectedRes);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Reservation</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button 
                      type="submit" 
                      disabled={updatingStatus}
                      className="px-5 py-2 text-sm bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {updatingStatus ? 'Updating...' : 'Save & Update Status'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminSeatReservations;
