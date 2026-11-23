import { Award, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function About() {
  const { data: liveStats } = useQuery({
    queryKey: ['liveInstituteStats'],
    queryFn: async () => {
      const res = await axios.get('/api/statistics/live');
      return res.data;
    }
  });

  const totalStudents = liveStats?.totalStudents ?? 0;
  const totalCourses = liveStats?.totalCourses ?? 0;
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-blue-950 text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Easy Talk</h1>
          <p className="text-xl text-blue-200">
            Empowering individuals to communicate confidently through practical, engaging, and accessible English education.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800" alt="Teaching" className="rounded-2xl shadow-xl w-full" />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Our Mission</h2>
              <p className="text-slate-600 mb-4 text-lg">
                At Easy Talk, we believe that mastering English should not be a daunting task. Our platform is built on the philosophy of teaching "बिल्कुल Basic से Advanced तक" (from absolute basics to advanced).
              </p>
              <p className="text-slate-600 mb-6 text-lg">
                Founded by Siyaram Kumar, an experienced educator with an M.A. in English, we provide a structured learning environment that focuses on real-world communication, not just textbook grammar.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <h4 className="text-4xl font-bold text-orange-500 mb-2">
                    {totalStudents > 0 ? `${totalStudents}+` : '0'}
                  </h4>
                  <p className="text-slate-500 font-medium">Students Enrolled</p>
                </div>
                <div>
                  <h4 className="text-4xl font-bold text-orange-500 mb-2">
                    {totalCourses > 0 ? `${totalCourses}+` : '0'}
                  </h4>
                  <p className="text-slate-500 font-medium">Comprehensive Courses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Quality Education</h3>
              <p className="text-slate-600">We provide meticulously structured content that ensures deep understanding and practical application.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Student First</h3>
              <p className="text-slate-600">Our platform and teaching methods are designed entirely around student success and ease of learning.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Excellence</h3>
              <p className="text-slate-600">We maintain high standards for our course materials, online tests, and certification processes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Ready to start learning?</h2>
        <Link to="/register" className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
          Join Easy Talk Today
        </Link>
      </section>
    </div>
  );
}
