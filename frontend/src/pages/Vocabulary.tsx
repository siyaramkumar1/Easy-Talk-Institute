import { BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Vocabulary() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">Vocabulary Builder</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Enhance your word power to express yourself clearly and confidently.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Daily Use Words', desc: 'Common words for everyday conversation.', count: 500 },
            { title: 'Idioms & Phrases', desc: 'Common expressions that make you sound native.', count: 200 },
            { title: 'Phrasal Verbs', desc: 'Essential verbs combined with prepositions.', count: 300 },
            { title: 'Synonyms & Antonyms', desc: 'Expand your range of expression.', count: 1000 },
            { title: 'Professional English', desc: 'Vocabulary for the workplace and interviews.', count: 400 },
            { title: 'Confusing Words', desc: 'Words that sound similar but mean different things.', count: 150 }
          ].map((topic, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-slate-800 mb-2">{topic.title}</h3>
              <p className="text-slate-600 mb-4 flex-1">{topic.desc}</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-400">{topic.count}+ Words</span>
                <Link to="/courses" className="text-blue-600 font-medium hover:text-blue-700 text-sm">
                  Start Learning &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
