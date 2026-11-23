import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { q: 'Who is Siyaram Kumar?', a: 'Siyaram Kumar is an experienced English trainer with an M.A. in English. He has helped thousands of students achieve fluency through his practical and structured teaching methods.' },
    { q: 'Are these courses suitable for absolute beginners?', a: 'Yes! Our "Basic to Advanced" courses start from the very fundamentals, making them perfect for those who are just starting out.' },
    { q: 'Can I access the courses on my mobile phone?', a: 'Absolutely. Easy Talk is a fully mobile-responsive platform. You can learn on your phone, tablet, or computer.' },
    { q: 'How long does it take to become fluent?', a: 'Fluency depends on your current level and how much time you dedicate to practice. Most students notice significant improvement within 3 to 6 months of consistent study.' },
    { q: 'Do you offer live classes or pre-recorded videos?', a: 'Our platform primarily features high-quality pre-recorded video lessons that you can watch at your own pace. We also occasionally host live doubt-clearing sessions.' }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-600 text-lg">Find answers to common questions about Easy Talk and our courses.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <button 
                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                <span className="font-bold text-slate-800">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-4 text-slate-600 border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center bg-blue-50 p-8 rounded-2xl border border-blue-100">
          <h3 className="text-xl font-bold text-blue-950 mb-2">Still have questions?</h3>
          <p className="text-slate-600 mb-6">Contact our support team and we'll be happy to help.</p>
          <a href="/contact" className="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
