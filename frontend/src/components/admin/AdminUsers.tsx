import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Shield, User, Loader2, CheckCircle, XCircle, AlertCircle, Phone, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const AdminUsers = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    mobile: '', 
    password: '', 
    role: 'admin', 
    status: 'Active' 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Strictly request roleGroup=admin from server
      const res = await axios.get('/api/admin/users?roleGroup=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      // Additional safety guard: Filter ONLY admin and superadmin accounts
      const adminOnly = data.filter((u: any) => u.role === 'admin' || u.role === 'superadmin');
      setUsers(adminOnly);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
      toast.error('Failed to load admin users directory');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Inactive' ? 'Active' : 'Inactive';
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/users/${userId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Admin account status updated to ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update admin status');
    }
  };

  const handleDelete = async (userToDelete: any) => {
    if (userToDelete._id === currentUser?.id) {
      toast.error('You cannot delete your own logged-in account');
      return;
    }
    if (userToDelete.role === 'superadmin' && currentUser?.role !== 'superadmin') {
      toast.error('Only SuperAdmin can delete SuperAdmin accounts');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete administrative account "${userToDelete.name}" (${userToDelete.email})? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/users/${userToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Admin account "${userToDelete.name}" deleted successfully`);
        fetchUsers();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to delete administrative account');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanMobile = formData.mobile.trim().replace(/\D/g, '');
      if (cleanMobile && cleanMobile.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/users', {
        ...formData,
        mobile: cleanMobile || '9431885389'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin account created successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', mobile: '', password: '', role: 'admin', status: 'Active' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanMobile = (formData.mobile || '').trim().replace(/\D/g, '');
      if (cleanMobile && cleanMobile.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${editingUser._id}`, {
        name: formData.name,
        email: formData.email,
        mobile: cleanMobile || editingUser.mobile,
        role: formData.role,
        status: formData.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin account updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update admin account');
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      mobile: u.mobile || u.mobileNumber || '',
      password: '',
      role: u.role || 'admin',
      status: u.status || 'Active'
    });
    setShowEditModal(true);
  };

  // Filtered & Paginated records
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toString().includes(q));

      const matchesStatus = 
        statusFilter === 'All' ? true :
        statusFilter === 'Active' ? (u.status !== 'Inactive') :
        (u.status === 'Inactive');

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, page, itemsPerPage]);

  const superAdminCount = users.filter(u => u.role === 'superadmin').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Admin Users</h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Privileged administrative directory. Displays only SuperAdmin and Admin accounts with portal access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {superAdminCount} SuperAdmin{superAdminCount !== 1 ? 's' : ''} • {adminCount} Admin{adminCount !== 1 ? 's' : ''}
          </span>
          
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                setFormData({ name: '', email: '', mobile: '', password: '', role: 'admin', status: 'Active' });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Admin
            </button>
          )}
        </div>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by admin name, email, or mobile..."
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'All' ? `All (${users.length})` : 
                 status === 'Active' ? `Active (${users.filter((u: any) => u.status !== 'Inactive').length})` : 
                 `Inactive (${users.filter((u: any) => u.status === 'Inactive').length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading administrative accounts from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-4">Admin Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map((u) => {
                  const isSuperAdmin = u.role === 'superadmin';
                  const canEdit = currentUser?.role === 'superadmin' || (currentUser?.role === 'admin' && !isSuperAdmin);
                  const canDelete = currentUser?.role === 'superadmin' && u._id !== currentUser?.id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                            isSuperAdmin 
                              ? 'bg-gradient-to-tr from-red-600 to-rose-600 shadow-xs shadow-red-500/20' 
                              : 'bg-gradient-to-tr from-orange-500 to-amber-600 shadow-xs shadow-orange-500/20'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                            <span className="text-[11px] font-semibold text-slate-400 capitalize">
                              {isSuperAdmin ? 'Full Access SuperAdmin' : 'Admin Staff'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-4 text-slate-600 font-mono text-xs select-all">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="p-4 text-slate-700 font-mono text-xs select-all">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.mobile || u.mobileNumber || '9431885389'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isSuperAdmin 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={!canEdit || u._id === currentUser?.id}
                          onClick={() => handleStatusChange(u._id, u.status)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                            !canEdit || u._id === currentUser?.id ? 'cursor-default' : 'cursor-pointer hover:opacity-85'
                          } ${
                            u.status === 'Inactive' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title={canEdit && u._id !== currentUser?.id ? 'Click to toggle status' : 'Current account status'}
                        >
                          {u.status || 'Active'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button 
                              onClick={() => openEditModal(u)} 
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                              title="Edit Admin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canEdit && u._id !== currentUser?.id && (
                            u.status !== 'Inactive' ? (
                              <button 
                                onClick={() => handleStatusChange(u._id, 'Active')} 
                                className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer" 
                                title="Deactivate Account"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleStatusChange(u._id, 'Inactive')} 
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                title="Activate Account"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )
                          )}
                          
                          {canDelete && (
                            <button 
                              onClick={() => handleDelete(u)} 
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                              title="Delete Admin Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <p className="text-base font-semibold text-slate-700">No admin accounts found</p>
                      <p className="text-xs text-slate-400 mt-1">Try modifying your search query or status filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold font-mono text-slate-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-bold font-mono text-slate-900">{Math.min(page * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold font-mono text-slate-900">{filteredUsers.length}</span> admin accounts
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium transition-colors cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-800">
                  {showEditModal ? 'Edit Admin Account' : 'Create Admin Account'}
                </h2>
              </div>
              <button 
                onClick={() => { setShowModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={showEditModal ? handleEditSubmit : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Siyaram Kumar"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="admin@easytalk.in"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mobile Number (10 Digits)</label>
                <input 
                  required 
                  type="tel" 
                  maxLength={10}
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} 
                  placeholder="9431885389"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" 
                />
              </div>

              {!showEditModal && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Password</label>
                  <input 
                    required 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="Enter secure password"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Administrative Role</label>
                {currentUser?.role === 'superadmin' ? (
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                ) : (
                  <input 
                    type="text" 
                    readOnly 
                    value="Admin" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 cursor-not-allowed font-medium" 
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {currentUser?.role === 'superadmin' 
                    ? 'SuperAdmin has full access. Admin has delegated management rights.'
                    : 'Admins can manage courses, batches, tests, and student records.'}
                </p>
              </div>

              {showEditModal && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setShowEditModal(false); }} 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {showEditModal ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
