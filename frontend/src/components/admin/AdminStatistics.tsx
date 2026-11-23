import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statisticService, Statistic } from '../../services/statisticService';
import { Plus, Edit2, Trash2, X, Users, Award, BookOpen, Star, Mic, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const ICONS = {
  Users, Award, BookOpen, Star, Mic, Calendar
};

export default function AdminStatistics() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<Statistic | null>(null);
  const [formData, setFormData] = useState<Partial<Statistic>>({
    section: 'testimonials',
    label: '',
    value: '',
    icon: 'Users',
    status: 'Active',
    displayOrder: 0
  });

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: () => statisticService.getStatistics()
  });

  const createMutation = useMutation({
    mutationFn: statisticService.createStatistic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('✓ Changes saved successfully', { duration: 3000 });
      handleCloseModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save changes')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Statistic> }) => statisticService.updateStatistic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('✓ Changes saved successfully', { duration: 3000 });
      handleCloseModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save changes')
  });

  const deleteMutation = useMutation({
    mutationFn: statisticService.deleteStatistic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('✓ Changes saved successfully', { duration: 3000 });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete statistic')
  });

  const handleOpenModal = (stat?: Statistic) => {
    if (stat) {
      setEditingStat(stat);
      setFormData(stat);
    } else {
      setEditingStat(null);
      setFormData({
        section: 'testimonials',
        label: '',
        value: '',
        icon: 'Users',
        status: 'Active',
        displayOrder: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStat) {
      updateMutation.mutate({ id: editingStat._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this statistic?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusToggle = (stat: Statistic) => {
    const newStatus = stat.status === 'Active' ? 'Hidden' : 'Active';
    updateMutation.mutate({ id: stat._id, data: { status: newStatus } });
  };

  if (isLoading) return <div className="p-8 text-center">Loading statistics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manage Statistics</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Statistic
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-medium text-slate-600">Section</th>
              <th className="p-4 font-medium text-slate-600">Label</th>
              <th className="p-4 font-medium text-slate-600">Value</th>
              <th className="p-4 font-medium text-slate-600">Icon</th>
              <th className="p-4 font-medium text-slate-600">Status</th>
              <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(stats) ? stats : []).map((stat: Statistic) => {
              const IconComp = (ICONS as any)[stat.icon || 'Users'] || Users;
              return (
                <tr key={stat._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 capitalize">{stat.section}</td>
                  <td className="p-4 font-medium">{stat.label}</td>
                  <td className="p-4">{stat.value}</td>
                  <td className="p-4">
                    <IconComp className="w-5 h-5 text-slate-500" />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusToggle(stat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        stat.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {stat.status}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(stat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stat._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {stats.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No statistics found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingStat ? 'Edit Statistic' : 'Add Statistic'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="testimonials">Student Success Stories (Testimonials)</option>
                  <option value="gallery">Institute Gallery (Gallery)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g. Total Students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Value (Number/Text)</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g. 5,000+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(ICONS).map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Hidden' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
