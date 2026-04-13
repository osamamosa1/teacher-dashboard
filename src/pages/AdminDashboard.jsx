import { Users, BookOpen, GraduationCap, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const stats = [
        { label: 'Active Teachers', value: '24', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Content', value: '142', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Enrollments', value: '1,284', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Growth', value: '+12.5%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10 pb-10">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Main Dashboard</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Welcome back, Administrator. Here's what's happening today.</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/admin/subjects" className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                        <BookOpen size={18} className="text-[#64748B]" /> Manage Subjects
                    </Link>
                    <Link to="/admin/grades" className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                        <GraduationCap size={18} className="text-[#64748B]" /> Manage Grades
                    </Link>
                    <Link to="/admin/teachers" className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Plus size={20} /> Register Teacher
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-8 h-[400px] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4 border-b border-[#F1F5F9] pb-4">
                        <h3 className="text-xl font-bold text-[#0F172A]">Registration Trends</h3>
                        <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-md uppercase tracking-wider">Monthly View</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <TrendingUp className="mx-auto w-12 h-12 text-[#94A3B8] mb-3 opacity-50" />
                            <p className="text-[#64748B] font-medium">Visualization Chart Data loading...</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-8 h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-[#0F172A] mb-6 border-b border-[#F1F5F9] pb-4">Recent Alerts</h3>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className="flex gap-4 p-4 bg-[#F8FAFC]/50 hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-[#0F172A]">New teacher registration</p>
                                    <p className="text-xs text-[#64748B] mt-1 font-medium">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="text-indigo-600 text-sm font-bold mt-4 pt-4 border-t border-[#F1F5F9] hover:text-indigo-800 transition-colors text-center w-full">View All Notifications</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
