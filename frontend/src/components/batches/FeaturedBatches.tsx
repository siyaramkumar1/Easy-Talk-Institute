import React from 'react';
import { ArrowRight, Users, Clock, Calendar, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export const FeaturedBatches = () => {
  const { data: allBatches = [], isLoading: loading } = useQuery({
    queryKey: ['publicBatches'],
    queryFn: async () => {
      const res = await axios.get('/api/batches/public');
      return res.data;
    }
  });

  const { data: batchStats } = useQuery({
    queryKey: ['homeBatchStats'],
    queryFn: async () => {
      const res = await axios.get('/api/batches/home');
      return res.data;
    }
  });

  const activeCount = batchStats?.activeCount ?? allBatches.filter((b: any) => b.status === 'Active').length;
  const upcomingCount = batchStats?.upcomingCount ?? allBatches.filter((b: any) => b.status === 'Upcoming').length;

  const batches = allBatches.filter((b: any) => b.status === 'Active' || b.status === 'Upcoming');

  if (loading && batches.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Admissions Open · Interactive Batches
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active & Upcoming Batches
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1 max-w-xl">
            Learn live with Siyaram Kumar and master practical spoken English in structured daily cohorts.
          </p>
        </div>

        <Link
          to="/batches"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl border border-blue-200/60 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>View All Batches</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Batch Cards Grid */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-[18px] p-8 text-center border border-slate-200 shadow-xs">
          <p className="text-slate-600 font-medium text-sm">New batches are being scheduled. Check back soon or reserve in advance.</p>
          <Link to="/reserve-seat" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Reserve Your Seat Early <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch: any) => {
            const capacity = batch.capacity || 25;
            const enrolled = batch.enrolledStudents || 0;
            const seatsAvailable = Math.max(0, capacity - enrolled);
            const fillPercentage = Math.min(100, Math.round((enrolled / capacity) * 100));

            const isActive = batch.status === 'Active';
            const isUpcoming = batch.status === 'Upcoming';

            // Button label & behavior as requested:
            // "Buttons: Join Now (for Active), Reserve Seat (for Upcoming)"
            const isFull = seatsAvailable <= 0;
            const buttonText = isFull ? 'Batch Full' : (isActive ? 'Join Now' : 'Reserve Seat');
            const buttonLink = isFull ? '#' : `/reserve-seat?batchId=${batch._id}`;
            const buttonBg = isFull
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : isActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs';

            const formattedStartDate = batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible';
            const formattedEndDate = batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

            return (
              <div
                key={batch._id}
                className="bg-white rounded-[18px] border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between group hover:border-blue-300 relative"
              >
                <div>
                  {/* Card Header: 🟢 Active or 🟡 Upcoming + Course Name */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isActive ? '🟢 Active' : '🟡 Upcoming'}
                    </span>

                    {/* Course Badge / Title */}
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 truncate max-w-[140px]">
                      {batch.course?.title || 'Spoken English'}
                    </span>
                  </div>

                  {/* Batch Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-3">
                    {batch.name}
                  </h3>

                  {/* Batch Details: Trainer, Date, Time */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2.5 mb-4">
                    {/* Trainer */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <div className="flex items-baseline gap-1 truncate">
                        <span className="text-slate-400 font-normal">Trainer:</span>
                        <span className="font-bold text-slate-900 truncate">
                          {batch.trainer || 'Siyaram Kumar'}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-1 truncate">
                        <span className="text-slate-400 font-normal">Date:</span>
                        <span className="font-semibold text-slate-800 truncate">
                          {formattedStartDate} {formattedEndDate ? `- ${formattedEndDate}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-1 truncate">
                        <span className="text-slate-400 font-normal">Time:</span>
                        <span className="font-semibold text-slate-800 truncate">
                          {batch.timing || 'Daily 1 Hour'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Information: Seats Filled & Available Seats */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">
                        Seats Filled: <strong className="text-slate-900">{enrolled}</strong>
                      </span>
                      <span className={seatsAvailable <= 5 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {seatsAvailable} Available
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          seatsAvailable <= 5 ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Join Now or Reserve Seat */}
                <div className="mt-auto pt-2">
                  <Link
                    to={buttonLink}
                    onClick={(e) => {
                      if (isFull) e.preventDefault();
                    }}
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all text-center ${buttonBg}`}
                  >
                    <span>{buttonText}</span>
                    {!isFull && <ArrowRight className="w-4 h-4" />}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
