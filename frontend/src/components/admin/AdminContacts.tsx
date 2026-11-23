import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, Calendar, Search, Filter, MessageSquare, Clock, CheckCircle, XCircle, Trash2, Reply } from 'lucide-react';
import { contactService } from '../../services/contactService';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminContacts = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Latest First');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [associating, setAssociating] = useState(false);
  const { token } = useAuthStore();
  const location = useLocation();

  const openInquiryModal = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setReplyText('');
  };

  const fetchInquiries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await contactService.getInquiries(token);
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [token]);

  // Handle URL query to auto-select and highlight inquiry
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inquiryId = params.get('id');
    if (inquiryId && inquiries.length > 0) {
      const found = inquiries.find(inc => inc._id === inquiryId);
      if (found) {
        openInquiryModal(found);
        setTimeout(() => {
          const el = document.getElementById(`inquiry-${inquiryId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      }
    }
  }, [location.search, inquiries]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      await contactService.updateStatus(id, status, token);
      setInquiries(inquiries.map(inc => inc._id === id ? { ...inc, status } : inc));
      if (selectedInquiry?._id === id) setSelectedInquiry({ ...selectedInquiry, status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (window.confirm('Delete this inquiry?')) {
      try {
        await contactService.deleteInquiry(id, token);
        setInquiries(inquiries.filter(inc => inc._id !== id));
        if (selectedInquiry?._id === id) setSelectedInquiry(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAssociateAccount = async (inquiryId: string, userId?: string) => {
    if (!token || associating) return;
    setAssociating(true);
    try {
      const res = await contactService.associateUser(
        inquiryId,
        { userId, deliverExistingReplies: true },
        token
      );
      if (res?.inquiry) {
        setInquiries((prev) => prev.map((inc) => (inc._id === inquiryId ? res.inquiry : inc)));
        setSelectedInquiry(res.inquiry);
      }
      toast.success(res?.message || 'Verified student account linked!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to associate student account');
    } finally {
      setAssociating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedInquiry || sendingReply) return;
    const trimmed = replyText.trim();
    if (!trimmed) {
      toast.error('Please write a reply message before sending.');
      return;
    }

    setSendingReply(true);
    try {
      const res = await contactService.replyInquiry(selectedInquiry._id, trimmed, token);
      if (res?.inquiry) {
        setInquiries(inquiries.map(inc => inc._id === selectedInquiry._id ? res.inquiry : inc));
        setSelectedInquiry(res.inquiry);
      }
      setReplyText('');
      if (res?.duplicatePrevented) {
        toast.success('Reply already saved.');
      } else if (res?.notificationSent) {
        toast.success('Reply saved & delivered to student notifications!');
      } else {
        toast.success(res?.message || 'Reply saved to inquiry history.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredInquiries = inquiries
    .filter(inc => statusFilter === 'All' || inc.status === statusFilter)
    .filter(inc => 
      inc.fullName.toLowerCase().includes(search.toLowerCase()) ||
      inc.email.toLowerCase().includes(search.toLowerCase()) ||
      inc.mobile.includes(search) ||
      inc.subject.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'Latest First') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'Oldest First') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'Pending First') return (a.status === 'Pending' ? -1 : 1);
      if (sortOrder === 'Resolved First') return (a.status === 'Resolved' ? -1 : 1);
      return 0;
    });

  // Stats
  const total = inquiries.length;
  const pending = inquiries.filter(i => i.status === 'Pending').length;
  const resolved = inquiries.filter(i => i.status === 'Resolved').length;
  const today = inquiries.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contact Inquiries</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and reply to website contact submissions.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Inquiries</p>
          <p className="text-2xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Today's Inquiries</p>
          <p className="text-2xl font-bold text-blue-600">{today}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, email, mobile, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Spam">Spam</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50">
            <option value="Latest First">Latest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Pending First">Pending First</option>
            <option value="Resolved First">Resolved First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Name</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Contact Info</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Subject</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No inquiries found</td>
                  </tr>
                ) : filteredInquiries.map(inc => (
                  <tr 
                    key={inc._id} 
                    id={`inquiry-${inc._id}`}
                    className={`transition-colors ${
                      selectedInquiry?._id === inc._id 
                        ? 'bg-blue-50/90 ring-2 ring-blue-400 font-semibold' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-4 font-medium text-slate-800">{inc.fullName}</td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {inc.mobile}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {inc.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 text-sm max-w-[200px] truncate">{inc.subject}</td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(inc.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        inc.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        inc.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                        inc.status === 'Spam' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openInquiryModal(inc)} className="text-blue-600 hover:text-blue-800 font-medium text-sm cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No inquiries found</div>
            ) : filteredInquiries.map(inc => (
              <div key={inc._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-lg">{inc.fullName}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    inc.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                    inc.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                    inc.status === 'Spam' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {inc.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400"/> {inc.mobile}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400"/> {inc.email}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-700 text-sm">{inc.subject}</p>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{inc.message}</p>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">{new Date(inc.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(inc._id, 'Resolved')} className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg">Resolved</button>
                    <button onClick={() => openInquiryModal(inc)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg">Reply</button>
                    <button onClick={() => handleDelete(inc._id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur">
              <h3 className="font-bold text-xl text-slate-800">Inquiry Details</h3>
              <button onClick={() => setSelectedInquiry(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Customer Details</p>
                  <p className="font-semibold text-slate-800 text-lg">{selectedInquiry.fullName}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4"/> {selectedInquiry.mobile}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="w-4 h-4"/> {selectedInquiry.email}</p>
                  <div className="pt-1.5 space-y-2">
                    {selectedInquiry.userId || selectedInquiry.user ? (
                      <div className="inline-flex flex-col gap-0.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Verified Account Linked (Notifications Enabled)
                        </span>
                        {typeof selectedInquiry.userId === 'object' && selectedInquiry.userId?.email && (
                          <span className="text-emerald-700">
                            {selectedInquiry.userId.fullName || selectedInquiry.userId.name} • {selectedInquiry.userId.email}
                          </span>
                        )}
                      </div>
                    ) : selectedInquiry.suggestedVerifiedUser ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-[11px]">
                        <p className="font-semibold text-amber-900">
                          Verified Account Found: {selectedInquiry.suggestedVerifiedUser.name} ({selectedInquiry.suggestedVerifiedUser.email})
                        </p>
                        <p className="text-amber-700">
                          {selectedInquiry.suggestedVerifiedUser.mobileMatches
                            ? 'Email and mobile match. Replies will auto-link & notify.'
                            : 'Email verified, but mobile differs. Verify identity before associating.'}
                        </p>
                        <button
                          type="button"
                          disabled={associating}
                          onClick={() => handleAssociateAccount(selectedInquiry._id, selectedInquiry.suggestedVerifiedUser._id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {associating ? 'Associating...' : 'Associate Verified Account & Sync'}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3" /> Guest Submission (No Verified Account)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Status & Date</p>
                  <div>
                    <select 
                      value={selectedInquiry.status}
                      onChange={e => handleUpdateStatus(selectedInquiry._id, e.target.value)}
                      className="px-3 py-1.5 text-sm font-semibold border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Spam">Spam</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-500">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Subject: {selectedInquiry.subject}</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Reply className="w-5 h-5"/> Admin Reply System</h4>
                
                {(() => {
                  const historyList = Array.isArray(selectedInquiry.replies) && selectedInquiry.replies.length > 0
                    ? selectedInquiry.replies
                    : (selectedInquiry.adminReply
                        ? [{
                            _id: 'legacy',
                            replyMessage: selectedInquiry.adminReply,
                            repliedByName: 'Admin',
                            repliedByRole: 'admin',
                            repliedAt: selectedInquiry.repliedAt || selectedInquiry.updatedAt
                          }]
                        : []);

                  if (historyList.length === 0) return null;

                  return (
                    <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Previous Replies ({historyList.length})
                      </p>
                      {historyList.map((rep: any, idx: number) => (
                        <div key={rep._id || idx} className="bg-blue-50/90 border border-blue-100 p-4 rounded-xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-blue-800">
                              {rep.repliedByName || 'Admin'} ({(rep.repliedByRole || rep.senderRole) === 'superadmin' ? 'SuperAdmin' : 'Admin'})
                            </span>
                            <div className="flex items-center gap-2">
                              {rep.deliveredToNotification ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  <CheckCircle className="w-3 h-3" /> Delivered to Student
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                                  Saved in History
                                </span>
                              )}
                              <span className="text-[11px] text-blue-600 font-medium">
                                {rep.repliedAt || rep.createdAt ? new Date(rep.repliedAt || rep.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-blue-950 whitespace-pre-wrap leading-relaxed">{rep.replyMessage || rep.message}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <form onSubmit={handleReply}>
                  <textarea 
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    disabled={sendingReply}
                    rows={4} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-3 disabled:bg-slate-50"
                    placeholder="Write a reply message... (This will be saved permanently in MongoDB)"
                  ></textarea>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={sendingReply}
                      onClick={() => handleDelete(selectedInquiry._id)}
                      className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Delete Inquiry
                    </button>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
