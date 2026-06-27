import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Plus, Settings, Loader2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStatsData(res.data.data);
            } catch (err) {
                console.error("Error fetching admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Active Teachers', value: statsData?.active_teachers ?? '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Courses', value: statsData?.total_courses ?? '0', icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Total Lessons', value: statsData?.total_content ?? '0', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Enrolled Students', value: statsData?.enrolled_students ?? '0', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Main Dashboard</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Welcome back, Administrator. Here's what's happening today.</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <Link to="/admin/subjects" className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-center">
                        <BookOpen size={18} className="text-[#64748B]" /> Manage Subjects
                    </Link>
                    <Link to="/admin/grades" className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-center">
                        <GraduationCap size={18} className="text-[#64748B]" /> Manage Grades
                    </Link>
                    <Link to="/admin/settings" className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-center">
                        <Settings size={18} className="text-[#64748B]" /> Platform Settings
                    </Link>
                    <Link to="/admin/teachers" className="flex-1 sm:flex-none bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95 text-center">
                        <Plus size={20} /> Register Teacher
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm hover:border-indigo-200 transition-all group">
                        <div className={`p-4 rounded-xl w-fit mb-6 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                            <stat.icon size={28} />
                        </div>
                        <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-extrabold text-[#0F172A] mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            {statsData?.total_students != null && (
                <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-6">
                    <p className="text-sm text-[#64748B]">
                        Total registered students: <span className="font-bold text-[#0F172A]">{statsData.total_students}</span>
                        {statsData.assigned_students > 0 && (
                            <> · Assigned to teachers: <span className="font-bold text-[#0F172A]">{statsData.assigned_students}</span></>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
