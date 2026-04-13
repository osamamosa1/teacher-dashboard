import { useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, LogOut, Settings,
    Bell, Search, Plus, PieChart, MessageSquare, BarChart3, Grid, GraduationCap, ClipboardList, Menu, X
} from 'lucide-react';


const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar shadow-sm ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} z-[100]`}>
                <div className="flex items-center justify-between mb-10 px-2 lg:block">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center text-white">
                            <Grid size={22} />
                        </div>
                        <h2 className="text-xl font-extrabold text-[#1e293b] tracking-tight whitespace-nowrap">
                            {isAdmin ? 'Admin' : 'Teacher'}
                        </h2>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 lg:hidden text-[#64748B]"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavLink to={isAdmin ? "/admin" : "/teacher"} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> <span className="nav-text">Overview</span>
                    </NavLink>

                    {isAdmin ? (
                        <>
                            <NavLink to="/admin/teachers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} /> <span className="nav-text">Teachers</span>
                            </NavLink>
                            <NavLink to="/admin/subjects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <BookOpen size={20} /> <span className="nav-text">Subjects</span>
                            </NavLink>
                            <NavLink to="/admin/grades" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <GraduationCap size={20} /> <span className="nav-text">Grades</span>
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/teacher/courses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <BookOpen size={20} /> <span className="nav-text">Courses</span>
                            </NavLink>
                            <NavLink to="/teacher/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} /> <span className="nav-text">Students</span>
                            </NavLink>
                            <NavLink to="/teacher/parents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <PieChart size={20} /> <span className="nav-text">Parents</span>
                            </NavLink>
                            <NavLink to="/teacher/grades" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <GraduationCap size={20} /> <span className="nav-text">Grades</span>
                            </NavLink>
                            <NavLink to="/teacher/current-exams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <ClipboardList size={20} /> <span className="nav-text">Current Exams</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Settings size={20} /> <span className="nav-text">Profile</span>
                    </NavLink>
                </nav>

                <div className="mt-auto pt-6">
                    <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50/50">
                        <LogOut size={20} /> <span className="nav-text">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top bar */}
                <header className="h-20 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 lg:px-10 sticky top-0 z-[90]">
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 lg:hidden text-indigo-900 bg-indigo-50 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        
                        <div className="hidden md:block flex-1 max-w-md">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    className="w-full bg-[#F1F5F9] border-none h-11 pl-12 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    placeholder="Search..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        {!isAdmin && (
                            <button className="hidden sm:flex btn-primary !px-4 lg:!px-5" onClick={() => navigate('/teacher/courses')}>
                                <Plus size={20} /> <span className="hidden lg:inline">Add Course</span>
                            </button>
                        )}
                        <button className="p-2 lg:p-2.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-all relative">
                            <Bell size={22} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
                        </button>
                        <div className="h-10 w-[1px] bg-[#E2E8F0] hidden sm:block" />
                        <div className="flex items-center gap-3 shrink-0">
                            <img src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`} className="avatar-img" alt="" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="main-content flex-1 overflow-y-auto lg:!ml-[260px]">
                    <div className="max-w-[1400px] mx-auto animate-fade">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
