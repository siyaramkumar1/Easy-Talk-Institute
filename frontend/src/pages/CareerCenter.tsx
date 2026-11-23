import React from 'react';
import { Building2, Mail, Users } from 'lucide-react';

export default function CareerCenter() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Career Center</h1>
        <p className="text-slate-600 mb-8">Master business English, office communication, and email writing.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0"><Mail className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold text-lg mb-1">Email Writing Course</h3>
              <p className="text-slate-600 text-sm">Learn professional email formats, etiquette, and useful phrases for corporate communication.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Building2 className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold text-lg mb-1">Business English</h3>
              <p className="text-slate-600 text-sm">Vocabulary and idioms for meetings, presentations, and negotiations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
