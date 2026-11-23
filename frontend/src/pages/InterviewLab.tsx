import React from 'react';
import { Briefcase, Video, FileText, CheckCircle } from 'lucide-react';

export default function InterviewLab() {
  const modules = [
    { title: 'Self Introduction', icon: Video, desc: 'Learn to introduce yourself confidently in 60 seconds.' },
    { title: 'HR Questions', icon: FileText, desc: 'Practice top 50 most asked HR interview questions.' },
    { title: 'Mock Interview', icon: Video, desc: 'Take a complete mock interview with AI.' },
    { title: 'Communication Skills', icon: CheckCircle, desc: 'Tips for body language and voice modulation.' }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Interview Lab</h1>
        <p className="text-slate-600 mb-8">Prepare for your dream job with our comprehensive interview preparation modules.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <m.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{m.title}</h3>
              <p className="text-slate-600 text-sm mb-4">{m.desc}</p>
              <button className="text-indigo-600 font-medium text-sm flex items-center gap-1">Start Module &rarr;</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
