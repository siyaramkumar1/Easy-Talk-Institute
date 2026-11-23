import { BookOpen, CheckCircle, FileText, ArrowRight, PlayCircle } from 'lucide-react';

export default function SpokenEnglish() {
  const sections = [
    { title: 'Introduction', lessons: 5, duration: '2.5 hrs' },
    { title: 'Daily Conversation', lessons: 8, duration: '4 hrs' },
    { title: 'Self Introduction', lessons: 3, duration: '1.5 hrs' },
    { title: 'Office Communication', lessons: 6, duration: '3 hrs' },
    { title: 'Telephone English', lessons: 4, duration: '2 hrs' },
    { title: 'Travel English', lessons: 5, duration: '2.5 hrs' },
    { title: 'Shopping English', lessons: 4, duration: '2 hrs' },
    { title: 'Group Discussion', lessons: 6, duration: '3.5 hrs' },
    { title: 'Interview Communication', lessons: 8, duration: '5 hrs' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-950 text-white rounded-3xl p-8 md:p-12 mb-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 md:w-2/3">
            <span className="inline-block py-1 px-3 rounded-full bg-orange-500/20 text-orange-400 font-semibold text-sm mb-4">
              Premium Module
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Complete Spoken English</h1>
            <p className="text-blue-100 text-lg mb-8 max-w-xl">
              Master fluent English speaking with Siyaram Kumar. Learn from basic to advanced real-world conversation scenarios.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" /> Start Learning
              </button>
              <button className="bg-white/10 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                View Syllabus
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full hidden md:block opacity-20 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80')] bg-cover bg-center [mask-image:linear-gradient(to_left,black,transparent)]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-blue-950 mb-6">Course Modules</h2>
            {sections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{section.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {section.lessons} Classroom Sessions</span>
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Printed Notes</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Group Practice</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-medium text-slate-400">{section.duration}</span>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-blue-950 mb-4">Course Features</h3>
              <ul className="space-y-4">
                {[
                  '50+ Interactive Classroom Sessions',
                  'Daily Group Discussions',
                  'Real-world Conversation Practice',
                  'Live Doubt Clearing Sessions',
                  'Printed & PDF Study Materials'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-2">Instructor</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                    SK
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Siyaram Kumar</p>
                    <p className="text-sm text-slate-500">M.A. English</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
