import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
    Plus, Loader2, X, Search, SlidersHorizontal, BookOpen,
    Users, Star, MoreVertical, Edit, Image as ImageIcon, Trash2, Award, Check
} from 'lucide-react';

const ManageCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({ 
        title: '', 
        price: '', 
        description: '', 
        subscription_type: 'paid', 
        is_free: false,
        image_url: '', 
        subject_id: '', 
        grade_id: '',
        is_popular: false
    });


    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [enrolledModalOpen, setEnrolledModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [cRes, sRes, gRes] = await Promise.allSettled([
                api.get('/teacher/courses'),
                api.get('/teacher/subjects'),
                api.get('/teacher/grades')
            ]);
            console.log('Fetched data for ManageCourses:', { courses: cRes, subjects: sRes, grades: gRes });
            if (cRes.status === 'fulfilled') setCourses(cRes.value.data.data || []);
            if (sRes.status === 'fulfilled') setSubjects(sRes.value.data.data || []);
            if (gRes.status === 'fulfilled') setGrades(gRes.value.data.data || []);
            else console.error('Failed to fetch grades:', gRes.reason);
        } catch (err) {
            console.error('Error fetching initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this course? All associated data will be lost.')) return;

        try {
            await api.delete(`/teacher/courses/${id}`);
            fetchInitialData();
        } catch (err) {
            alert('Failed to delete course.');
        }
    };

    /* Grade Management now handled in dedicated page */

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                title: newCourse.title,
                description: newCourse.description,
                image_url: newCourse.image_url,
                price: parseFloat(newCourse.price) || 0,
                subscription_type: newCourse.subscription_type || 'paid',
                is_free: newCourse.is_free,
                is_popular: newCourse.is_popular,
                grade_id: parseInt(newCourse.grade_id) || 0,
                subject_id: parseInt(newCourse.subject_id) || 0
            };

            console.log('Saving course with payload:', JSON.stringify(payload, null, 2));
            const res = await api.post('/teacher/courses', payload);
            console.log('Course created:', res.data);
            fetchInitialData();
            setCourseModalOpen(false);
            setNewCourse({ title: '', price: '', description: '', subscription_type: 'paid', image_url: '', subject_id: '', grade_id: '', is_free: false, is_popular: false });

        } catch (err) {
            console.error('Course creation error:', err);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);
            const msg = err.response?.data?.message || err.response?.statusText || err.message || 'Unknown error';
            alert(`Failed to save the course: ${err.response?.status} - ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setSaving(true);
            const res = await api.post('/uploads/image', formData);
            if (res.data.status === 'success') {
                setNewCourse({ ...newCourse, image_url: res.data.url });
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload image. Please try again or use a URL.');
        } finally {
            setSaving(false);
        }
    };

    const handleViewStudents = (course, e) => {
        if (e) e.stopPropagation();
        navigate(`/teacher/students?courseId=${course.id}`);
    };

    const getSubjectName = (id) => {
        const sub = subjects.find(s => s.id === id);
        return sub ? sub.name : 'General';
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">My Courses</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Manage your curriculum and monitor student progress.</p>
                </div>
                <div className="flex gap-4">
                    <Link
                        to="/teacher/grades"
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Award size={18} className="text-[#64748B]" /> Manage Grades
                    </Link>
                    <button
                        onClick={() => setCourseModalOpen(true)}
                        className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Create New Course
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-[#E2E8F0]">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-11 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all">
                        <SlidersHorizontal size={18} className="text-[#64748B]" /> Filters
                    </button>
                </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mb-4" />
                    <p className="text-[#64748B] font-medium">Loading your academic registry...</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm text-center px-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="text-indigo-600 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F172A] mb-2">No Courses Found</h3>
                    <p className="text-[#64748B] max-w-sm mb-8">You haven't created any courses yet or none match your search criteria.</p>
                    <button
                        onClick={() => setCourseModalOpen(true)}
                        className="bg-indigo-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/10 flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} /> Create Your First Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer" onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                            {/* Course Image Header */}
                            <div className="h-48 bg-[#F8FAFC] relative overflow-hidden flex-shrink-0 border-b border-[#E2E8F0]">
                                {course.image_url ? (
                                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-indigo-200 bg-indigo-50/50">
                                        <ImageIcon size={48} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-black text-[#0F172A] shadow-sm tracking-tight border border-white/20">
                                    ${course.price || 'Free'}
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/30">
                                        {getSubjectName(course.subject_id)}
                                    </span>
                                </div>
                            </div>

                            {/* Course Details */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-[#0F172A] line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {course.title}
                                </h3>
                                <p className="text-[#64748B] text-sm line-clamp-2 mb-6 flex-1 drop-shadow-sm">
                                    {course.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center gap-2 pt-5 border-t border-[#F1F5F9] mt-auto">
                                    <div className="flex items-center gap-3 text-xs font-bold text-[#64748B] flex-1">
                                        <div className="flex items-center gap-1.5 bg-[#F1F5F9] px-2 py-1 rounded-md">
                                            <Users size={14} className="text-indigo-600" /> {course.enrollments_count || 0}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#F1F5F9] px-2 py-1 rounded-md">
                                            <Star size={14} className="text-amber-500 fill-amber-500" /> 0.0
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <button
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition-all duration-200"
                                            onClick={(e) => handleViewStudents(course, e)}
                                            title="View Enrolled Students"
                                        >
                                            <Users size={16} />
                                        </button>
                                        <button
                                            className="bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white p-2 rounded-lg transition-all duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/teacher/courses/${course.id}`);
                                            }}
                                            title="Edit Course"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all duration-200"
                                            onClick={(e) => handleDeleteCourse(course.id, e)}
                                            title="Delete Course"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Course Edit/Create Modal */}
            {courseModalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[800px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Create New Course</h2>
                                    <p className="text-[#64748B] text-sm font-medium mt-1">Configure your course metadata and academic parameters.</p>
                                </div>
                                <button onClick={() => setCourseModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E2E8F0] shadow-sm text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleCreateCourse} className="p-8 sm:p-10 space-y-10">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Course Image</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Provide a URL or select a file from your device.</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex gap-3">
                                            <input 
                                                className="input-field flex-1" 
                                                placeholder="https://example.com/image.jpg" 
                                                value={newCourse.image_url} 
                                                onChange={e => setNewCourse({ ...newCourse, image_url: e.target.value })} 
                                            />
                                            <label className="h-[52px] px-4 bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold text-sm">
                                                <ImageIcon size={18} />
                                                Pick File
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                        {newCourse.image_url && (
                                            <div className="mt-4 h-48 w-full rounded-2xl border-4 border-white shadow-lg overflow-hidden relative group">
                                                <img src={newCourse.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setNewCourse({...newCourse, image_url: ''})}
                                                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start pt-6 border-t border-[#F1F5F9]">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Course Title</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">The first thing students will see.</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <input className="input-field" placeholder="Introduction to Interaction Design" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} required />
                                    </div>
                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Grade</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Choose target student level.</p>
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <select className="input-field cursor-pointer font-medium" value={newCourse.grade_id} onChange={e => setNewCourse({ ...newCourse, grade_id: e.target.value })} required>
                                            <option value="" disabled>Select Grade</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        <Link
                                            to="/teacher/grades"
                                            className="h-[52px] w-[52px] min-w-[52px] bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-xl flex items-center justify-center transition-colors"
                                            title="Manage Grades and Add New"
                                        >
                                            <Plus size={20} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Description</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Briefly explain what students will learn.</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <textarea className="input-field h-32 resize-none py-3" placeholder="In this course, we will explore..." value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}></textarea>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Price (USD)</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Set a competitive price for your content.</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-bold">$</div>
                                            <input 
                                                className="input-field pl-8 font-bold text-[#0F172A] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed" 
                                                type="number" 
                                                placeholder="49.99" 
                                                value={newCourse.is_free ? '0' : newCourse.price} 
                                                onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} 
                                                required={!newCourse.is_free}
                                                disabled={newCourse.is_free}
                                                step="0.01" 
                                                min="0" 
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-6 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        className="peer sr-only" 
                                                        checked={newCourse.is_free} 
                                                        onChange={e => setNewCourse({ ...newCourse, is_free: e.target.checked, price: e.target.checked ? '0' : newCourse.price })} 
                                                    />
                                                    <div className="w-5 h-5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                        <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" strokeWidth={4} />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-[#64748B] group-hover:text-[#0F172A] transition-colors">Mark this course as Free</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        className="peer sr-only" 
                                                        checked={newCourse.is_popular} 
                                                        onChange={e => setNewCourse({ ...newCourse, is_popular: e.target.checked })} 
                                                    />
                                                    <div className="w-5 h-5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-md peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                                                        <Star size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" strokeWidth={4} />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-[#64748B] group-hover:text-[#0F172A] transition-colors">Mark this course as Popular</span>
                                            </label>
                                        </div>

                                    </div>
                                </div>


                            </form>
                        </div>

                        <div className="p-6 md:px-10 flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                            <button type="button" onClick={() => setCourseModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-colors">Cancel</button>
                            <button type="button" onClick={handleCreateCourse} disabled={saving} className="bg-indigo-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 min-w-[140px]">
                                {saving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save Course'}
                            </button>
                        </div>
                    </div>
                </div >
            )}


            {/* Enrolled Students Modal */}
            {enrolledModalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Enrolled Students</h2>
                                <p className="text-[#64748B] text-sm font-medium mt-1">Students enrolled in <span className="text-indigo-600 font-bold">{selectedCourse?.title}</span></p>
                            </div>
                            <button onClick={() => setEnrolledModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E2E8F0] shadow-sm text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingStudents ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
                                    <p className="text-[#64748B] font-medium">Fetching class list...</p>
                                </div>
                            ) : enrolledStudents.length === 0 ? (
                                <div className="text-center py-20">
                                    <Users className="mx-auto text-[#94A3B8] w-12 h-12 mb-4" />
                                    <p className="text-[#0F172A] font-bold text-lg">No students enrolled</p>
                                    <p className="text-[#64748B]">Enroll students from the Students page.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {enrolledStudents.map(student => (
                                        <div key={student.student_id} className="flex items-center justify-between p-4 rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC]/30 hover:bg-white hover:border-indigo-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <img 
                                                    src={student.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student_name)}&background=random`} 
                                                    alt="" 
                                                    className="w-10 h-10 rounded-full object-cover" 
                                                />
                                                <div>
                                                    <p className="font-bold text-[#0F172A]">{student.student_name}</p>
                                                    <p className="text-xs text-[#64748B]">{student.student_email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Progress</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-600 rounded-full" 
                                                            style={{ width: `${student.enrolled_courses.find(c => c.id === selectedCourse?.id)?.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-[#0F172A]">
                                                        {student.enrolled_courses.find(c => c.id === selectedCourse?.id)?.progress || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 flex justify-end">
                            <button onClick={() => setEnrolledModalOpen(false)} className="bg-indigo-900 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-900/10 hover:bg-slate-800 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
