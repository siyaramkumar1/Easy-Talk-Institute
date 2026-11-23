import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, Users, BookOpen, FileText, Settings, Activity, MessageSquare, 
  Plus, Trash2, Edit, Calendar, Image, Star, Edit3, Bell, BarChart2, 
  List, Shield, LogOut, BookMarked, UserCheck, Clock, CheckCircle2, 
  TrendingUp, ArrowUpRight, GraduationCap, Inbox, Award, AlertCircle,
  HelpCircle, ChevronRight, Sparkles, Filter, Layers, ArrowRight, Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppSocket } from '../utils/socket';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { AdminCourses, AdminBatches, AdminGallery, AdminTestimonials, AdminContacts, NotificationCenter, AdminLogs, AdminSettings, AdminUsers, AdminAssessmentTests, AdminQuestions, AdminTestResults, AdminSeatReservations, AdminReadingStories, AdminEnrollments } from '../components/admin/AdminModules';

export default function Admin() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const basePath = user?.role === 'superadmin' ? '/superadmin' : '/admin';
  const rawPath = location.pathname.replace(basePath, '').replace(/^\//, '');
  const pathParts = rawPath.split('/');
  const pathPart = pathParts[0] || 'dashboard';
  const activeTab = (pathPart === 'students' ? 'users' : 
                     pathPart === 'contact-inquiries' ? 'contacts' : 
                     pathPart === 'questions' ? 'tests' : 
                     pathPart === 'assessment-tests' ? 'assessment_tests' :
                     pathPart === 'results' ? 'results' :
                     pathPart);

  const mainScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.search]);

  const queryClient = useQueryClient();

  // Student Management Filter, Search & Pagination State
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'student',
    status: 'Active'
  });
  const [creatingStudent, setCreatingStudent] = useState(false);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanMobile = studentFormData.mobile.trim().replace(/\D/g, '');
      if (cleanMobile && cleanMobile.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }
      setCreatingStudent(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/users', {
        ...studentFormData,
        mobile: cleanMobile || '9431885389'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${studentFormData.role === 'student' ? 'Student' : 'User'} account created successfully`);
      setShowCreateStudentModal(false);
      setStudentFormData({ name: '', email: '', mobile: '', password: '', role: 'student', status: 'Active' });
      queryClient.invalidateQueries({ queryKey: ['adminStudentsList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create student account');
    } finally {
      setCreatingStudent(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/superadmin') {
      navigate(`${basePath}/dashboard`, { replace: true });
    }
  }, [location.pathname, basePath, navigate]);

  useEffect(() => {
    const socket = getAppSocket();
    if (socket) {
      const handleReservationsSync = () => {
        fetchReservations();
        queryClient.invalidateQueries({ queryKey: ['adminReservationsList'] });
      };
      socket.on('reservationsUpdated', handleReservationsSync);
      return () => {
        socket.off('reservationsUpdated', handleReservationsSync);
      };
    }
  }, [queryClient]);

  const setActiveTab = (tab: string, queryStr: string = '') => {
    navigate(`${basePath}/${tab}${queryStr}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  const [selectedQuestionTestSlug, setSelectedQuestionTestSlug] = useState<string>('');
  const [autoOpenPdf, setAutoOpenPdf] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  
  // Question Form State
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    text: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A', difficulty: 'Medium', status: 'Active', testId: 'spoken-english-test'
  });

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'superadmin' || user?.role === 'admin')) {
      if (activeTab === 'tests') fetchQuestions();
      if (activeTab === 'results') fetchResults();
      if (activeTab === 'enrollments') fetchEnrollments();
      if (activeTab === 'reservations') fetchReservations();
    }
  }, [activeTab]);

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/api/enrollments/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setEnrollments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchReservations = async () => {
    try {
      const res = await axios.get('/api/reservations/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setReservations(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async () => {
    try {
      const res = await axios.get('/api/tests/admin/questions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuestions(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get('/api/tests/admin/results', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTestResults(res.data);
    } catch (err) { console.error(err); }
  };

  // Queries for real database records
  const { data: rawUsers = [] } = useQuery({
    queryKey: ['adminStudentsList'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users?roleGroup=student', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminStaff = [] } = useQuery({
    queryKey: ['adminStaffList'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users?roleGroup=admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: statsBatches = [] } = useQuery({
    queryKey: ['adminBatches'],
    queryFn: async () => {
      const res = await axios.get('/api/batches');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: statsCourses = [] } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const res = await axios.get('/api/courses');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: statsTestimonials = [] } = useQuery({
    queryKey: ['adminTestimonials'],
    queryFn: async () => {
      const res = await axios.get('/api/testimonials');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: statsGallery = [] } = useQuery({
    queryKey: ['adminGallery'],
    queryFn: async () => {
      const res = await axios.get('/api/gallery');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminEnrollments = [] } = useQuery({
    queryKey: ['adminEnrollmentsList'],
    queryFn: async () => {
      const res = await axios.get('/api/enrollments/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminReservations = [] } = useQuery({
    queryKey: ['adminReservationsList'],
    queryFn: async () => {
      const res = await axios.get('/api/reservations/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminTestResults = [] } = useQuery({
    queryKey: ['adminTestResultsList'],
    queryFn: async () => {
      const res = await axios.get('/api/tests/admin/results', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminAssessmentTests = [] } = useQuery({
    queryKey: ['adminAssessmentTestsList'],
    queryFn: async () => {
      const res = await axios.get('/api/admin-tests');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminNotifications = [] } = useQuery({
    queryKey: ['adminNotificationsList'],
    queryFn: async () => {
      const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  const { data: adminContactInquiries = [] } = useQuery({
    queryKey: ['adminContactInquiriesList'],
    queryFn: async () => {
      const res = await axios.get('/api/contact', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAuthenticated
  });

  // Backward compatibility for users tab table
  const allUsers = useMemo(() => {
    return rawUsers.filter((u: any) => u.role === 'student' || u.role === 'user');
  }, [rawUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u: any) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toString().includes(q)) ||
        (u.whatsapp && u.whatsapp.toString().includes(q));

      const matchesStatus = 
        userStatusFilter === 'All' ? true :
        userStatusFilter === 'Active' ? (u.status !== 'Inactive') :
        (u.status === 'Inactive');

      return matchesSearch && matchesStatus;
    });
  }, [allUsers, userSearch, userStatusFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage, usersPerPage]);

  const handleToggleStudentStatus = async (studentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Inactive' ? 'Active' : 'Inactive';
      await axios.patch(`/api/admin/users/${studentId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(`Student status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update student status');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete student ${studentName}?`)) {
      try {
        await axios.delete(`/api/admin/users/${studentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success(`Student ${studentName} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete student');
      }
    }
  };

  // Derived metrics for Dashboard
  const studentUsers = allUsers;
  const totalStudents = studentUsers.length;
  const adminStaffCount = adminStaff.length;
  const totalUsers = totalStudents + adminStaffCount;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newStudentsThisMonth = studentUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo).length;

  const activeBatchesCount = statsBatches.filter((b: any) => b.status === 'Active').length;
  const upcomingBatchesCount = statsBatches.filter((b: any) => b.status === 'Upcoming').length;
  const completedBatchesCount = statsBatches.filter((b: any) => b.status === 'Completed').length;
  const totalCapacity = statsBatches.reduce((acc: number, curr: any) => acc + (Number(curr.capacity) || 0), 0);
  const filledSeats = statsBatches.reduce((acc: number, curr: any) => acc + (Number(curr.enrolledStudents) || 0), 0);
  const availableSeats = Math.max(0, totalCapacity - filledSeats);
  const occupancyRate = totalCapacity > 0 ? Math.round((filledSeats / totalCapacity) * 100) : 0;

  const publishedCoursesCount = statsCourses.filter((c: any) => c.status === 'Published' || c.status === 'Active').length;
  const draftCoursesCount = statsCourses.filter((c: any) => c.status === 'Draft').length;
  const publishedTestimonialsCount = statsTestimonials.filter((t: any) => t.status === 'Published' || t.status === 'Active').length;

  const totalTestAttempts = adminTestResults.length;
  const passedAttemptsCount = adminTestResults.filter((r: any) => (Number(r.percentage) || 0) >= 40).length;
  const passRate = totalTestAttempts > 0 ? Math.round((passedAttemptsCount / totalTestAttempts) * 100) : 0;

  const unreadNotifsCount = adminNotifications.filter((n: any) => !n.isRead && !n.read).length;
  const pendingInquiriesCount = adminContactInquiries.filter((c: any) => c.status === 'Pending' || !c.status).length;

  const todayDateStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(new Date());
  }, []);

  const formatRelativeTime = (dateString?: string | Date) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const curr = new Date();
    const diffInSeconds = Math.floor((curr.getTime() - date.getTime()) / 1000);
    if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  // 1. Student Growth Data (Last 6 Months from real data)
  const studentGrowthData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const curr = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
      result.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        month: `${months[d.getMonth()]}`,
        students: 0,
        enrollments: 0
      });
    }

    studentUsers.forEach((u: any) => {
      if (u.createdAt) {
        const uDate = new Date(u.createdAt);
        const match = result.find(m => m.monthIndex === uDate.getMonth() && m.year === uDate.getFullYear());
        if (match) match.students += 1;
      }
    });

    adminEnrollments.forEach((e: any) => {
      if (e.createdAt) {
        const eDate = new Date(e.createdAt);
        const match = result.find(m => m.monthIndex === eDate.getMonth() && m.year === eDate.getFullYear());
        if (match) match.enrollments += 1;
      }
    });

    return result;
  }, [studentUsers, adminEnrollments]);

  // 2. Batch Enrollment Data
  const batchEnrollmentData = useMemo(() => {
    return statsBatches.slice(0, 6).map((b: any) => ({
      name: b.name?.length > 14 ? b.name.slice(0, 12) + '..' : (b.name || 'Batch'),
      fullName: b.name || 'Batch',
      enrolled: Number(b.enrolledStudents) || 0,
      capacity: Number(b.capacity) || 20,
      available: Math.max(0, (Number(b.capacity) || 20) - (Number(b.enrolledStudents) || 0))
    }));
  }, [statsBatches]);

  // 3. Course Popularity Data
  const coursePopularityData = useMemo(() => {
    return statsCourses.slice(0, 6).map((c: any) => {
      const count = adminEnrollments.filter((e: any) => 
        (e.courseId && (e.courseId === c._id || e.courseId === c.slug)) ||
        (e.courseName && c.title && e.courseName.toLowerCase() === c.title.toLowerCase())
      ).length;
      return {
        name: c.title?.length > 14 ? c.title.slice(0, 12) + '..' : (c.title || 'Course'),
        fullName: c.title || 'Course',
        enrollments: count,
        price: c.price || 0
      };
    });
  }, [statsCourses, adminEnrollments]);

  // 4. Assessment Participation Data
  const assessmentParticipationData = useMemo(() => {
    if (adminAssessmentTests.length === 0) {
      return [
        { name: 'General Test', fullName: 'General English Test', attempts: adminTestResults.length, avgScore: passRate }
      ];
    }
    return adminAssessmentTests.slice(0, 5).map((t: any) => {
      const results = adminTestResults.filter((r: any) => 
        r.testSlug === t.slug || r.testTitle === t.title
      );
      const avg = results.length > 0
        ? Math.round(results.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0) / results.length)
        : 0;
      return {
        name: t.title?.length > 14 ? t.title.slice(0, 12) + '..' : (t.title || 'Test'),
        fullName: t.title,
        attempts: results.length,
        avgScore: avg
      };
    });
  }, [adminAssessmentTests, adminTestResults, passRate]);

  // Recent Activities Timeline synthesized from real database collections
  const recentActivities = useMemo(() => {
    const list: any[] = [];

    adminEnrollments.forEach((e: any) => {
      list.push({
        id: `enr-${e._id}`,
        type: 'Student Enrollment',
        title: `${e.studentName || e.userId?.name || 'Student'} enrolled in ${e.courseName || 'Course'}`,
        user: e.studentName || e.userId?.name || 'Student',
        time: e.createdAt,
        typeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
        dotColor: 'bg-emerald-500',
        icon: Users
      });
    });

    adminReservations.forEach((r: any) => {
      list.push({
        id: `res-${r._id}`,
        type: 'Seat Reservation',
        title: `${r.fullName} reserved a seat for ${r.courseInterested || r.courseName || 'Batch'}`,
        user: r.fullName,
        time: r.createdAt,
        typeColor: 'text-blue-700 bg-blue-50 border-blue-200/60',
        dotColor: 'bg-blue-500',
        icon: Calendar
      });
    });

    adminTestResults.forEach((t: any) => {
      list.push({
        id: `test-${t._id}`,
        type: 'Assessment Completed',
        title: `${t.studentName || t.userId?.name || 'Student'} completed ${t.testTitle || 'Grammar Test'} (${t.percentage || 0}%)`,
        user: t.studentName || t.userId?.name || 'Student',
        time: t.completedAt || t.createdAt,
        typeColor: 'text-purple-700 bg-purple-50 border-purple-200/60',
        dotColor: 'bg-purple-500',
        icon: FileText
      });
    });

    adminContactInquiries.forEach((c: any) => {
      list.push({
        id: `contact-${c._id}`,
        type: 'Contact Inquiry',
        title: `Inquiry from ${c.name}: "${c.subject || 'General inquiry'}"`,
        user: c.name,
        time: c.createdAt,
        typeColor: 'text-amber-700 bg-amber-50 border-amber-200/60',
        dotColor: 'bg-amber-500',
        icon: MessageSquare
      });
    });

    return list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()).slice(0, 6);
  }, [adminEnrollments, adminReservations, adminTestResults, adminContactInquiries]);

  // Quick Action Cards with real navigation routes
  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View student list, roles, and status',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600',
      route: `${basePath}/students`,
      tab: 'users'
    },
    {
      title: 'Manage Courses',
      description: 'Add courses, edit curriculum & pricing',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-600',
      route: `${basePath}/courses`,
      tab: 'courses'
    },
    {
      title: 'Send Notification',
      description: 'Broadcast alerts to students or groups',
      icon: Bell,
      iconBg: 'bg-orange-50 text-orange-600',
      route: `${basePath}/notifications/create`,
      tab: 'notifications'
    },
    {
      title: 'View Admissions',
      description: 'Review seat reservations & admissions',
      icon: FileText,
      iconBg: 'bg-purple-50 text-purple-600',
      route: `${basePath}/reservations`,
      tab: 'reservations'
    },
    {
      title: 'Assessment Tests',
      description: 'Configure online tests & passing criteria',
      icon: Award,
      iconBg: 'bg-indigo-50 text-indigo-600',
      route: `${basePath}/tests`,
      tab: 'assessment_tests'
    },
    {
      title: 'Question Management',
      description: 'Manage questions & batch import via PDF',
      icon: HelpCircle,
      iconBg: 'bg-rose-50 text-rose-600',
      route: `${basePath}/questions`,
      tab: 'tests'
    },
    {
      title: 'Batches',
      description: 'Schedule batches, trainers & capacity',
      icon: Calendar,
      iconBg: 'bg-teal-50 text-teal-600',
      route: `${basePath}/batches`,
      tab: 'batches'
    },
    {
      title: 'Gallery',
      description: 'Upload campus photos & event media',
      icon: Image,
      iconBg: 'bg-pink-50 text-pink-600',
      route: `${basePath}/gallery`,
      tab: 'gallery'
    }
  ];

  // 10 Statistics Cards with direct destination routing & URL filter syncing
  const statsCards = [
    {
      title: 'Total Students',
      value: totalStudents,
      indicator: `+${newStudentsThisMonth} This Month`,
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600',
      indicatorColor: 'text-emerald-600',
      route: `${basePath}/students`,
      tab: 'students'
    },
    {
      title: 'Total Users',
      value: totalUsers,
      indicator: `${adminStaffCount} Admin Staff`,
      icon: UserCheck,
      iconBg: 'bg-indigo-50 text-indigo-600',
      indicatorColor: 'text-slate-500',
      route: `${basePath}/users`,
      tab: 'users'
    },
    {
      title: 'Total Courses',
      value: statsCourses.length,
      indicator: `${publishedCoursesCount} Published`,
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-600',
      indicatorColor: 'text-emerald-600',
      route: `${basePath}/courses`,
      tab: 'courses'
    },
    {
      title: 'Total Batches',
      value: statsBatches.length,
      indicator: `${activeBatchesCount} Active Batches`,
      icon: Calendar,
      iconBg: 'bg-purple-50 text-purple-600',
      indicatorColor: 'text-purple-600',
      route: `${basePath}/batches`,
      tab: 'batches'
    },
    {
      title: 'Active Batches',
      value: activeBatchesCount,
      indicator: 'Live Training Ongoing',
      icon: Activity,
      iconBg: 'bg-green-50 text-green-600',
      indicatorColor: 'text-emerald-600',
      route: `${basePath}/batches?status=active`,
      tab: 'batches'
    },
    {
      title: 'Upcoming Batches',
      value: upcomingBatchesCount,
      indicator: 'Admissions Open',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      indicatorColor: 'text-amber-600',
      route: `${basePath}/batches?status=upcoming`,
      tab: 'batches'
    },
    {
      title: 'Available Seats',
      value: availableSeats,
      indicator: `${totalCapacity} Total Capacity`,
      icon: CheckCircle2,
      iconBg: 'bg-teal-50 text-teal-600',
      indicatorColor: 'text-teal-600',
      route: `${basePath}/batches?highlight=seats`,
      tab: 'batches'
    },
    {
      title: 'Filled Seats',
      value: filledSeats,
      indicator: `${occupancyRate}% Occupancy`,
      icon: Users,
      iconBg: 'bg-rose-50 text-rose-600',
      indicatorColor: 'text-rose-600',
      route: `${basePath}/enrollments`,
      tab: 'enrollments'
    },
    {
      title: 'Gallery Images',
      value: statsGallery.length,
      indicator: 'Campus & Event Media',
      icon: Image,
      iconBg: 'bg-pink-50 text-pink-600',
      indicatorColor: 'text-pink-600',
      route: `${basePath}/gallery`,
      tab: 'gallery'
    },
    {
      title: 'Testimonials',
      value: statsTestimonials.length,
      indicator: `${publishedTestimonialsCount} Verified Reviews`,
      icon: Star,
      iconBg: 'bg-yellow-50 text-yellow-600',
      indicatorColor: 'text-yellow-600',
      route: `${basePath}/testimonials`,
      tab: 'testimonials'
    }
  ];

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData._id) {
        await axios.put(`/api/tests/admin/questions/${formData._id}`, formData);
      } else {
        await axios.post('/api/tests/admin/questions', formData);
      }
      setShowQuestionForm(false);
      fetchQuestions();
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/api/tests/admin/questions/${id}`);
        fetchQuestions();
      } catch (err) { console.error(err); }
    }
  };

  const handleEditClick = (q: any) => {
    setFormData(q);
    setIsEditing(true);
    setShowQuestionForm(true);
  };

  const handleAddNew = () => {
    setFormData({ _id: '', text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', difficulty: 'Medium', status: 'Active', testId: 'spoken-english-test' });
    setIsEditing(false);
    setShowQuestionForm(true);
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#082B63] text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-[#0B3475]">
          <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
          <p className="text-blue-200 text-xs mt-1 font-semibold tracking-wider uppercase">{user.role.replace('_', ' ')}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-blue-200 hover:bg-[#0B3475] hover:text-white text-sm">
            <Home className="w-4 h-4" /> Go to Home Page
          </button>

          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'dashboard' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Activity className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'users' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Users className="w-4 h-4" /> Students & Users
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'courses' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Courses
          </button>
          <button onClick={() => setActiveTab('enrollments')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'enrollments' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Enrollments
          </button>
          <button onClick={() => setActiveTab('reservations')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'reservations' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Seat Reservations
          </button>
          <button onClick={() => setActiveTab('assessment_tests')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'assessment_tests' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <FileText className="w-4 h-4" /> Assessment Tests
          </button>
          <button onClick={() => { setSelectedQuestionTestSlug(''); setAutoOpenPdf(false); setActiveTab('tests'); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'tests' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <FileText className="w-4 h-4" /> Question Management
          </button>
          <button onClick={() => setActiveTab('results')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'results' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <FileText className="w-4 h-4" /> Test Results
          </button>
          <button onClick={() => setActiveTab('batches')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'batches' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Calendar className="w-4 h-4" /> Batches
          </button>
          <button onClick={() => setActiveTab('gallery')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'gallery' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Image className="w-4 h-4" /> Gallery
          </button>
          <button onClick={() => setActiveTab('testimonials')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'testimonials' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Star className="w-4 h-4" /> Testimonials
          </button>
          <button onClick={() => setActiveTab('contacts')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'contacts' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4" /> Contact Inquiries
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'notifications' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button onClick={() => setActiveTab('reading_stories')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'reading_stories' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
            <BookMarked className="w-4 h-4" /> Reading Stories
          </button>
          
          {user?.role === 'superadmin' && (
            <>
              <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'logs' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
                <List className="w-4 h-4" /> Activity Logs
              </button>
              <div className="pt-3 mt-3 border-t border-[#0B3475]"></div>
              <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'settings' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
                <Settings className="w-4 h-4" /> Website Settings
              </button>
            </>
          )}

          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <button onClick={() => setActiveTab('admin_users')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'admin_users' ? 'bg-[#0B3475] text-white font-bold border-l-4 border-[#FF6500]' : 'text-blue-100 hover:bg-[#0B3475]/60 hover:text-white'}`}>
              <Shield className="w-4 h-4" /> Admin Users
            </button>
          )}

          <div className="pt-3 mt-3 border-t border-[#0B3475]"></div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors text-red-300 hover:bg-red-950/60 hover:text-red-200 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('_', ' ')}</h2>
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                title="View Website Home"
              >
                <Home className="w-4 h-4" /> 
                <span className="hidden sm:inline">View Website</span>
              </button>
              <button 
                onClick={() => setActiveTab('notifications')} 
                className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors rounded-xl hover:bg-slate-50 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
              {user?.role === 'superadmin' && (
                <button 
                  onClick={() => setActiveTab('settings')} 
                  className="p-2 text-slate-500 hover:text-blue-600 transition-colors rounded-xl hover:bg-slate-50 cursor-pointer"
                  title="Website Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                )}
              </div>
            </div>
          </header>
          <div ref={mainScrollRef} className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                {/* 1. WELCOME CARD */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800/80 relative overflow-hidden">
                  <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 p-0.5 shadow-md">
                          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Active Administrator" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">
                            👋 Welcome Back
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                            <Shield className="w-3 h-3 text-blue-400" />
                            {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                          {user?.name || 'Siyaram Kumar'}
                        </h1>
                        <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
                          Administrator Dashboard · Manage students, courses, assessments, batches, and institute operations from one place.
                        </p>
                      </div>
                    </div>

                    {/* Right side summary */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2.5 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{todayDateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-slate-300 font-medium">System Status: Operational</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <button 
                          type="button" 
                          onClick={() => { navigate(`${basePath}/students`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="hover:text-blue-300 transition-colors cursor-pointer group"
                          title="View Students"
                        >
                          <span className="text-blue-300 font-bold tabular-nums group-hover:underline">{totalStudents}</span> Students
                        </button>
                        <span>·</span>
                        <button 
                          type="button" 
                          onClick={() => { navigate(`${basePath}/batches`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="hover:text-blue-300 transition-colors cursor-pointer group"
                          title="View Batches"
                        >
                          <span className="text-blue-300 font-bold tabular-nums group-hover:underline">{activeBatchesCount}</span> Batches
                        </button>
                        <span>·</span>
                        <button 
                          type="button" 
                          onClick={() => { navigate(`${basePath}/courses`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="hover:text-blue-300 transition-colors cursor-pointer group"
                          title="View Courses"
                        >
                          <span className="text-blue-300 font-bold tabular-nums group-hover:underline">{statsCourses.length}</span> Courses
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DASHBOARD STATS SECTION (10 CARDS) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Key Institute Metrics</h2>
                      <p className="text-xs text-slate-500">Real-time statistics synchronized from MongoDB database</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {statsCards.map((card) => (
                      <button 
                        key={card.title} 
                        type="button"
                        onClick={() => {
                          navigate(card.route);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99]"
                        title={`Click to view ${card.title}`}
                      >
                        <div className="flex items-center justify-between mb-3 w-full">
                          <span className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-blue-600 transition-colors">{card.title}</span>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-110 shrink-0`}>
                            <card.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="w-full">
                          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight tabular-nums group-hover:text-blue-600 transition-colors">
                            {card.value}
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1.5 font-medium">
                            <span className={card.indicatorColor}>{card.indicator}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. QUICK ACTIONS SECTION (8 ACTION CARDS) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Quick Actions</h2>
                      <p className="text-xs text-slate-500">Fast access to core administration modules</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                      <button
                        key={action.title}
                        type="button"
                        onClick={() => {
                          navigate(action.route);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99]"
                        title={`Navigate to ${action.title}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.iconBg} group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. ANALYTICS SECTION (4 CHARTS WITH REAL DATA) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Institute Analytics & Performance</h2>
                      <p className="text-xs text-slate-500">Live graphical data trends across learners, batches, and courses</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Student Growth Chart */}
                    <div 
                      onClick={() => {
                        navigate(`${basePath}/students`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer group"
                      title="Click to view Student Management"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>Student & Enrollment Growth</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </h3>
                          <p className="text-xs text-slate-500">Monthly new students and course enrollments</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">Last 6 Months</span>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={studentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="studentColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="enrollColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Area type="monotone" dataKey="students" name="Students" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#studentColor)" />
                            <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#enrollColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Batch Enrollment Chart */}
                    <div 
                      onClick={() => {
                        navigate(`${basePath}/batches`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer group"
                      title="Click to view Batches"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>Batch Enrollment vs Capacity</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </h3>
                          <p className="text-xs text-slate-500">Seats filled vs available capacity per batch</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('batches');
                          }} 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          View Batches →
                        </button>
                      </div>
                      <div className="h-64 w-full">
                        {batchEnrollmentData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={batchEnrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                              <Bar dataKey="enrolled" name="Enrolled" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="capacity" name="Capacity" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-sm text-slate-400">
                            No batches scheduled yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart 3: Course Popularity Chart */}
                    <div 
                      onClick={() => {
                        navigate(`${basePath}/courses`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer group"
                      title="Click to view Courses"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>Course Popularity & Enrollments</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </h3>
                          <p className="text-xs text-slate-500">Student enrollment distribution across courses</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('courses');
                          }} 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          View Courses →
                        </button>
                      </div>
                      <div className="h-64 w-full">
                        {coursePopularityData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coursePopularityData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B' }} width={90} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                              />
                              <Bar dataKey="enrollments" name="Admissions" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-sm text-slate-400">
                            No courses available yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart 4: Assessment Participation Chart */}
                    <div 
                      onClick={() => {
                        navigate(`${basePath}/results`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer group"
                      title="Click to view Test Results"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>Assessment Participation & Performance</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </h3>
                          <p className="text-xs text-slate-500">Student attempts & average test score %</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('results');
                          }} 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          View Test Results →
                        </button>
                      </div>
                      <div className="h-64 w-full">
                        {assessmentParticipationData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assessmentParticipationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                              <Bar dataKey="attempts" name="Attempts" fill="#EC4899" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="avgScore" name="Avg Score (%)" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-sm text-slate-400">
                            No assessment tests or attempts recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. INSTITUTE OVERVIEW & RECENT ACTIVITIES TIMELINE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Institute Performance Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Institute Performance</h3>
                          <p className="text-xs text-slate-500">Operational benchmarks and capacity utilization</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                          Active & Healthy
                        </span>
                      </div>

                      <div className="space-y-4 pt-2">
                        {/* Total Students Progress */}
                        <div 
                          onClick={() => { navigate(`${basePath}/students`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Student Management"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                              <span>Total Enrolled Students</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">{totalStudents} Learners</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.max(15, (totalStudents / 100) * 100))}%` }} 
                            />
                          </div>
                        </div>

                        {/* Active Batches */}
                        <div 
                          onClick={() => { navigate(`${basePath}/batches?status=active`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Active Batches"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                              <span>Active Batches vs Total</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">
                              {activeBatchesCount} / {statsBatches.length} ({statsBatches.length > 0 ? Math.round((activeBatchesCount / statsBatches.length) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${statsBatches.length > 0 ? (activeBatchesCount / statsBatches.length) * 100 : 0}%` }} 
                            />
                          </div>
                        </div>

                        {/* Course Enrollments */}
                        <div 
                          onClick={() => { navigate(`${basePath}/enrollments`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Enrollments"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                              <span>Course Enrollments (Filled Seats)</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">{filledSeats} / {totalCapacity} ({occupancyRate}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${occupancyRate}%` }} 
                            />
                          </div>
                        </div>

                        {/* Assessment Participation */}
                        <div 
                          onClick={() => { navigate(`${basePath}/results`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Test Results"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-cyan-600 transition-colors flex items-center gap-1">
                              <span>Assessment Pass Rate</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">{passRate}% ({passedAttemptsCount} Passed)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${passRate}%` }} 
                            />
                          </div>
                        </div>

                        {/* Testimonials */}
                        <div 
                          onClick={() => { navigate(`${basePath}/testimonials`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Testimonials"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                              <span>Verified Testimonials</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">{publishedTestimonialsCount} Published</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${statsTestimonials.length > 0 ? (publishedTestimonialsCount / statsTestimonials.length) * 100 : 0}%` }} 
                            />
                          </div>
                        </div>

                        {/* Gallery Media */}
                        <div 
                          onClick={() => { navigate(`${basePath}/gallery`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                          title="View Gallery"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600 group-hover:text-pink-600 transition-colors flex items-center gap-1">
                              <span>Campus Gallery Items</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-pink-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </span>
                            <span className="text-slate-900 font-mono tabular-nums">{statsGallery.length} Items</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, statsGallery.length * 10)}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Synchronized in real-time with MongoDB</span>
                      <button onClick={() => setActiveTab('assessment_tests')} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                        View Assessment Tests →
                      </button>
                    </div>
                  </div>

                  {/* Right: Recent Activities Timeline */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Recent Activities</h3>
                          <p className="text-xs text-slate-500">Chronological student and administrative timeline</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">Real-Time</span>
                      </div>

                      <div className="space-y-3.5 pt-1">
                        {recentActivities.length > 0 ? (
                          recentActivities.map((act) => {
                            const getActRoute = () => {
                              if (act.type === 'Seat Reservation') return `${basePath}/reservations`;
                              if (act.type === 'Assessment Completed') return `${basePath}/results`;
                              if (act.type === 'Student Enrollment') return `${basePath}/enrollments`;
                              if (act.type === 'Contact Inquiry') return `${basePath}/contact-inquiries`;
                              return `${basePath}/dashboard`;
                            };

                            return (
                              <div 
                                key={act.id} 
                                onClick={() => {
                                  navigate(getActRoute());
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-start gap-3 p-2.5 -mx-2 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all cursor-pointer group"
                                role="button"
                                tabIndex={0}
                                title={`Click to open ${act.type} details`}
                              >
                                <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 mt-0.5 transition-colors shadow-2xs">
                                  <act.icon className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${act.typeColor}`}>
                                      {act.type}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                      {formatRelativeTime(act.time)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-1 leading-snug group-hover:text-blue-600 transition-colors">
                                    {act.title}
                                  </p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-12 text-center text-xs text-slate-400">
                            No recent activity records found in the database.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Showing latest verified operations</span>
                      <button onClick={() => setActiveTab('enrollments')} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                        View All Admissions →
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. DASHBOARD WIDGETS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Widget 1: Course Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Course Overview</h3>
                        <p className="text-xs text-slate-500">Curriculum catalog, status, and pricing</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('courses')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Manage Courses →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="pb-2.5">Course</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5">Enrolled</th>
                            <th className="pb-2.5 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {statsCourses.slice(0, 5).map((c: any) => {
                            const enrolledCount = adminEnrollments.filter((e: any) => 
                              (e.courseId && (e.courseId === c._id || e.courseId === c.slug)) ||
                              (e.courseName && c.title && e.courseName.toLowerCase() === c.title.toLowerCase())
                            ).length;
                            return (
                              <tr 
                                key={c._id} 
                                onClick={() => {
                                  navigate(`${basePath}/courses?edit=${c._id}`);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="hover:bg-blue-50/70 transition-colors cursor-pointer group"
                                title={`Click to edit ${c.title}`}
                              >
                                <td className="py-2.5 font-semibold text-slate-800 group-hover:text-blue-600 max-w-[160px] truncate transition-colors">
                                  <div className="flex items-center gap-1.5">
                                    <span>{c.title}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    c.status === 'Published' || c.status === 'Active' 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {c.status || 'Active'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-600 font-mono tabular-nums">
                                  {enrolledCount} Students
                                </td>
                                <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                                  ₹{c.price || 0}
                                </td>
                              </tr>
                            );
                          })}
                          {statsCourses.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400">
                                No courses created yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Widget 2: Batch Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Batch Overview</h3>
                        <p className="text-xs text-slate-500">Upcoming training schedules and seat allocation</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('batches')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Manage Batches →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="pb-2.5">Batch</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5">Trainer</th>
                            <th className="pb-2.5 text-right">Seats (Filled / Avail)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {statsBatches.slice(0, 5).map((b: any) => {
                            const cap = Number(b.capacity) || 20;
                            const filled = Number(b.enrolledStudents) || 0;
                            const avail = Math.max(0, cap - filled);
                            return (
                              <tr 
                                key={b._id} 
                                onClick={() => {
                                  navigate(`${basePath}/batches?id=${b._id}`);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="hover:bg-blue-50/70 transition-colors cursor-pointer group"
                                title={`Click to view batch ${b.name}`}
                              >
                                <td className="py-2.5 font-semibold text-slate-800 group-hover:text-blue-600 max-w-[150px] truncate transition-colors">
                                  <div className="flex items-center gap-1.5">
                                    <span>{b.name}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    b.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                    b.status === 'Upcoming' ? 'bg-amber-50 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {b.status || 'Active'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-600 max-w-[120px] truncate">
                                  {b.trainer || 'Unassigned'}
                                </td>
                                <td className="py-2.5 text-right font-mono tabular-nums">
                                  <span className="font-bold text-blue-700">{filled}</span>
                                  <span className="text-slate-400"> / </span>
                                  <span className="font-bold text-emerald-700">{avail}</span>
                                </td>
                              </tr>
                            );
                          })}
                          {statsBatches.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400">
                                No batches scheduled yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Widget 3: Notifications Widget */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Latest Notifications</h3>
                          <p className="text-xs text-slate-500">Student announcements and system alerts</p>
                        </div>
                        {unreadNotifsCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded-full">
                            {unreadNotifsCount} Unread
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('notifications')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        All Alerts →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {adminNotifications.slice(0, 4).map((n: any) => (
                        <div 
                          key={n._id} 
                          onClick={() => {
                            navigate(`${basePath}/notifications?id=${n._id}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-blue-50/70 hover:border-blue-200 transition-colors cursor-pointer group"
                          role="button"
                          tabIndex={0}
                          title={`Click to view alert: ${n.title}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {n.message}
                          </p>
                        </div>
                      ))}
                      {adminNotifications.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications broadcasted yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Widget 4: Contact Inquiries Widget */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Contact Inquiries</h3>
                          <p className="text-xs text-slate-500">Prospective student inquiries and messages</p>
                        </div>
                        {pendingInquiriesCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold text-[10px] rounded-full">
                            {pendingInquiriesCount} Pending
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('contacts')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        All Messages →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {adminContactInquiries.slice(0, 4).map((msg: any) => (
                        <div 
                          key={msg._id} 
                          onClick={() => {
                            navigate(`${basePath}/contact-inquiries?id=${msg._id}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-blue-50/70 hover:border-blue-200 transition-colors cursor-pointer group"
                          role="button"
                          tabIndex={0}
                          title={`Click to view inquiry from ${msg.name}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                              {msg.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                            {msg.subject || 'General Inquiry'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                      {adminContactInquiries.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No contact inquiries received yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          {activeTab === 'assessment_tests' && (
            <AdminAssessmentTests 
              onManageQuestions={(slug) => {
                setSelectedQuestionTestSlug(slug);
                setAutoOpenPdf(false);
                setActiveTab('tests');
              }}
              onImportPdf={(slug) => {
                setSelectedQuestionTestSlug(slug);
                setAutoOpenPdf(true);
                setActiveTab('tests');
              }}
            />
          )}
          {activeTab === 'tests' && (
            <AdminQuestions 
              initialTestId={selectedQuestionTestSlug}
              autoOpenPdfModal={autoOpenPdf}
              onBackToTests={() => setActiveTab('assessment_tests')}
            />
          )}
          {activeTab === 'results' && <AdminTestResults />}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Student & User Management</h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    Complete student and regular user directory with confidential records, contact info, batch assignments, and course enrollments.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                    {filteredUsers.length} Students & Users {filteredUsers.length !== allUsers.length && `(of ${allUsers.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentFormData({ name: '', email: '', mobile: '', password: '', role: 'student', status: 'Active' });
                      setShowCreateStudentModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Student
                  </button>
                </div>
              </div>

              {/* Search & Status Filters Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search by student name, email, mobile number..."
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {userSearch && (
                    <button 
                      onClick={() => {
                        setUserSearch('');
                        setUserPage(1);
                      }}
                      className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {['All', 'Active', 'Inactive'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setUserStatusFilter(status);
                          setUserPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userStatusFilter === status
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {status === 'All' ? `All (${allUsers.length})` : 
                         status === 'Active' ? `Active (${allUsers.filter((u: any) => u.status !== 'Inactive').length})` : 
                         `Inactive (${allUsers.filter((u: any) => u.status === 'Inactive').length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                        <th className="p-4">Student</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Enrolled Courses</th>
                        <th className="p-4">Batches</th>
                        <th className="p-4">Join Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedUsers.map((u, idx) => {
                        // Find student's enrolled courses from adminEnrollments
                        const studentEnrollments = adminEnrollments.filter((e: any) => 
                          (e.userId && (e.userId === u._id || e.userId._id === u._id)) ||
                          (e.email && e.email.toLowerCase() === u.email?.toLowerCase())
                        );
                        const courseNames = Array.from(new Set(studentEnrollments.map((e: any) => e.courseName).filter(Boolean)));

                        // Find student's assigned batches from statsBatches
                        const studentBatches = statsBatches.filter((b: any) => 
                          (b.students && b.students.some((sId: any) => sId.toString() === u._id?.toString())) ||
                          courseNames.some(cName => b.course?.title?.toLowerCase() === (cName as string).toLowerCase())
                        );

                        return (
                          <tr key={u._id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    u.role === 'user' 
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {u.role || 'student'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-mono text-xs select-all">
                              {u.email}
                            </td>
                            <td className="p-4 text-slate-700 font-mono text-xs select-all">
                              {u.mobile || u.whatsapp || <span className="text-slate-400 italic">N/A</span>}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {courseNames.length > 0 ? (
                                  courseNames.map((cName: any, cIdx: number) => (
                                    <span key={cIdx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                                      {cName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Not Enrolled</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {studentBatches.length > 0 ? (
                                  studentBatches.map((b: any, bIdx: number) => (
                                    <span key={bIdx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                                      {b.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 text-xs whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(u._id, u.status)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  u.status === 'Inactive' 
                                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title="Click to toggle status (Active/Inactive)"
                              >
                                {u.status || 'Active'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleToggleStudentStatus(u._id, u.status)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                  title={u.status === 'Inactive' ? 'Activate Student' : 'Deactivate Student'}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStudent(u._id, u.name || 'Student')}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                                  title="Delete Student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-500">
                            <p className="text-base font-semibold text-slate-700">No students match your criteria</p>
                            <p className="text-xs text-slate-400 mt-1">Try changing the search term or status filter</p>
                            {(userSearch || userStatusFilter !== 'All') && (
                              <button
                                onClick={() => {
                                  setUserSearch('');
                                  setUserStatusFilter('All');
                                  setUserPage(1);
                                }}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                Reset Search & Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                    <div>
                      Showing <span className="font-bold font-mono text-slate-900">{(userPage - 1) * usersPerPage + 1}</span> to <span className="font-bold font-mono text-slate-900">{Math.min(userPage * usersPerPage, filteredUsers.length)}</span> of <span className="font-bold font-mono text-slate-900">{filteredUsers.length}</span> students
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={userPage <= 1}
                        onClick={() => {
                          setUserPage(p => Math.max(1, p - 1));
                          if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setUserPage(pageNum);
                              if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userPage === pageNum
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-200/60'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={userPage >= totalUserPages}
                        onClick={() => {
                          setUserPage(p => Math.min(totalUserPages, p + 1));
                          if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Student Modal */}
              {showCreateStudentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                  <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-800">
                          Create Student / User
                        </h2>
                      </div>
                      <button 
                        onClick={() => setShowCreateStudentModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateStudent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                        <input 
                          required 
                          type="text" 
                          value={studentFormData.name} 
                          onChange={e => setStudentFormData({...studentFormData, name: e.target.value})} 
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address</label>
                        <input 
                          required 
                          type="email" 
                          value={studentFormData.email} 
                          onChange={e => setStudentFormData({...studentFormData, email: e.target.value})} 
                          placeholder="rahul@example.com"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mobile Number (10 Digits)</label>
                        <input 
                          required 
                          type="tel" 
                          maxLength={10}
                          value={studentFormData.mobile} 
                          onChange={e => setStudentFormData({...studentFormData, mobile: e.target.value.replace(/\D/g, '')})} 
                          placeholder="9876543210"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Password</label>
                        <input 
                          required 
                          type="password" 
                          value={studentFormData.password} 
                          onChange={e => setStudentFormData({...studentFormData, password: e.target.value})} 
                          placeholder="Enter initial password"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Role</label>
                        <select 
                          value={studentFormData.role} 
                          onChange={e => setStudentFormData({...studentFormData, role: e.target.value})} 
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 bg-white"
                        >
                          <option value="student">Student (Standard LMS Access)</option>
                          <option value="user">User (Regular Registered User)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Displays only in Student & User Management. Cannot access Admin portal.
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button 
                          type="button" 
                          onClick={() => setShowCreateStudentModal(false)} 
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={creatingStudent}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {creatingStudent ? 'Creating...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Enrollments</h2>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                      <th className="p-4 font-medium">Student Name</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Mobile</th>
                      <th className="p-4 font-medium">Course Name</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">{enr.studentName}</td>
                        <td className="p-4 text-slate-600 text-sm">{enr.email}</td>
                        <td className="p-4 text-slate-600 text-sm">{enr.mobile}</td>
                        <td className="p-4 text-slate-800 font-medium">{enr.courseName}</td>
                        <td className="p-4 text-slate-500 text-sm">{new Date(enr.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${enr.status === 'Enrolled' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {enr.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-blue-500 hover:text-blue-700 mr-3" title="Approve"><Edit className="w-4 h-4" /></button>
                          <button className="text-red-500 hover:text-red-700" title="Reject/Cancel"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {enrollments.length === 0 && <div className="p-8 text-center text-slate-500">No enrollments found.</div>}
              </div>
            </div>
          )}

          {activeTab === 'reservations' && <AdminSeatReservations />}
          {activeTab === 'courses' && <AdminCourses />}
          {activeTab === 'batches' && <AdminBatches />}
          {activeTab === 'gallery' && <AdminGallery />}
          {activeTab === 'testimonials' && <AdminTestimonials />}
          {activeTab === 'contacts' && <AdminContacts />}
          {activeTab === 'notifications' && <NotificationCenter />}
          {activeTab === 'reading_stories' && <AdminReadingStories />}
          {activeTab === 'logs' && user?.role === 'superadmin' && <AdminLogs />}
          {activeTab === 'settings' && user?.role === 'superadmin' && <AdminSettings />}
          {activeTab === 'admin_users' && (user?.role === 'superadmin' || user?.role === 'admin') && <AdminUsers />}
        </div>
      </main>
    </div>
  );
}
