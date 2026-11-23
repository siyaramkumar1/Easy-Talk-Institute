import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MetaTags } from './components/MetaTags';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { getAppSocket } from './utils/socket';
import { useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import RootLayout from './components/layout/RootLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import RouteLoadingSkeleton from './components/common/RouteLoadingSkeleton';

// Instant Homepage component for initial paint
import Home from './pages/Home';

// Route-based code-split components for fast bundle splitting & lazy loading
const Courses = lazy(() => import('./pages/Courses'));
const Batches = lazy(() => import('./pages/Batches'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notifications = lazy(() => import('./pages/user/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const SpokenEnglish = lazy(() => import('./pages/SpokenEnglish'));
const Grammar = lazy(() => import('./pages/Grammar'));
const Vocabulary = lazy(() => import('./pages/Vocabulary'));
const Tenses = lazy(() => import('./pages/Tenses'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Test = lazy(() => import('./pages/Test'));
const TestCategories = lazy(() => import('./pages/TestCategories'));
const Result = lazy(() => import('./pages/Result'));
const MyResults = lazy(() => import('./pages/MyResults'));
const SeatReservation = lazy(() => import('./pages/SeatReservation'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const Reading = lazy(() => import('./pages/Reading'));
const StoryReader = lazy(() => import('./pages/StoryReader'));
const StudentsLearning = lazy(() => import('./pages/StudentsLearning'));

// Smart Learning & Portal features
const AISpeaking = lazy(() => import('./pages/AISpeaking'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const InterviewLab = lazy(() => import('./pages/InterviewLab'));
const SpeakingRoom = lazy(() => import('./pages/SpeakingRoom'));
const CareerCenter = lazy(() => import('./pages/CareerCenter'));
const AchievementWall = lazy(() => import('./pages/AchievementWall'));
const Profile = lazy(() => import('./pages/user/Profile'));
const MyCourses = lazy(() => import('./pages/user/MyCourses'));
const UserLayout = lazy(() => import('./components/layout/UserLayout').then(m => ({ default: m.UserLayout })));

export default function App() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const socket = getAppSocket();
    if (!socket) return;

    const handleTestimonials = () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['adminTestimonials'] });
    };

    const handleCourses = () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['homeLiveStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    };

    const handleGallery = () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['publicGallery'] });
      queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
    };

    const handleBatches = () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
      queryClient.invalidateQueries({ queryKey: ['homeBatchStats'] });
      queryClient.invalidateQueries({ queryKey: ['publicBatches'] });
      queryClient.invalidateQueries({ queryKey: ['homeLiveStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    };

    const handleReading = () => {
      queryClient.invalidateQueries({ queryKey: ['readingStories'] });
      queryClient.invalidateQueries({ queryKey: ['adminReadingStories'] });
      queryClient.invalidateQueries({ queryKey: ['readingProgressSummary'] });
    };

    const handleReservations = () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['adminReservations'] });
    };

    socket.on('testimonialsUpdated', handleTestimonials);
    socket.on('coursesUpdated', handleCourses);
    socket.on('galleryUpdated', handleGallery);
    socket.on('batchesUpdated', handleBatches);
    socket.on('readingUpdated', handleReading);
    socket.on('reservationsUpdated', handleReservations);

    return () => {
      socket.off('testimonialsUpdated', handleTestimonials);
      socket.off('coursesUpdated', handleCourses);
      socket.off('galleryUpdated', handleGallery);
      socket.off('batchesUpdated', handleBatches);
      socket.off('readingUpdated', handleReading);
      socket.off('reservationsUpdated', handleReservations);
    };
  }, [queryClient]);

  const checkAuth = useAuthStore(state => state.checkAuth);
  const fetchSettings = useSettingsStore(state => state.fetchSettings);
  
  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, [checkAuth, fetchSettings]);

  return (
    <ErrorBoundary>
      <MetaTags />
      <Toaster position="top-right" toastOptions={{ 
        duration: 3500, 
        className: 'shadow-xl rounded-xl border font-medium text-sm',
        success: { 
          style: { background: '#16a34a', color: '#ffffff', padding: '14px 20px', borderRadius: '12px' },
          iconTheme: { primary: '#ffffff', secondary: '#16a34a' }
        },
        error: {
          style: { background: '#dc2626', color: '#ffffff', padding: '14px 20px', borderRadius: '12px' },
          iconTheme: { primary: '#ffffff', secondary: '#dc2626' }
        }
      }} />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<RouteLoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="students-learning" element={<StudentsLearning />} />
              <Route path="batches" element={<Batches />} />
              <Route path="reading" element={<Reading />} />
              <Route path="reading/story/:id" element={<StoryReader />} />
              <Route path="course/:slug" element={<CourseDetails />} />
              <Route path="enroll/:courseId" element={<ProtectedRoute><Enrollment /></ProtectedRoute>} />
              <Route path="reserve-seat" element={<SeatReservation />} />
              
              {/* Static Pages */}
              <Route path="grammar" element={<Grammar />} />
              <Route path="spoken-english" element={<SpokenEnglish />} />
              <Route path="vocabulary" element={<Vocabulary />} />
              <Route path="tenses" element={<Tenses />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Smart Learning Features */}
              <Route path="ai-speaking" element={<ProtectedRoute><AISpeaking /></ProtectedRoute>} />
              <Route path="challenges" element={<Navigate to="/reading" replace />} />
              <Route path="leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="interview-lab" element={<ProtectedRoute><InterviewLab /></ProtectedRoute>} />
              <Route path="speaking-room" element={<ProtectedRoute><SpeakingRoom /></ProtectedRoute>} />
              <Route path="career-center" element={<ProtectedRoute><CareerCenter /></ProtectedRoute>} />
              <Route path="achievement-wall" element={<ProtectedRoute><AchievementWall /></ProtectedRoute>} />

              {/* Auth Pages */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="verify-otp" element={<VerifyOtp />} />
              
              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute roles={['student', 'user']}><UserLayout /></ProtectedRoute>}>
                <Route path="student/dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="student/courses" element={<MyCourses />} />
                <Route path="student/notifications" element={<Notifications />} />
                <Route path="user/notifications" element={<Notifications />} />
                <Route path="student/settings" element={<Settings />} />
              </Route>

              {/* Tests */}
              <Route path="tests" element={<ProtectedRoute><TestCategories /></ProtectedRoute>} />
              <Route path="tests/:slug" element={<ProtectedRoute><Test /></ProtectedRoute>} />
              <Route path="results/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
              <Route path="results" element={<ProtectedRoute><Result /></ProtectedRoute>} />
              <Route path="assessment/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
              <Route path="assessment/result" element={<ProtectedRoute><Result /></ProtectedRoute>} />
              <Route path="my-results" element={<ProtectedRoute><MyResults /></ProtectedRoute>} />
              <Route path="test" element={<Navigate to="/tests" replace />} />

              {/* Legacy redirects */}
              <Route path="my-courses" element={<Navigate to="/student/courses" replace />} />
              <Route path="dashboard" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="super-admin/*" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="notifications" element={<Navigate to="/user/notifications" replace />} />
              <Route path="settings" element={<Navigate to="/student/settings" replace />} />
            </Route>
            
            {/* Admin and Superadmin routes */}
            <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
            <Route path="/superadmin/*" element={<ProtectedRoute roles={['superadmin']}><Admin /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
