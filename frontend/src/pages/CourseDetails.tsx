
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Clock, 
  Globe, 
  ArrowRight,
  Sparkles,
  Users,
  Code,
  MessageSquare,
  FileText,
  MessagesSquare,
  UsersRound,
  Accessibility,
  Trophy,
  CircleHelp,
  MessageCircle,
  BriefcaseBusiness,
  Award
} from 'lucide-react';
import { handleProtectedAction } from '../utils/authGuard';
import { courseService } from '../services/courseService';
import { optimizeImageUrl } from '../utils/imageOptimizer';

const COURSE_FEATURES = [
  {
    id: 1,
    title: 'HR Interview Preparation',
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
    badge: '01'
  },
  {
    id: 2,
    title: 'Technical Interview Guidance',
    icon: Code,
    iconBg: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
    badge: '02'
  },
  {
    id: 3,
    title: 'Mock Interview Sessions',
    icon: MessageSquare,
    iconBg: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white',
    badge: '03'
  },
  {
    id: 4,
    title: 'Resume Building Support',
    icon: FileText,
    iconBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    badge: '04'
  },
  {
    id: 5,
    title: 'Communication Skills Training',
    icon: MessagesSquare,
    iconBg: 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
    badge: '05'
  },
  {
    id: 6,
    title: 'Group Discussion Practice',
    icon: UsersRound,
    iconBg: 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
    badge: '06'
  },
  {
    id: 7,
    title: 'Body Language Training',
    icon: Accessibility,
    iconBg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    badge: '07'
  },
  {
    id: 8,
    title: 'Confidence Building Sessions',
    icon: Trophy,
    iconBg: 'bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
    badge: '08'
  },
  {
    id: 9,
    title: 'Common Interview Questions',
    icon: CircleHelp,
    iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white',
    badge: '09'
  },
  {
    id: 10,
    title: 'Real-Time Feedback',
    icon: MessageCircle,
    iconBg: 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white',
    badge: '10'
  },
  {
    id: 11,
    title: 'Placement Assistance Guidance',
    icon: BriefcaseBusiness,
    iconBg: 'bg-blue-50 text-blue-800 group-hover:bg-blue-700 group-hover:text-white',
    badge: '11'
  },
  {
    id: 12,
    title: 'Certificate of Completion',
    icon: Award,
    iconBg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    badge: '12'
  }
];

export default function CourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await courseService.getBySlug(slug!);
        setCourse(data);
      } catch (error) {
        console.error("Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-xl font-bold text-slate-700">Course not found</div>
      </div>
    );
  }

  const handleEnroll = () => {
    handleProtectedAction(navigate, `/enroll/${course.slug}`, { courseTitle: course.title });
  };

  const rawThumbnailUrl = course.thumbnailUrl || course.thumbnail?.url || course.imageUrl || (typeof course.thumbnail === 'string' ? course.thumbnail : '') || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644';
  const heroBannerUrl = optimizeImageUrl(rawThumbnailUrl, 1200);
  const cardThumbnailUrl = optimizeImageUrl(rawThumbnailUrl, 600);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Banner */}
      <div className="relative bg-blue-950 text-white pt-24 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={heroBannerUrl} 
            alt={course.title} 
            decoding="async"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{course.title}</h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">{course.shortDescription}</p>
            
            <div className="flex flex-wrap gap-6 text-sm font-medium mb-10">
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> {course.level}</div>
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-400" /> {course.duration}</div>
              <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-orange-400" /> {course.language}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Course Description</h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>{course.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 sticky top-24">
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-100 border border-slate-100">
                <img 
                  src={cardThumbnailUrl} 
                  alt={course.title} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100 text-center">
                <div className="text-4xl font-black text-slate-800 mb-2">₹{course.discountPrice || course.price}</div>
                {course.discountPrice && course.discountPrice < course.price && (
                  <div className="text-slate-500 font-medium line-through">₹{course.price}</div>
                )}
              </div>
              
              <button 
                onClick={handleEnroll}
                className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 text-lg mb-4 cursor-pointer"
              >
                Enroll Now <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Your Instructor</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex justify-center items-center shrink-0">
                     <span className="font-bold text-slate-500">{course.instructor ? course.instructor.charAt(0) : 'S'}</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{course.instructor || 'Siyaram Kumar'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redesigned Premium Course Features Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/90">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200/60 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Curriculum Highlights
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
              Course Features
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
              Everything you need to build confidence, improve communication skills, and prepare for your dream career.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {COURSE_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={feature.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-orange-300/90 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle top indicator bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${feature.iconBg}`}>
                      <IconComponent className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-orange-500 transition-colors">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] leading-snug group-hover:text-blue-950 transition-colors">
                    {feature.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
