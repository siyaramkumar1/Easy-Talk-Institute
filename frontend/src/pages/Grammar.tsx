import { BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Grammar() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">English Grammar Rules</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Master the foundation of the English language with our comprehensive grammar lessons.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'Parts of Speech', desc: 'Nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections.' },
            { title: 'Sentence Structure', desc: 'Subject, predicate, clauses, phrases, and different types of sentences.' },
            { title: 'Subject-Verb Agreement', desc: 'Rules for ensuring subjects and verbs agree in number and person.' },
            { title: 'Active and Passive Voice', desc: 'Understanding voice and when to use each for effective writing.' },
            { title: 'Direct and Indirect Speech', desc: 'Reporting what others say correctly.' },
            { title: 'Articles and Determiners', desc: 'Correct usage of a, an, the, and other determiners.' }
          ].map((topic, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{topic.title}</h3>
                <p className="text-slate-600 mb-4">{topic.desc}</p>
                <Link to="/courses" className="text-orange-500 font-medium hover:text-orange-600 text-sm flex items-center gap-1">
                  View Lessons <CheckCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
