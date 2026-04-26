import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    Loader2, Users, Search, CheckCircle, XCircle,
    BookOpen, TrendingUp, ChevronDown, ChevronUp, Award, Plus, X, Phone, Key, UserPlus, Trash2, RotateCcw, Edit
} from 'lucide-react';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'date_enrolled', direction: 'desc' });
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [parentModalOpen, setParentModalOpen] = useState(false);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ 
        name: '', 
        phone: '', 
        email: '', 
        password: '', 
        grade_id: '',
        address: '',
        school_name: '',
        date_of_birth: '',
        notes: '',
        parent_phone: '',
        parent_job: ''
    });
    const [newEnrollment, setNewEnrollment] = useState({ name: '', email: '', course_id: '' });
    const [parentData, setParentData] = useState({ 
        student_id: null, 
        student_name: '', 
        parent_phone: '',
        parent_name: '',
        parent_email: '',
        parent_password: ''
    });
    const [saving, setSaving] = useState(false);
    const [grades, setGrades] = useState([]);
    const [courses, setCourses] = useState([]);
    const [newGrade, setNewGrade] = useState({ name: '' });
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [fetchingSub, setFetchingSub] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const courseIdFilter = queryParams.get('courseId');

    useEffect(() => {
        fetchInitialData();
        fetchCourses();
        fetchGrades();
    }, [location.search]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const courseId = new URLSearchParams(location.search).get('courseId');
            const url = courseId ? `/teacher/courses/${courseId}/students` : '/teacher/students';
            const res = await api.get(url);
            setStudents(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const res = await api.get('/teacher/grades');
            setGrades(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGrade = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teacher/grades', newGrade);
            fetchGrades();
            setNewGrade({ name: '' });
        } catch (err) {
            alert('Failed to add grade.');
        }
    };

    const handleDeleteGrade = async (id) => {
        if (!window.confirm('Are you sure you want to delete this grade?')) return;
        try {
            await api.delete(`/teacher/grades/${id}`);
            fetchGrades();
        } catch (err) {
            alert('Failed to delete grade.');
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/teacher/courses');
            setCourses(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await api.put(`/teacher/students/${editingStudentId}`, {
                    ...newStudent,
                    grade_id: newStudent.grade_id ? parseInt(newStudent.grade_id) : null
                });
                alert('Student updated successfully.');
            } else {
                await api.post('/teacher/add-student', {
                    ...newStudent,
                    grade_id: newStudent.grade_id ? parseInt(newStudent.grade_id) : null
                });
                alert('Student registered successfully.');
            }
            setRegisterModalOpen(false);
            setNewStudent({ 
                name: '', phone: '', email: '', password: '', 
                grade_id: '', address: '', school_name: '', 
                date_of_birth: '', notes: '', parent_phone: '', parent_job: '' 
            });
            setIsEditing(false);
            setEditingStudentId(null);
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed.');
        } finally {
            setSaving(false);
        }
    };

    const fetchStudentDetails = async (studentId) => {
        setLoading(true);
        try {
            const res = await api.get(`/teacher/students/${studentId}`);
            setSelectedStudentDetails(res.data.data);
            setProfileModalOpen(true);
        } catch (err) {
            alert('Failed to fetch student details.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditStudent = (student) => {
        setNewStudent({
            name: student.name || student.student_name,
            email: student.email || student.student_email,
            phone: student.phone || '',
            password: '', // Leave blank to not change unless typed
            grade_id: student.grade_id || '',
            address: student.address || '',
            school_name: student.school_name || '',
            date_of_birth: student.date_of_birth || '',
            notes: student.notes || '',
            parent_phone: student.parent_phone || '',
            parent_job: student.parent_job || ''
        });
        setIsEditing(true);
        setEditingStudentId(student.student_id || student.id);
        setProfileModalOpen(false);
        setRegisterModalOpen(true);
    };

    const handleAssignParent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/teacher/assign-parent', {
                student_id: parentData.student_id,
                parent_phone: parentData.parent_phone,
                parent_name: parentData.parent_name,
                parent_email: parentData.parent_email,
                parent_password: parentData.parent_password
            });
            setParentModalOpen(false);
            setParentData({ student_id: null, student_name: '', parent_phone: '', parent_name: '', parent_email: '', parent_password: '' });
            alert('Parent assigned and linked successfully.');
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign parent.');
        } finally {
            setSaving(false);
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/teacher/students', {
                ...newEnrollment,
                course_id: parseInt(newEnrollment.course_id)
            });
            setEnrollModalOpen(false);
            setNewEnrollment({ name: '', email: '', course_id: '' });
            fetchInitialData();
        } catch (err) {
            alert('Failed to enroll student.');
        } finally {
            setSaving(false);
        }
    };

    const fetchSubmissionDetails = async (subId) => {
        setFetchingSub(true);
        try {
            const res = await api.get(`/student/standalone-exams/results/${subId}`);
            setSelectedSubmission(res.data.data);
        } catch (err) {
            alert('Failed to fetch result details.');
        } finally {
            setFetchingSub(false);
        }
    };

    const handleRemoveEnrollment = async (studentId, courseId) => {
        if (!window.confirm('Are you sure you want to remove this course enrollment?')) return;
        try {
            await api.delete(`/teacher/students/${studentId}/courses/${courseId}`);
            fetchInitialData();
        } catch (err) {
            console.error('Error removing enrollment:', err);
            alert('Failed to remove enrollment.');
        }
    };

    const handleRenewEnrollment = async (studentId, courseId) => {
        try {
            await api.post(`/teacher/students/${studentId}/courses/${courseId}/renew`);
            fetchInitialData();
        } catch (err) {
            console.error('Error renewing enrollment:', err);
            alert('Failed to renew enrollment.');
        }
    };

    const handleDeleteStudent = async (student) => {
        if (!window.confirm(`Delete "${student.student_name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/teacher/students/${student.student_id}`);
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete student.');
        }
    };

    const handleViewStudents = (course, e) => {
        if (e) e.stopPropagation();
        navigate(`/teacher/students?courseId=${course.id}`);
    };



    const toggleStatus = async (student) => {
        setTogglingId(student.student_id);
        try {
            await api.put(`/teacher/students/${student.student_id}/status`, {
                is_active: !student.is_active
            });
            setStudents(prev =>
                prev.map(s =>
                    s.student_id === student.student_id
                        ? { ...s, is_active: !s.is_active }
                        : s
                )
            );
        } catch (err) {
            alert('Failed to update student status.');
        } finally {
            setTogglingId(null);
        }
    };



    const filteredStudents = students.filter(s => {
        const nameMatch = s.student_name ? s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const emailMatch = s.student_email ? s.student_email.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const matchesSearch = nameMatch || emailMatch || searchQuery === '';
        
        const matchesCourse = courseIdFilter 
            ? s.enrolled_courses?.some(c => c.id === parseInt(courseIdFilter)) 
            : true;

        return matchesSearch && matchesCourse;
    });

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedStudents = (list) => {
        const sorted = [...list].sort((a, b) => {
            let aVal, bVal;
            const courseId = parseInt(new URLSearchParams(location.search).get('courseId'));

            switch (sortConfig.key) {
                case 'name':
                    aVal = a.student_name?.toLowerCase();
                    bVal = b.student_name?.toLowerCase();
                    break;
                case 'score':
                    aVal = a.avg_marks_percentage || 0;
                    bVal = b.avg_marks_percentage || 0;
                    break;
                case 'date_enrolled':
                    if (courseId) {
                        aVal = a.enrolled_courses?.find(c => c.id === courseId)?.enrolled_at || '';
                        bVal = b.enrolled_courses?.find(c => c.id === courseId)?.enrolled_at || '';
                    } else {
                        aVal = a.enrolled_courses?.[0]?.enrolled_at || '';
                        bVal = b.enrolled_courses?.[0]?.enrolled_at || '';
                    }
                    break;
                case 'expiry':
                    if (courseId) {
                        aVal = a.enrolled_courses?.find(c => c.id === courseId)?.expiry_date || '';
                        bVal = b.enrolled_courses?.find(c => c.id === courseId)?.expiry_date || '';
                    } else {
                        aVal = a.enrolled_courses?.[0]?.expiry_date || '';
                        bVal = b.enrolled_courses?.[0]?.expiry_date || '';
                    }
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    };

    const sortedList = getSortedStudents(filteredStudents);

    const activeCount = students.filter(s => s.is_active).length;
    const avgOverall = students.length
        ? (students.reduce((sum, s) => sum + (s.avg_marks_percentage || 0), 0) / students.length).toFixed(1)
        : 0;

    const getMarkColor = (pct) => {
        if (pct >= 80) return 'text-green-600';
        if (pct >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getMarkBg = (pct) => {
        if (pct >= 80) return 'bg-green-50';
        if (pct >= 60) return 'bg-amber-50';
        return 'bg-red-50';
    };



    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Students</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">
                        Monitor enrollment, performance, and access control for your students.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setGradeModalOpen(true)}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Award size={18} className="text-[#64748B]" /> Manage Grades
                    </button>
                    <button
                        onClick={() => setEnrollModalOpen(true)}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] px-6 py-3 rounded-xl font-bold tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <BookOpen size={18} className="text-[#64748B]" /> Enroll Student
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setRegisterModalOpen(true);
                        }}
                        className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <UserPlus size={20} /> Register Student
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Students', value: students.length, icon: <Users size={20} /> },
                    { label: 'Active', value: activeCount, icon: <CheckCircle size={20} className="text-green-500" /> },
                    { label: 'Inactive', value: students.length - activeCount, icon: <XCircle size={20} className="text-red-400" /> },
                    { label: 'Avg Score', value: `${avgOverall}%`, icon: <TrendingUp size={20} className="text-indigo-600" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#0F172A]">
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-extrabold text-[#0F172A] mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] h-12 pl-11 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest self-center mr-2">Sort By:</span>
                    {[
                        { key: 'name', label: 'Name' },
                        { key: 'score', label: 'Score' },
                        { key: 'date_enrolled', label: 'Joined' },
                        { key: 'expiry', label: 'Expiry' }
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => handleSort(opt.key)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                                sortConfig.key === opt.key 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                            }`}
                        >
                            {opt.label}
                            {sortConfig.key === opt.key && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student List */}
            {loading ? (
                <div className="flex items-center justify-center py-32 gap-3 text-[#64748B] font-semibold">
                    <Loader2 className="animate-spin w-6 h-6" /> Loading student records...
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center">
                        <Users className="text-[#94A3B8] w-8 h-8" />
                    </div>
                    <p className="font-bold text-[#0F172A] text-xl">No students found</p>
                    <p className="text-[#64748B] text-sm">No enrolled students match your search.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                        <div className="col-span-8 md:col-span-4 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Student</div>
                        <div className="hidden md:block col-span-3 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Enrolled Courses</div>
                        <div className="hidden lg:block col-span-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Avg Score</div>
                        <div className="hidden sm:block col-span-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Status</div>
                        <div className="col-span-4 md:col-span-1 text-xs font-bold text-[#94A3B8] uppercase tracking-widest text-right">Action</div>
                    </div>

                    <div className="divide-y divide-[#F1F5F9]">
                        {sortedList.map(student => (
                            <div key={student.student_id}>
                                <div className="grid grid-cols-12 gap-4 px-4 md:px-8 py-5 items-center hover:bg-[#FAFAFA] transition-colors">

                                    {/* Student Info */}
                                    <div className="col-span-8 md:col-span-4 flex items-center gap-3 md:gap-4 text-left">
                                        <img
                                            src={student.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student_name)}&background=random`}
                                            alt=""
                                            onClick={() => fetchStudentDetails(student.student_id)}
                                            className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover flex-shrink-0 border border-[#E2E8F0] cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                        />
                                        <div className="min-w-0 cursor-pointer" onClick={() => fetchStudentDetails(student.student_id)}>
                                            <p className="font-extrabold text-[#0F172A] text-sm truncate">{student.student_name}</p>
                                            <p className="text-xs text-[#94A3B8] font-medium mt-0.5 truncate hidden sm:block">{student.student_email}</p>
                                        </div>
                                    </div>

                                    {/* Enrolled Courses count */}
                                    <div className="hidden md:block col-span-3">
                                        <button
                                            onClick={() => setExpandedId(expandedId === student.student_id ? null : student.student_id)}
                                            className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-indigo-600 transition-colors"
                                        >
                                            <BookOpen size={16} className="text-indigo-600" />
                                            {student.enrolled_courses?.length || 0} Course{(student.enrolled_courses?.length || 0) !== 1 ? 's' : ''}
                                            {expandedId === student.student_id
                                                ? <ChevronUp size={14} className="text-[#94A3B8]" />
                                                : <ChevronDown size={14} className="text-[#94A3B8]" />}
                                        </button>
                                    </div>

                                    {/* Avg marks */}
                                    <div className="hidden lg:block col-span-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold ${getMarkColor(student.avg_marks_percentage)} ${getMarkBg(student.avg_marks_percentage)}`}>
                                            {student.avg_marks_percentage?.toFixed(1) ?? '—'}%
                                        </span>
                                    </div>

                                    {/* Status badge */}
                                    <div className="hidden sm:block col-span-2">
                                        {student.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactive
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-4 md:col-span-1 flex justify-end gap-1 md:gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }}
                                            title="Edit Student"
                                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-bold"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setNewEnrollment({
                                                    name: student.student_name,
                                                    email: student.student_email,
                                                    course_id: ''
                                                });
                                                setEnrollModalOpen(true);
                                            }}
                                            title="Enroll in Course"
                                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-all font-bold"
                                        >
                                            <UserPlus size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setParentData({
                                                    student_id: student.student_id,
                                                    student_name: student.student_name,
                                                    parent_phone: student.parent_phone || '',
                                                    parent_name: '',
                                                    parent_email: '',
                                                    parent_password: ''
                                                });
                                                setParentModalOpen(true);
                                            }}
                                            title="Assign Parent"
                                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                                        >
                                            <Users size={18} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(student)}
                                            disabled={togglingId === student.student_id}
                                            title={student.is_active ? 'Deactivate student' : 'Activate student'}
                                            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold transition-all ${student.is_active
                                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                } disabled:opacity-50`}
                                        >
                                            {togglingId === student.student_id
                                                ? <Loader2 size={16} className="animate-spin" />
                                                : student.is_active
                                                    ? <XCircle size={18} />
                                                    : <CheckCircle size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStudent(student)}
                                            title="Delete Student Account"
                                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all font-bold"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                 {/* Expanded courses row */}
                                {expandedId === student.student_id && (
                                    <div className="px-8 pb-6 pt-0">
                                        <div className="bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] p-5 space-y-4 shadow-inner">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">Enrolled Courses & Progress</p>
                                                <button 
                                                    onClick={() => {
                                                        setNewEnrollment({
                                                            name: student.student_name,
                                                            email: student.student_email,
                                                            course_id: ''
                                                        });
                                                        setEnrollModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    <Plus size={12} strokeWidth={3} /> Enroll in New Course
                                                </button>
                                            </div>

                                            {(!student.enrolled_courses || student.enrolled_courses.length === 0) ? (
                                                <div className="flex flex-col items-center py-6 text-center">
                                                    <BookOpen size={24} className="text-[#CBD5E1] mb-2" />
                                                    <p className="text-sm font-bold text-[#94A3B8]">No active enrollments</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {student.enrolled_courses.map(course => (
                                                        <div key={course.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#F1F5F9] shadow-sm relative group/item">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                                <BookOpen size={16} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <span className="text-sm font-bold text-[#0F172A] truncate">{course.title}</span>
                                                                    <span className="text-[10px] font-black text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-md uppercase">
                                                                        {course.days_remaining} Days Left
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${course.progress >= 80 ? 'bg-green-500' :
                                                                                course.progress >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                                                                }`}
                                                                            style={{ width: `${course.progress}%` }}
                                                                        />
                                                                    </div>
                                                                <span className="text-xs font-black text-[#64748B] w-8 text-right shrink-0">{course.progress}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleRenewEnrollment(student.student_id, course.id); }}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-black"
                                                                    title="Renew Enrollment (Add 1 Month)"
                                                                >
                                                                    <RotateCcw size={16} strokeWidth={3} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveEnrollment(student.student_id, course.id); }}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                    title="Remove Enrollment"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between">
                        <p className="text-sm text-[#64748B] font-medium">
                            Showing <span className="font-bold text-[#0F172A]">{sortedList.length}</span> of <span className="font-bold text-[#0F172A]">{students.length}</span> students
                        </p>
                    </div>
                </div>
            )}

            {/* Enroll Student Modal */}
            {enrollModalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">Enroll Student</h2>
                                <p className="text-sm text-[#64748B] mt-1">Enroll an existing student into a course.</p>
                            </div>
                            <button onClick={() => setEnrollModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleEnroll} className="space-y-5">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                        <input
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Full Name"
                                            value={newEnrollment.name}
                                            onChange={e => setNewEnrollment({ ...newEnrollment, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        type="email"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="student@example.com"
                                        value={newEnrollment.email}
                                        onChange={e => setNewEnrollment({ ...newEnrollment, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Select Course</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <select
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                                        value={newEnrollment.course_id}
                                        onChange={e => setNewEnrollment({ ...newEnrollment, course_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>{course.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-indigo-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-70 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Enroll Student'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Register Student Modal */}
            {registerModalOpen && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">{isEditing ? 'Edit Student Details' : 'Register New Student'}</h2>
                                <p className="text-sm text-[#64748B] mt-1">{isEditing ? 'Update student information and credentials.' : 'Create a new student account using phone and password.'}</p>
                            </div>
                            <button onClick={() => { setRegisterModalOpen(false); setIsEditing(false); }} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                        <input
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Full Name"
                                            value={newStudent.name}
                                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        type="email"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="student@example.com"
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="0123456789"
                                        value={newStudent.phone}
                                        onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Grade / Level</label>
                                <div className="relative">
                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <select
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                                        value={newStudent.grade_id}
                                        onChange={e => setNewStudent({ ...newStudent, grade_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Account Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        type="password"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        value={newStudent.password}
                                        onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">School Name</label>
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="International School"
                                        value={newStudent.school_name}
                                        onChange={e => setNewStudent({ ...newStudent, school_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={newStudent.date_of_birth}
                                        onChange={e => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Parent Phone</label>
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="012XXXXXXXX"
                                        value={newStudent.parent_phone}
                                        onChange={e => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Parent Job</label>
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Engineer, Doctor, etc."
                                        value={newStudent.parent_job}
                                        onChange={e => setNewStudent({ ...newStudent, parent_job: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Address (Optional)</label>
                                <input
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="123 Education St, Knowledge City"
                                    value={newStudent.address}
                                    onChange={e => setNewStudent({ ...newStudent, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Notes</label>
                                <textarea
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Any additional info..."
                                    rows="2"
                                    value={newStudent.notes}
                                    onChange={e => setNewStudent({ ...newStudent, notes: e.target.value })}
                                />
                            </div>
                                    <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-indigo-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-70 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? 'Save Changes' : 'Register Student')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Parent Modal */}
            {parentModalOpen && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">Assign Parent</h2>
                                <p className="text-sm text-[#64748B] mt-1">Link an existing parent or create a new one for {parentData.student_name}.</p>
                            </div>
                            <button onClick={() => setParentModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleAssignParent} className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Parent Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                        <input
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="0123456789"
                                            value={parentData.parent_phone}
                                            onChange={e => setParentData({ ...parentData, parent_phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#94A3B8] mt-1 font-bold">If this phone exists, student will be linked directly.</p>
                                </div>

                            <div className="pt-2 border-t border-[#F1F5F9] mt-4">
                                <p className="text-xs font-bold text-[#64748B] mb-4 uppercase tracking-widest">Or Create New Parent Record</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Parent Name (Optional)</label>
                                        <input
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Full Name"
                                            value={parentData.parent_name}
                                            onChange={e => setParentData({ ...parentData, parent_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email</label>
                                            <input
                                                type="email"
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                placeholder="parent@example.com"
                                                value={parentData.parent_email}
                                                onChange={e => setParentData({ ...parentData, parent_email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Password</label>
                                            <input
                                                type="password"
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                placeholder="••••••••"
                                                value={parentData.parent_password}
                                                onChange={e => setParentData({ ...parentData, parent_password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-indigo-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-70 mt-6"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Process Assignment'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Profile Modal */}
            {profileModalOpen && selectedStudentDetails && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                <img
                                    src={selectedStudentDetails.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudentDetails.name)}&background=random`}
                                    alt=""
                                    className="w-20 h-20 rounded-2xl object-cover border border-[#E2E8F0] shadow-sm"
                                />
                                <div>
                                    <h2 className="text-2xl font-black text-[#0F172A]">{selectedStudentDetails.name}</h2>
                                    <p className="text-indigo-600 font-bold text-sm tracking-tight">{selectedStudentDetails.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button 
                                            onClick={() => handleEditStudent(selectedStudentDetails)}
                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedStudentDetails.activation_status ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {selectedStudentDetails.activation_status ? 'Active' : 'Deactivated'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setProfileModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">Phone Number</p>
                                    <p className="text-[#0F172A] font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-[#94A3B8]" />
                                        {selectedStudentDetails.phone || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">Parent Phone</p>
                                    <p className="text-[#0F172A] font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-[#94A3B8]" />
                                        {selectedStudentDetails.parent_phone || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">Address</p>
                                    <p className="text-[#0F172A] font-bold">{selectedStudentDetails.address || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">Grade</p>
                                    <p className="text-[#0F172A] font-bold">{selectedStudentDetails.grade?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Award size={16} className="text-indigo-600" />
                                Submitted Exams & Quizzes
                            </p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {selectedStudentDetails.submissions?.length === 0 ? (
                                    <div className="bg-[#F8FAFC] rounded-2xl p-8 text-center border-2 border-dashed border-[#E2E8F0]">
                                        <p className="text-[#94A3B8] font-bold">No exam submissions found.</p>
                                    </div>
                                ) : (
                                    selectedStudentDetails.submissions.map(sub => (
                                        <div 
                                            key={`${sub.exam_type}-${sub.id}`}
                                            className="group bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all flex items-center justify-between cursor-pointer"
                                            onClick={() => fetchSubmissionDetails(sub.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sub.exam_type === 'course' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#0F172A] group-hover:text-indigo-600 transition-colors">
                                                        Exam #{sub.exam_id} ({sub.exam_type})
                                                    </p>
                                                    <p className="text-[10px] font-bold text-[#94A3B8] mt-0.5">
                                                        {new Date(sub.submitted_at).toLocaleDateString()} at {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${sub.score >= sub.total_mark / 2 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {sub.score} / {sub.total_mark}
                                                </p>
                                                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">Score</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        {/* Answers Breakdown Overlay */}
                        {selectedSubmission && (
                            <div className="fixed inset-0 lg:left-[260px] bg-white/95 backdrop-blur-md z-[200] p-8 flex flex-col animate-in slide-in-from-bottom duration-300">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-[#0F172A]">Answers Breakdown</h3>
                                        <p className="text-sm font-bold text-[#64748B]">{selectedSubmission.exam_title}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedSubmission(null)}
                                        className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                                    {selectedSubmission.questions_breakdown?.map((q, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-[#F1F5F9] p-5 shadow-sm">
                                            <div className="flex justify-between gap-4 mb-4">
                                                <p className="font-bold text-[#0F172A] leading-relaxed">
                                                    <span className="text-indigo-600 font-black mr-2">Q{idx+1}.</span>
                                                    {q.question_text}
                                                </p>
                                                <span className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest h-fit ${q.correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {q.correct ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                                                    <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Student Answer</p>
                                                    <p className={`text-sm font-bold ${q.correct ? 'text-green-600' : 'text-red-500'}`}>
                                                        {q.student_answer_text || q.student_option_id || 'No Answer'}
                                                    </p>
                                                </div>
                                                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Correct Answer</p>
                                                    <p className="text-sm font-bold text-green-700">
                                                        {q.correct_option_text || q.correct_option_id || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
