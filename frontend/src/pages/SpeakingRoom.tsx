import React from 'react';
import { Mic, Users, MessageCircle } from 'lucide-react';

export default function SpeakingRoom() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Speaking Room</h1>
        <p className="text-slate-600 mb-8">Join interactive discussion topics, debate sessions, and fluency challenges.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-600" /> Today's Topic</h3>
            <p className="text-slate-700 italic">"Does technology isolate us or connect us?"</p>
            <button className="mt-4 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 w-full">Join Discussion</button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-orange-600" /> Debate Session</h3>
            <p className="text-slate-700">Next session starts in: 2h 30m</p>
            <button className="mt-4 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-200 w-full">Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}
