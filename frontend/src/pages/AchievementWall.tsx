import React from 'react';
import { Medal, Star, Award, Flame } from 'lucide-react';

export default function AchievementWall() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Achievement Wall</h1>
        <p className="text-slate-600 mb-8">Celebrating our top performers and their milestones.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Top XP Holders</h2>
            {/* List top XP holders here */}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Highest Streaks</h2>
            {/* List highest streaks here */}
          </div>
        </div>
      </div>
    </div>
  );
}