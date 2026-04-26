import { BookOpen, Users, Star, Award, Plus, Layout, Loader2, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const TeacherDashboard = () => {
    const rawUser = JSON.parse(localStorage.getItem('user') || '{}');
    const user = rawUser.user || rawUser; // Handle nested user object from backend
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await api.get('/teacher/dashboard/stats');
            setStats(statsRes.data.data);
        } catch (err) {
            console.error('Error fetching dashboard data', err);
        } finally {
            setLoading(false);
        }
    };



    // Helper to get value from stats object regardless of casing (snake_case vs PascalCase)
    const getStat = (key) => {
        if (!stats || !stats.stats) return 0;
        // The backend now returns a nested structure: { stats: { ... }, performance: { ... }, top_courses: [...] }
        const data = stats.stats;
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
        return data[snakeKey] ?? data[key] ?? 0;
    };

    const dashboardStats = [
        { label: 'Active Courses', value: getStat('ActiveCourses'), icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Students', value: getStat('TotalStudents'), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Lessons', value: getStat('TotalLessons'), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Total Revenue', value: `$${typeof getStat('TotalRevenue') === 'number' ? getStat('TotalRevenue').toFixed(2) : getStat('TotalRevenue')}`, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];


    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10 pb-10">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-2xl md:text-[32px] font-extrabold text-[#0F172A] tracking-tight">Analytics Overview</h1>
                    <p className="text-[#64748B] text-base md:text-lg font-medium mt-1">Hello, {user.name}. You have <span className="text-indigo-600 font-bold">3</span> new submissions to review.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/teacher/grades"
                        className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base"
                    >
                        <Award size={18} className="text-[#64748B]" /> Manage Grades
                    </Link>
                    <Link to="/teacher/courses" className="flex-1 sm:flex-none bg-indigo-900 hover:bg-slate-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base">
                        <Plus size={20} /> New Course
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, i) => {
                    const cardContent = (
                        <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm hover:border-indigo-200 transition-all group h-full">
                            <div className={`p-4 rounded-xl w-fit mb-6 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={28} />
                            </div>
                            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{stat.label}</p>
                            <p className="text-3xl font-extrabold text-[#0F172A] mt-2">{stat.value}</p>
                        </div>
                    );

                    return stat.label === 'Total Revenue' ? (
                        <Link to="/teacher/revenue" key={i} className="block h-full">
                            {cardContent}
                        </Link>
                    ) : (
                        <div key={i}>
                            {cardContent}
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-8 h-96 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4 border-b border-[#F1F5F9] pb-4">
                    <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><Layout size={20} className="text-indigo-600" /> Recent Course Engagement</h3>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-md uppercase tracking-wider">Views</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md uppercase tracking-wider">Completions</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="p-6 bg-[#F8FAFC] rounded-full border border-[#E2E8F0]">
                        <Layout className="text-[#94A3B8]" size={40} />
                    </div>
                    <p className="text-[#64748B] font-medium">Student performance data will be visualized here.</p>
                    <button className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors text-sm">Learn how to boost engagement</button>
                </div>
            </div>


        </div>
    );
};

export default TeacherDashboard;
