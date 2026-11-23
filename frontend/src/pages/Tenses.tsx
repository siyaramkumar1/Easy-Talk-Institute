import { BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Tenses() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">Mastering Tenses</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Tenses are the backbone of English. Learn how to express time correctly.</p>
        </div>

        <div className="space-y-8">
          {/* Present Tense */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-950 mb-6 border-b border-slate-100 pb-4">Present Tense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Simple Present', ex: 'I play tennis every Sunday.' },
                { name: 'Present Continuous', ex: 'I am playing tennis right now.' },
                { name: 'Present Perfect', ex: 'I have played tennis for 5 years.' },
                { name: 'Present Perfect Continuous', ex: 'I have been playing tennis since morning.' }
              ].map((t, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-1">{t.name}</h4>
                  <p className="text-slate-600 text-sm italic">"{t.ex}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Past Tense */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-950 mb-6 border-b border-slate-100 pb-4">Past Tense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Simple Past', ex: 'I played tennis yesterday.' },
                { name: 'Past Continuous', ex: 'I was playing tennis when it started to rain.' },
                { name: 'Past Perfect', ex: 'I had played tennis before she arrived.' },
                { name: 'Past Perfect Continuous', ex: 'I had been playing tennis for an hour before it rained.' }
              ].map((t, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-1">{t.name}</h4>
                  <p className="text-slate-600 text-sm italic">"{t.ex}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Future Tense */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-950 mb-6 border-b border-slate-100 pb-4">Future Tense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Simple Future', ex: 'I will play tennis tomorrow.' },
                { name: 'Future Continuous', ex: 'I will be playing tennis at 10 AM tomorrow.' },
                { name: 'Future Perfect', ex: 'I will have played tennis by noon.' },
                { name: 'Future Perfect Continuous', ex: 'I will have been playing tennis for 2 hours by noon.' }
              ].map((t, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-1">{t.name}</h4>
                  <p className="text-slate-600 text-sm italic">"{t.ex}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
