import React, { useState } from 'react';
import { Search, Filter, Calendar, Users, Clock, BookOpen, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePublicBatches } from '../hooks/useBatches';
import { courseService } from '../services/courseService';

export default function Batches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = (searchParams.get('status') || '').trim().toLowerCase();
  const currentStatus = ['active', 'upcoming', 'completed'].includes(rawStatus) ? rawStatus : 'all';

  const { batches, loading } = usePublicBatches(currentStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');

  // Fetch courses list for course filter dropdown
  const { data: allCourses = [] } = useQuery({
    queryKey: ['courses', 'public', 'titles'],
    queryFn: async () => {
      const res = await courseService.getAll('Active');
      return Array.isArray(res) ? res : [];
    }
  });

  const courses = Array.from(
    new Set([
      ...allCourses.map((c: any) => c.title).filter(Boolean),
      ...(Array.isArray(batches) ? batches : []).map(b => b.course?.title).filter(Boolean)
    ])
  );

  const handleStatusChange = (newStatus: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!newStatus || newStatus === 'all') {
      nextParams.delete('status');
    } else {
      nextParams.set('status', newStatus.toLowerCase());
    }
    setSearchParams(nextParams);
  };

  const statusTabs = [
    { id: 'all', label: 'All Batches', badge: null, activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-500/20' },
    { id: 'active', label: 'Active Batches', badge: '🟢', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' },
    { id: 'upcoming', label: 'Upcoming Batches', badge: '🟡', activeClass: 'bg-amber-500 text-white shadow-md shadow-amber-500/20' },
    { id: 'completed', label: 'Completed Batches', badge: '⚫', activeClass: 'bg-slate-700 text-white shadow-md shadow-slate-700/20' },
  ];
  
  const filteredBatches = (Array.isArray(batches) ? batches : []).filter(b => {
    const matchesSearch = 
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.trainer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === 'All' || b.course?.title === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const isCompletedOnly = currentStatus === 'completed';
  const mainGridBatches = isCompletedOnly 
    ? filteredBatches 
    : filteredBatches.filter(b => (b.status || '').toLowerCase() !== 'completed');
  const completedGridBatches = isCompletedOnly 
    ? [] 
    : filteredBatches.filter(b => (b.status || '').toLowerCase() === 'completed');

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Available Learning Batches</h1>
          <p className="text-lg text-slate-600">Join our interactive learning batches designed to help you master English with expert trainers.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {statusTabs.map(tab => {
            const isActive = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? tab.activeClass
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                }`}
              >
                {tab.badge && <span>{tab.badge}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search batches or trainers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Filter className="w-5 h-5 text-slate-400 shrink-0" />
             <select 
               value={filterCourse}
               onChange={e => setFilterCourse(e.target.value)}
               className="w-full md:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
             >
               <option value="All">All Courses</option>
               { (Array.isArray(courses) ? courses : []).map((course: any) => (
                 <option key={course} value={course}>{course}</option>
               ))}
             </select>

             <select 
               value={currentStatus}
               onChange={e => handleStatusChange(e.target.value)}
               className="w-full md:w-44 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
             >
               <option value="all">All Statuses</option>
               <option value="active">Active Only</option>
               <option value="upcoming">Upcoming Only</option>
               <option value="completed">Completed Only</option>
             </select>
          </div>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse">
                <div className="w-full h-48 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
             <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-3">No Batches Found</h3>
             <p className="text-slate-600 mb-6">
               {currentStatus !== 'all' 
                 ? `We couldn't find any ${currentStatus} batches matching your current criteria.`
                 : "We couldn't find any batches matching your current filters."}
             </p>
             <button 
               onClick={() => { 
                 setSearchQuery(''); 
                 setFilterCourse('All'); 
                 handleStatusChange('all');
               }} 
               className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
             >
               Clear All Filters
             </button>
          </div>
        ) : (
          <>
          {mainGridBatches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {mainGridBatches.map(batch => {
                const seatsAvailable = Math.max(0, batch.capacity - (batch.enrolledStudents || 0));
                const batchStatusLower = (batch.status || '').toLowerCase();
                
                let statusBadge = null;
                let btnConfig = { text: 'View Details', link: `/reserve-seat?batchId=${batch._id}`, disabled: false, color: 'bg-blue-600 hover:bg-blue-700' };
                
                if (batchStatusLower === 'upcoming') {
                  statusBadge = <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">🟡 Upcoming</span>;
                  btnConfig = { text: 'Reserve Seat', link: `/reserve-seat?batchId=${batch._id}`, disabled: seatsAvailable <= 0, color: 'bg-orange-500 hover:bg-orange-600' };
                } else if (batchStatusLower === 'active') {
                  statusBadge = <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">🟢 Active</span>;
                  btnConfig = { text: 'Join Now', link: `/reserve-seat?batchId=${batch._id}`, disabled: seatsAvailable <= 0, color: 'bg-emerald-600 hover:bg-emerald-700' };
                } else if (batchStatusLower === 'completed') {
                  statusBadge = <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">⚫ Completed</span>;
                  btnConfig = { text: 'Batch Completed', link: '#', disabled: true, color: 'bg-slate-300 text-slate-500' };
                }
                
                if (seatsAvailable <= 0 && batchStatusLower !== 'completed') {
                  btnConfig = { text: 'Full', link: '#', disabled: true, color: 'bg-slate-200 text-slate-400' };
                }

                return (
                  <div key={batch._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
                    <div className="p-6 flex-1 flex flex-col pt-8 relative">
                       <div className="absolute top-4 right-4 z-10 flex gap-2">
                         {statusBadge}
                         {batch.course?.title && (
                           <span className="bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                             {batch.course.title}
                           </span>
                         )}
                       </div>
                       
                       <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 mt-2">{batch.name}</h3>
                       
                       <div className="space-y-3 mb-6 flex-1 bg-slate-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-orange-600 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-700">Trainer: {batch.trainer}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-blue-600 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-700">{batch.timing}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-white shadow-sm text-green-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-700">
                            {new Date(batch.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} 
                             &nbsp;-&nbsp; 
                             {new Date(batch.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-3 gap-2 text-center mb-2.5">
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Seats</span>
                            <span className="text-sm font-black text-slate-800">{batch.capacity}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Filled</span>
                            <span className="text-sm font-black text-blue-600">{batch.enrolledStudents || 0}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Available</span>
                            <span className={`text-sm font-black ${seatsAvailable <= 3 && batch.status !== 'Completed' ? 'text-red-500' : 'text-emerald-600'}`}>
                              {seatsAvailable}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                           <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, ((batch.enrolledStudents || 0) / (batch.capacity || 1)) * 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center gap-2">
                        <Link
                          to={batch.course?.slug ? `/course/${batch.course.slug}` : `/reserve-seat?batchId=${batch._id}`}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold text-center text-xs sm:text-sm transition-colors"
                        >
                          View Details
                        </Link>
                        <Link 
                          to={btnConfig.link} 
                          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex justify-center items-center gap-1.5 transition-colors text-xs sm:text-sm ${btnConfig.disabled ? btnConfig.color + ' cursor-not-allowed' : btnConfig.color + ' text-white shadow-xs'}`}
                          onClick={e => { if (btnConfig.disabled) e.preventDefault(); }}
                        >
                          <span>{batchStatusLower === 'active' ? 'Join Now' : btnConfig.text}</span>
                          {!btnConfig.disabled && <ArrowRight className="w-3.5 h-3.5" />}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {completedGridBatches.length > 0 && (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 mt-12">Completed Batches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {completedGridBatches.map(batch => {
                  let statusBadge = <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">⚫ Completed</span>;
                  
                  return (
                    <div key={batch._id} className="bg-slate-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group relative opacity-75">
                      <div className="p-6 flex-1 flex flex-col pt-8 relative">
                         <div className="absolute top-4 right-4 z-10 flex gap-2">
                           {statusBadge}
                           {batch.course?.title && (
                             <span className="bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                               {batch.course.title}
                             </span>
                           )}
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 mt-2">{batch.name}</h3>
                         <div className="space-y-3 mb-6 flex-1 bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <span className="font-medium">Trainer: {batch.trainer}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <span className="font-medium">{batch.timing}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <span className="font-medium">
                              {new Date(batch.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                                &nbsp;-&nbsp;
                                {new Date(batch.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <button disabled className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-slate-300 text-slate-500 cursor-not-allowed">
                            Batch Completed
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </>
        )}
      </div>
    </div>
  );
}
