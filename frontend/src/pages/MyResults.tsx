import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Award, Clock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function MyResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchResults = async () => {
      try {
        const res = await axios.get('/api/tests/my-results');
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [isAuthenticated, navigate]);

  if (loading) return <div className="pt-32 min-h-screen text-center">Loading...</div>;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">My Test Results</h1>
        
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">No tests taken yet</h2>
            <p className="text-slate-500 mb-6">Take your first assessment test to evaluate your English level.</p>
            <button onClick={() => navigate('/tests')} className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700">
              Explore Tests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result, idx) => (
              <div key={result._id || idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{result.testName || 'English Assessment Test'}</h3>
                    <div className="flex items-center text-slate-500 text-sm gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(result.completedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-lg">
                    {result.percentage}%
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-6 mt-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">English Level:</span>
                    <span className="font-bold text-slate-800">{result.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Score:</span>
                    <span className="font-medium text-slate-800">{result.score} correct</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/results/${result._id}`, { state: { result } })}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  View Full Result <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
