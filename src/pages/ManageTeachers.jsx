import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus, Trash2, X, Loader2, Users, Edit, Eye, Copy, Search, BookOpen, ChevronRight, Layers, FileText } from 'lucide-react';

const emptyTeacher = {
    name: '',
    email: '',
    phone: '',
    password: '',
    main_subject: '',
    profile_image_url: '',
    address: '',
    date_of_birth: '',
    notes: ''
};

/** copyKind: null | 'course' | 'unit' | 'lesson'
 *  copyStep:
 *    course → 'src-course' | 'dest-teacher'
 *    unit   → 'src-course' | 'src-unit' | 'dest-teacher' | 'dest-course'
 *    lesson → 'src-course' | 'src-unit' | 'src-lesson' | 'dest-teacher' | 'dest-course' | 'dest-unit'
 */
const ManageTeachers = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState(emptyTeacher);
    const [saving, setSaving] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState(null);

    const [copyKind, setCopyKind] = useState(null);
    const [copyStep, setCopyStep] = useState(null);
    const [copySourceTeacher, setCopySourceTeacher] = useState(null);
    const [copySourceCourse, setCopySourceCourse] = useState(null);
    const [copySourceUnit, setCopySourceUnit] = useState(null);
    const [copySourceLesson, setCopySourceLesson] = useState(null);
    const [copyDestTeacher, setCopyDestTeacher] = useState(null);
    const [copyDestCourse, setCopyDestCourse] = useState(null);

    const [teacherCourses, setTeacherCourses] = useState([]);
    const [destCourses, setDestCourses] = useState([]);
    const [unitsList, setUnitsList] = useState([]);
    const [lessonsList, setLessonsList] = useState([]);
    const [destUnitsList, setDestUnitsList] = useState([]);

    const [coursesLoading, setCoursesLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [teacherSearch, setTeacherSearch] = useState('');
    const [unitSearch, setUnitSearch] = useState('');
    const [lessonSearch, setLessonSearch] = useState('');
    const [copySaving, setCopySaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, sRes] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/admin/subjects'),
            ]);
            setTeachers(tRes.data.data);
            setSubjects(sRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = useMemo(() => {
        const q = courseSearch.trim().toLowerCase();
        if (!q) return teacherCourses;
        return teacherCourses.filter(c => (c.title || '').toLowerCase().includes(q));
    }, [teacherCourses, courseSearch]);

    const filteredDestCourses = useMemo(() => {
        const q = courseSearch.trim().toLowerCase();
        if (!q) return destCourses;
        return destCourses.filter(c => (c.title || '').toLowerCase().includes(q));
    }, [destCourses, courseSearch]);

    const filteredDestTeachers = useMemo(() => {
        const q = teacherSearch.trim().toLowerCase();
        const list = teachers.filter(t => t.id !== copySourceTeacher?.id);
        if (!q) return list;
        return list.filter(t =>
            (t.name || '').toLowerCase().includes(q) ||
            (t.email || '').toLowerCase().includes(q) ||
            (t.main_subject || '').toLowerCase().includes(q)
        );
    }, [teachers, teacherSearch, copySourceTeacher]);

    const filteredUnits = useMemo(() => {
        const q = unitSearch.trim().toLowerCase();
        if (!q) return unitsList;
        return unitsList.filter(u => (u.title || '').toLowerCase().includes(q));
    }, [unitsList, unitSearch]);

    const filteredLessons = useMemo(() => {
        const q = lessonSearch.trim().toLowerCase();
        if (!q) return lessonsList;
        return lessonsList.filter(l => (l.title || '').toLowerCase().includes(q));
    }, [lessonsList, lessonSearch]);

    const filteredDestUnits = useMemo(() => {
        const q = unitSearch.trim().toLowerCase();
        if (!q) return destUnitsList;
        return destUnitsList.filter(u => (u.title || '').toLowerCase().includes(q));
    }, [destUnitsList, unitSearch]);

    const resetCopyState = () => {
        setCopyKind(null);
        setCopyStep(null);
        setCopySourceTeacher(null);
        setCopySourceCourse(null);
        setCopySourceUnit(null);
        setCopySourceLesson(null);
        setCopyDestTeacher(null);
        setCopyDestCourse(null);
        setTeacherCourses([]);
        setDestCourses([]);
        setUnitsList([]);
        setLessonsList([]);
        setDestUnitsList([]);
        setCourseSearch('');
        setTeacherSearch('');
        setUnitSearch('');
        setLessonSearch('');
    };

    const loadTeacherCourses = async (teacherId) => {
        const res = await api.get(`/admin/teachers/${teacherId}/courses`);
        return res.data?.data || [];
    };

    const loadCourseUnits = async (courseId) => {
        const res = await api.get(`/admin/courses/${courseId}/units`);
        return res.data?.data || [];
    };

    const loadUnitLessons = async (unitId) => {
        const res = await api.get(`/admin/units/${unitId}/lessons`);
        return res.data?.data || [];
    };

    const openCopy = async (teacher, kind) => {
        resetCopyState();
        setCopySourceTeacher(teacher);
        setCopyKind(kind);
        setCopyStep('src-course');
        setCoursesLoading(true);
        try {
            setTeacherCourses(await loadTeacherCourses(teacher.id));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل تحميل كورسات المدرس');
            resetCopyState();
        } finally {
            setCoursesLoading(false);
        }
    };

    const closeCopyModal = () => {
        if (copySaving) return;
        resetCopyState();
    };

    const handleSelectSrcCourse = async (course) => {
        setCopySourceCourse(course);
        setCourseSearch('');
        if (copyKind === 'course') {
            setTeacherSearch('');
            setCopyStep('dest-teacher');
            return;
        }
        setUnitSearch('');
        setCopyStep('src-unit');
        setListLoading(true);
        try {
            setUnitsList(await loadCourseUnits(course.id));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل تحميل الوحدات');
            setCopyStep('src-course');
        } finally {
            setListLoading(false);
        }
    };

    const handleSelectSrcUnit = async (unit) => {
        setCopySourceUnit(unit);
        setUnitSearch('');
        if (copyKind === 'unit') {
            setTeacherSearch('');
            setCopyStep('dest-teacher');
            return;
        }
        setLessonSearch('');
        setCopyStep('src-lesson');
        setListLoading(true);
        try {
            setLessonsList(await loadUnitLessons(unit.id));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل تحميل الدروس');
            setCopyStep('src-unit');
        } finally {
            setListLoading(false);
        }
    };

    const handleSelectSrcLesson = (lesson) => {
        setCopySourceLesson(lesson);
        setTeacherSearch('');
        setCopyStep('dest-teacher');
    };

    const handleSelectDestTeacher = async (teacher) => {
        if (copyKind === 'course') {
            await handleCopyCourse(teacher);
            return;
        }
        setCopyDestTeacher(teacher);
        setCourseSearch('');
        setCopyStep('dest-course');
        setCoursesLoading(true);
        try {
            setDestCourses(await loadTeacherCourses(teacher.id));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل تحميل كورسات المدرس الوجهة');
            setCopyStep('dest-teacher');
        } finally {
            setCoursesLoading(false);
        }
    };

    const handleSelectDestCourse = async (course) => {
        if (copyKind === 'unit') {
            await handleCopyUnit(course);
            return;
        }
        setCopyDestCourse(course);
        setUnitSearch('');
        setCopyStep('dest-unit');
        setListLoading(true);
        try {
            setDestUnitsList(await loadCourseUnits(course.id));
        } catch (err) {
            alert(err.response?.data?.message || 'فشل تحميل وحدات الكورس الوجهة');
            setCopyStep('dest-course');
        } finally {
            setListLoading(false);
        }
    };

    const handleSelectDestUnit = async (unit) => {
        await handleCopyLesson(unit);
    };

    const handleCopyCourse = async (destTeacher) => {
        if (!copySourceCourse || copySaving) return;
        setCopySaving(true);
        try {
            await api.post(`/admin/courses/${copySourceCourse.id}/copy`, {
                destination_teacher_id: destTeacher.id
            });
            alert(`تم نسخ الكورس "${copySourceCourse.title}" إلى المدرس ${destTeacher.name} بنجاح!`);
            resetCopyState();
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'فشل نسخ الكورس');
        } finally {
            setCopySaving(false);
        }
    };

    const handleCopyUnit = async (destCourse) => {
        if (!copySourceUnit || copySaving) return;
        setCopySaving(true);
        try {
            await api.post(`/admin/units/${copySourceUnit.id}/copy`, {
                destination_course_id: destCourse.id
            });
            alert(`تم نسخ الوحدة "${copySourceUnit.title}" إلى الكورس "${destCourse.title}" بنجاح!`);
            resetCopyState();
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'فشل نسخ الوحدة');
        } finally {
            setCopySaving(false);
        }
    };

    const handleCopyLesson = async (destUnit) => {
        if (!copySourceLesson || copySaving) return;
        setCopySaving(true);
        try {
            await api.post(`/admin/lessons/${copySourceLesson.id}/copy`, {
                destination_unit_id: destUnit.id
            });
            alert(`تم نسخ الدرس "${copySourceLesson.title}" إلى الوحدة "${destUnit.title}" بنجاح!`);
            resetCopyState();
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'فشل نسخ الدرس');
        } finally {
            setCopySaving(false);
        }
    };

    const goBack = () => {
        if (copySaving) return;
        const backMap = {
            'dest-unit': 'dest-course',
            'dest-course': 'dest-teacher',
            'dest-teacher': copyKind === 'course' ? 'src-course' : (copyKind === 'unit' ? 'src-unit' : 'src-lesson'),
            'src-lesson': 'src-unit',
            'src-unit': 'src-course',
        };
        const prev = backMap[copyStep];
        if (!prev) return;
        setCopyStep(prev);
        if (prev === 'src-course') {
            setCopySourceCourse(null);
            setCopySourceUnit(null);
            setCopySourceLesson(null);
            setCourseSearch('');
        }
        if (prev === 'src-unit') {
            setCopySourceUnit(null);
            setCopySourceLesson(null);
            setUnitSearch('');
        }
        if (prev === 'src-lesson') {
            setCopySourceLesson(null);
            setLessonSearch('');
        }
        if (prev === 'dest-teacher') {
            setCopyDestTeacher(null);
            setCopyDestCourse(null);
            setDestCourses([]);
            setDestUnitsList([]);
            setTeacherSearch('');
        }
        if (prev === 'dest-course') {
            setCopyDestCourse(null);
            setDestUnitsList([]);
            setCourseSearch('');
        }
    };

    const copyTitle = () => {
        if (copyKind === 'unit') return 'نسخ وحدة';
        if (copyKind === 'lesson') return 'نسخ درس';
        return 'نسخ كورس';
    };

    const openCreateModal = () => {
        setEditingTeacher(null);
        setFormData(emptyTeacher);
        setModalOpen(true);
    };

    const openEditModal = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            name: teacher.name || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            password: '',
            main_subject: teacher.main_subject || '',
            profile_image_url: teacher.profile_image_url || '',
            address: '',
            date_of_birth: '',
            notes: ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTeacher) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.put(`/admin/teachers/${editingTeacher.id}`, payload);
            } else {
                await api.post('/admin/teachers', formData);
            }
            fetchData();
            setModalOpen(false);
            setFormData(emptyTeacher);
            setEditingTeacher(null);
        } catch (err) {
            alert(editingTeacher ? 'Error updating teacher' : 'Error creating teacher');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeacher = async (id, name) => {
        if (!window.confirm(`Delete teacher "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/teachers/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete teacher. They may have active courses or students.');
        }
    };

    const handleViewDashboard = async (teacher) => {
        setImpersonatingId(teacher.id);
        try {
            const res = await api.post(`/admin/teachers/${teacher.id}/impersonate`);
            const payload = res.data?.data;
            if (!payload?.token) {
                alert('Could not open teacher dashboard.');
                return;
            }

            localStorage.setItem('impersonation_admin_token', localStorage.getItem('token') || '');
            localStorage.setItem('impersonation_admin_user', localStorage.getItem('user') || '');
            localStorage.setItem('impersonation_teacher_name', teacher.name || 'Teacher');

            localStorage.setItem('token', payload.token);
            localStorage.setItem('user', JSON.stringify({ user: payload.user, ...payload.user }));

            navigate('/teacher');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to open teacher dashboard.');
        } finally {
            setImpersonatingId(null);
        }
    };

    const renderListModal = ({
        title,
        subtitle,
        searchValue,
        onSearch,
        searchPlaceholder,
        loading: isLoading,
        emptyText,
        emptySearchText,
        items,
        onSelect,
        renderItem,
        showBack = true,
    }) => (
        <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200">
            <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Copy size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">{title}</h2>
                            {subtitle && (
                                <p className="text-xs text-[#64748B] font-semibold mt-0.5 truncate max-w-[240px]">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={closeCopyModal} className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {onSearch && (
                    <div className="px-4 pt-4">
                        <div className="relative">
                            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={e => onSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pr-10 pl-4 text-sm font-semibold text-[#0F172A] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                                dir="rtl"
                            />
                        </div>
                    </div>
                )}

                <div className="p-4 max-h-[380px] overflow-y-auto space-y-2" dir="rtl">
                    {isLoading ? (
                        <div className="py-10 text-center">
                            <Loader2 className="animate-spin mx-auto text-indigo-400 mb-2" size={28} />
                            <p className="text-sm text-[#64748B] font-semibold">جاري التحميل...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-10 text-center">
                            <BookOpen className="mx-auto text-[#CBD5E1] mb-2" size={28} />
                            <p className="text-sm text-[#64748B] font-semibold">
                                {searchValue?.trim() ? emptySearchText : emptyText}
                            </p>
                        </div>
                    ) : (
                        items.map(item => (
                            <button
                                key={item.id}
                                disabled={copySaving}
                                onClick={() => onSelect(item)}
                                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#E2E8F0] hover:border-indigo-300 hover:bg-indigo-50/60 transition-all text-right group disabled:opacity-50"
                            >
                                {renderItem(item)}
                                <ChevronRight size={14} className="text-[#94A3B8] group-hover:text-indigo-500 shrink-0 transition-colors rotate-180" />
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex gap-2">
                    {showBack && copyStep !== 'src-course' && (
                        <button
                            onClick={goBack}
                            disabled={copySaving}
                            className="flex-1 h-11 rounded-xl font-bold text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors text-sm disabled:opacity-50"
                        >
                            رجوع
                        </button>
                    )}
                    <button
                        onClick={closeCopyModal}
                        disabled={copySaving}
                        className="flex-1 h-11 rounded-xl font-bold text-[#64748B] border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] transition-colors text-sm disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Staff Administration</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Manage educational staff.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={openCreateModal} className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <UserPlus size={18} /> Register Teacher
                    </button>
                </div>
            </div>

            <div className="bg-white w-full rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
                        <p className="text-[#64748B] font-medium">Loading staff records...</p>
                    </div>
                ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <Users className="text-indigo-600 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">No Teachers Found</h3>
                        <p className="text-[#64748B]">Get started by registering a new teacher.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Teacher Profile</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Expertise</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Contact Details</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Engagement</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {teachers.map(t => (
                                    <tr key={t.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-100 flex-shrink-0">
                                                    {t.profile_image_url ? (
                                                        <img src={t.profile_image_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                            {t.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => handleViewDashboard(t)}
                                                        className="font-bold text-[#0F172A] block hover:text-indigo-600 transition-colors text-left"
                                                        title="View teacher dashboard"
                                                    >
                                                        {t.name}
                                                    </button>
                                                    <span className="text-xs text-[#94A3B8] font-medium">Instructor ID: #{t.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                                {t.main_subject}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-sm text-[#475569] font-medium">{t.email}</span>
                                        </td>
                                        <td className="py-5 px-8">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-[#94A3B8] w-16">Courses</span>
                                                    <span className="font-bold text-[#0F172A]">{t.courses_count || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-[#94A3B8] w-16">Students</span>
                                                    <span className="font-bold text-[#0F172A]">{t.total_enrollments || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <div className="flex justify-end items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() => openCopy(t, 'course')}
                                                    className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="نسخ كورس"
                                                >
                                                    <Copy size={14} />
                                                    نسخ كورس
                                                </button>
                                                <button
                                                    onClick={() => openCopy(t, 'unit')}
                                                    className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="نسخ وحدة"
                                                >
                                                    <Layers size={14} />
                                                    نسخ وحدة
                                                </button>
                                                <button
                                                    onClick={() => openCopy(t, 'lesson')}
                                                    className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="نسخ درس"
                                                >
                                                    <FileText size={14} />
                                                    نسخ درس
                                                </button>
                                                <button
                                                    onClick={() => handleViewDashboard(t)}
                                                    disabled={impersonatingId === t.id}
                                                    className="p-2 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="View dashboard as teacher"
                                                >
                                                    {impersonatingId === t.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="p-2 text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit teacher"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteTeacher(t.id, t.name)} className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete teacher">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl shadow-slate-200/50 p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">
                                    {editingTeacher ? 'Edit Instructor' : 'Register Instructor'}
                                </h2>
                                <p className="text-sm text-[#64748B] mt-1">
                                    {editingTeacher ? 'Update teacher account details.' : 'Create a new teacher account.'}
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                <input className="input-field" placeholder="Instructor's full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                    <input className="input-field" placeholder="example@academy.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Phone Number</label>
                                    <input className="input-field" placeholder="+1 (555) 000-0000" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Avatar URL <span className="text-[#94A3B8] font-normal">(Optional)</span></label>
                                <input className="input-field" placeholder="https://images.com/profile.jpg" value={formData.profile_image_url} onChange={e => setFormData({ ...formData, profile_image_url: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Password {editingTeacher && <span className="text-[#94A3B8] font-normal">(leave blank to keep)</span>}</label>
                                    <input className="input-field" placeholder="••••••••" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingTeacher} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Primary Subject</label>
                                    <select className="input-field cursor-pointer" value={formData.main_subject} onChange={e => setFormData({ ...formData, main_subject: e.target.value })} required>
                                        <option value="" disabled>Select subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#F1F5F9] mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                                    Cancel
                                </button>
                                <button disabled={saving} className="bg-indigo-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : (editingTeacher ? 'Save Changes' : 'Confirm Registration')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {copyStep === 'src-course' && renderListModal({
                title: copyTitle(),
                subtitle: `كورسات: ${copySourceTeacher?.name || ''}`,
                searchValue: courseSearch,
                onSearch: setCourseSearch,
                searchPlaceholder: 'ابحث عن كورس...',
                loading: coursesLoading,
                emptyText: 'لا توجد كورسات لهذا المدرس',
                emptySearchText: 'لا توجد نتائج للبحث',
                items: filteredCourses,
                onSelect: handleSelectSrcCourse,
                showBack: false,
                renderItem: (c) => (
                    <>
                        <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                            <BookOpen size={14} className="text-[#64748B] group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{c.title}</span>
                            {(c.grade_name || c.subject_name) && (
                                <span className="text-[11px] text-[#94A3B8] font-medium">
                                    {[c.subject_name, c.grade_name].filter(Boolean).join(' • ')}
                                </span>
                            )}
                        </div>
                    </>
                ),
            })}

            {copyStep === 'src-unit' && renderListModal({
                title: copyTitle(),
                subtitle: copySourceCourse?.title,
                searchValue: unitSearch,
                onSearch: setUnitSearch,
                searchPlaceholder: 'ابحث عن وحدة...',
                loading: listLoading,
                emptyText: 'لا توجد وحدات في هذا الكورس',
                emptySearchText: 'لا توجد نتائج للبحث',
                items: filteredUnits,
                onSelect: handleSelectSrcUnit,
                renderItem: (u) => (
                    <>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                            <Layers size={14} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{u.title}</span>
                            <span className="text-[11px] text-[#94A3B8] font-medium">ترتيب: {u.sort_order ?? u.sortOrder ?? '-'}</span>
                        </div>
                    </>
                ),
            })}

            {copyStep === 'src-lesson' && renderListModal({
                title: 'نسخ درس',
                subtitle: copySourceUnit?.title,
                searchValue: lessonSearch,
                onSearch: setLessonSearch,
                searchPlaceholder: 'ابحث عن درس...',
                loading: listLoading,
                emptyText: 'لا توجد دروس في هذه الوحدة',
                emptySearchText: 'لا توجد نتائج للبحث',
                items: filteredLessons,
                onSelect: handleSelectSrcLesson,
                renderItem: (l) => (
                    <>
                        <div className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition-colors">
                            <FileText size={14} className="text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{l.title}</span>
                            <span className="text-[11px] text-[#94A3B8] font-medium">{l.type || 'lesson'}</span>
                        </div>
                    </>
                ),
            })}

            {copyStep === 'dest-teacher' && renderListModal({
                title: copyKind === 'course' ? 'نسخ إلى مدرس' : 'اختر المدرس الوجهة',
                subtitle: copyKind === 'course'
                    ? copySourceCourse?.title
                    : (copyKind === 'unit' ? copySourceUnit?.title : copySourceLesson?.title),
                searchValue: teacherSearch,
                onSearch: setTeacherSearch,
                searchPlaceholder: 'ابحث عن مدرس...',
                loading: false,
                emptyText: 'لا يوجد مدرسون',
                emptySearchText: 'لا توجد نتائج',
                items: filteredDestTeachers,
                onSelect: handleSelectDestTeacher,
                renderItem: (t) => (
                    <>
                        {copySaving ? (
                            <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                                {t.profile_image_url ? (
                                    <img src={t.profile_image_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-indigo-600 font-bold text-sm">{(t.name || '?').charAt(0)}</span>
                                )}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{t.name}</span>
                            <span className="text-[11px] text-[#94A3B8] font-medium">{t.main_subject || t.email}</span>
                        </div>
                    </>
                ),
            })}

            {copyStep === 'dest-course' && renderListModal({
                title: 'اختر كورس الوجهة',
                subtitle: `كورسات: ${copyDestTeacher?.name || ''}`,
                searchValue: courseSearch,
                onSearch: setCourseSearch,
                searchPlaceholder: 'ابحث عن كورس...',
                loading: coursesLoading,
                emptyText: 'لا توجد كورسات لهذا المدرس',
                emptySearchText: 'لا توجد نتائج للبحث',
                items: filteredDestCourses,
                onSelect: handleSelectDestCourse,
                renderItem: (c) => (
                    <>
                        <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                            <BookOpen size={14} className="text-[#64748B] group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{c.title}</span>
                            {(c.grade_name || c.subject_name) && (
                                <span className="text-[11px] text-[#94A3B8] font-medium">
                                    {[c.subject_name, c.grade_name].filter(Boolean).join(' • ')}
                                </span>
                            )}
                        </div>
                    </>
                ),
            })}

            {copyStep === 'dest-unit' && renderListModal({
                title: 'اختر وحدة الوجهة',
                subtitle: copyDestCourse?.title,
                searchValue: unitSearch,
                onSearch: setUnitSearch,
                searchPlaceholder: 'ابحث عن وحدة...',
                loading: listLoading,
                emptyText: 'لا توجد وحدات في هذا الكورس',
                emptySearchText: 'لا توجد نتائج للبحث',
                items: filteredDestUnits,
                onSelect: handleSelectDestUnit,
                renderItem: (u) => (
                    <>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                            {copySaving ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Layers size={14} className="text-emerald-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#0F172A] text-sm block truncate">{u.title}</span>
                            <span className="text-[11px] text-[#94A3B8] font-medium">ترتيب: {u.sort_order ?? u.sortOrder ?? '-'}</span>
                        </div>
                    </>
                ),
            })}
        </div>
    );
};

export default ManageTeachers;
