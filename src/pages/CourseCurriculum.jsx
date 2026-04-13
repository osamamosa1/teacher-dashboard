import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
    ChevronLeft, Loader2, PlayCircle, Plus, Layout, Video, FileText,
    CheckCircle, HelpCircle, Award, Clock, Trash2, Edit2,
    List as ListIcon, Layers, Settings, Users, ArrowLeft,
    ChevronRight, CloudLightning, X, Phone, UserPlus, ChevronUp, ChevronDown
} from 'lucide-react';

const CourseCurriculum = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lessons');
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [parentModalOpen, setParentModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [parentData, setParentData] = useState({ 
        student_id: null, 
        student_name: '', 
        parent_phone: '',
        parent_name: '',
        parent_email: '',
        parent_password: ''
    });
    const [units, setUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [currentUnit, setCurrentUnit] = useState({ title: '', sort_order: 1 });
    const [unitSaving, setUnitSaving] = useState(false);
    const [quizSubmissions, setQuizSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [selectedStudentResult, setSelectedStudentResult] = useState(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        }
    }, [activeTab, courseId]);

    const fetchCurriculum = async () => {
        try {
            const [cRes, lRes, uRes] = await Promise.all([
                api.get(`/teacher/courses/${courseId}`),
                api.get(`/teacher/courses/${courseId}/lessons`),
                api.get(`/teacher/courses/${courseId}/units`)
            ]);
            setCourse(cRes.data.data);
            setLessons(lRes.data.data);
            setUnits(uRes.data.data || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) navigate('/teacher/courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
            const res = await api.get(`/teacher/courses/${courseId}/students`);
            setStudents(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchUnits = async () => {
        setUnitsLoading(true);
        try {
            const res = await api.get(`/teacher/courses/${courseId}/units`);
            setUnits(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setUnitsLoading(false);
        }
    };

    const handleSaveUnit = async (e) => {
        e.preventDefault();
        setUnitSaving(true);
        try {
            const payload = { ...currentUnit, course_id: parseInt(courseId) };
            if (currentUnit.id) {
                await api.put(`/teacher/units/${currentUnit.id}`, payload);
            } else {
                await api.post('/teacher/units', payload);
            }
            setUnitModalOpen(false);
            setCurrentUnit({ title: '', sort_order: 1 });
            fetchUnits();
        } catch (err) {
            alert('Failed to save unit.');
        } finally {
            setUnitSaving(false);
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!window.confirm('Delete this unit? It may affect lessons.')) return;
        try {
            await api.delete(`/teacher/units/${id}`);
            fetchUnits();
        } catch (err) {
            alert('Error deleting unit');
        }
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
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign parent.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLesson = async (id) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/teacher/lessons/${id}`);
            fetchCurriculum();
        } catch (err) { alert('Error deleting lesson'); }
    };

    const handleViewSubmissions = async (lesson) => {
        setSelectedQuiz(lesson);
        setSubmissionsModalOpen(true);
        setLoadingSubmissions(true);
        try {
            const res = await api.get(`/teacher/quizzes/${lesson.id}/submissions`);
            setQuizSubmissions(res.data.data || []);
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleViewStudentResult = async (studentId) => {
        setLoadingResult(true);
        setResultModalOpen(true);
        try {
            const res = await api.get(`/student/exam/${selectedQuiz.id}/result?studentId=${studentId}`);
            setSelectedStudentResult(res.data.data);
        } catch (err) {
            console.error('Error fetching result:', err);
            alert('Failed to load quiz results.');
            setResultModalOpen(false);
        } finally {
            setLoadingResult(false);
        }
    };

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
            const cid = parseInt(courseId);

            switch (sortConfig.key) {
                case 'name':
                    aVal = a.student_name?.toLowerCase() || '';
                    bVal = b.student_name?.toLowerCase() || '';
                    break;
                case 'score':
                    aVal = a.avg_marks_percentage || 0;
                    bVal = b.avg_marks_percentage || 0;
                    break;
                case 'progress':
                    aVal = a.enrolled_courses?.find(c => c.id === cid)?.progress || 0;
                    bVal = b.enrolled_courses?.find(c => c.id === cid)?.progress || 0;
                    break;
                case 'date_enrolled':
                    aVal = a.enrolled_courses?.find(c => c.id === cid)?.enrolled_at || '';
                    bVal = b.enrolled_courses?.find(c => c.id === cid)?.enrolled_at || '';
                    break;
                case 'expiry':
                    aVal = a.enrolled_courses?.find(c => c.id === cid)?.expiry_date || '';
                    bVal = b.enrolled_courses?.find(c => c.id === cid)?.expiry_date || '';
                    break;
                case 'status':
                    aVal = a.is_active ? 1 : 0;
                    bVal = b.is_active ? 1 : 0;
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

    const sortedStudents = getSortedStudents(students);

    const getTypeBadge = (type) => {
        switch (type) {
            case 'video':
                return <span className="flex items-center gap-1.5 text-[#0F172A] text-sm font-bold uppercase tracking-widest"><PlayCircle size={14} /> Video</span>;
            case 'exam':
                return <span className="flex items-center gap-1.5 text-[#0F172A] text-sm font-bold uppercase tracking-widest"><HelpCircle size={14} /> Exam</span>;
            case 'assignment':
                return <span className="flex items-center gap-1.5 text-[#0F172A] text-sm font-bold uppercase tracking-widest"><FileText size={14} /> Assignment</span>;
            case 'text':
                return <span className="flex items-center gap-1.5 text-[#0F172A] text-sm font-bold uppercase tracking-widest"><FileText size={14} /> Text</span>;
            default:
                return <span className="flex items-center gap-1.5 text-[#0F172A] text-sm font-bold uppercase tracking-widest"><PlayCircle size={14} /> Lesson</span>;
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-black w-8 h-8" />
        </div>
    );

    return (
        <div className="space-y-10 pb-10">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm font-bold text-[#64748B] mb-8 tracking-widest uppercase">
                <Link to="/teacher" className="hover:text-black transition-colors">Dashboard</Link>
                <ChevronRight size={14} className="mx-3" />
                <Link to="/teacher/courses" className="hover:text-black transition-colors">Courses</Link>
                <ChevronRight size={14} className="mx-3" />
                <span className="text-black">{course?.title}</span>
            </div>

            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#E2E8F0]">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">{course?.title}</h1>
                    <p className="text-[#64748B] text-base font-semibold mt-2">
                        {activeTab === 'lessons' ? 'Curriculum Builder & Lesson Management' : 'Course Participants & Performance'}
                    </p>
                </div>

                {activeTab === 'lessons' ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setCurrentUnit({ title: '', sort_order: units.length + 1 });
                                setUnitModalOpen(true);
                            }}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-3 font-bold tracking-tight flex items-center justify-center gap-2 transition-all border border-indigo-100 rounded-lg"
                        >
                            <Layers size={18} /> Manage Units
                        </button>
                        <Link
                            to={`/teacher/courses/${courseId}/lessons/new`}
                            className="bg-[#0F172A] hover:bg-black text-white px-6 py-3 font-bold tracking-tight flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus size={18} /> Add New Lesson
                        </Link>
                    </div>
                ) : (
                    <Link
                        to="/teacher/students"
                        className="bg-[#0F172A] hover:bg-black text-white px-6 py-3 font-bold tracking-tight flex items-center justify-center gap-2 transition-all"
                    >
                        <Users size={18} /> Manage All Students
                    </Link>
                )}
            </div>

            {/* Tabs - Flat Style */}
            <div className="flex items-center gap-8 border-b-2 border-transparent">
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`flex items-center gap-2 pb-2 transition-all duration-200 ${activeTab === 'lessons' ? 'text-[#0F172A] font-extrabold border-b-2 border-[#0F172A]' : 'text-[#94A3B8] font-bold hover:text-[#0F172A]'}`}
                >
                    Lessons ({lessons.length})
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 pb-2 transition-all duration-200 ${activeTab === 'students' ? 'text-[#0F172A] font-extrabold border-b-2 border-[#0F172A]' : 'text-[#94A3B8] font-bold hover:text-[#0F172A]'}`}
                >
                    Students ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('units')}
                    className={`flex items-center gap-2 pb-2 transition-all duration-200 ${activeTab === 'units' ? 'text-[#0F172A] font-extrabold border-b-2 border-[#0F172A]' : 'text-[#94A3B8] font-bold hover:text-[#0F172A]'}`}
                >
                    Units ({units.length})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 pb-2 transition-all duration-200 ${activeTab === 'settings' ? 'text-[#0F172A] font-extrabold border-b-2 border-[#0F172A]' : 'text-[#94A3B8] font-bold hover:text-[#0F172A]'}`}
                >
                    Settings
                </button>
            </div>

            {/* Content Area */}
            <div className="-mx-2">
                {activeTab === 'lessons' ? (
                    lessons.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="font-extrabold text-[#0F172A] text-xl">No lessons yet</p>
                            <p className="text-sm font-semibold text-[#64748B] mt-2 mb-6">Create material to populate this module.</p>
                            <Link
                                to={`/teacher/courses/${courseId}/lessons/new`}
                                className="text-[#0F172A] font-bold border-b border-[#0F172A] pb-0.5 hover:text-black hover:border-black transition-all inline-flex items-center gap-2"
                            >
                                <Plus size={16} /> Create Lesson
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col border-t border-b border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-4 py-4 px-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest hidden md:grid">
                                <div className="col-span-1">No.</div>
                                <div className="col-span-5">Lesson Identifier</div>
                                <div className="col-span-2">Format</div>
                                <div className="col-span-3">Status</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>

                            {lessons.map((lesson, idx) => {
                                const num = (idx + 1).toString().padStart(2, '0');
                                return (
                                    <div key={lesson.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 px-2 hover:bg-[#F8FAFC] transition-colors items-center group">
                                        <div className="col-span-1 font-bold text-[#64748B] hidden md:block">{num}</div>
                                        <div className="col-span-5">
                                            <p 
                                                className={`font-extrabold text-[#0F172A] text-base group-hover:underline decoration-2 underline-offset-2 ${lesson.type === 'exam' ? 'cursor-pointer text-indigo-700' : ''}`}
                                                onClick={() => lesson.type === 'exam' && handleViewSubmissions(lesson)}
                                            >
                                                {lesson.title}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            {getTypeBadge(lesson.type)}
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2 text-sm text-[#0F172A] font-semibold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Published
                                        </div>
                                        <div className="col-span-1 text-right flex justify-end gap-3">
                                            <Link
                                                to={`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`}
                                                className="text-[#94A3B8] hover:text-[#0F172A] transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="text-[#94A3B8] hover:text-red-600 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                ) : activeTab === 'students' ? (
                    studentsLoading ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-[#64748B] font-semibold">
                            <Loader2 className="animate-spin w-5 h-5" /> Loading participants...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="font-extrabold text-[#0F172A] text-xl">No students registered</p>
                            <p className="text-sm font-semibold text-[#64748B] mt-2 mb-6">Go to Student Management to enroll students in this course.</p>
                            <Link
                                to="/teacher/students"
                                className="text-[#0F172A] font-bold border-b border-[#0F172A] pb-0.5 hover:text-black hover:border-black transition-all inline-flex items-center gap-2"
                            >
                                <Users size={16} /> Manage Students
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col border-t border-b border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                            {/* Sort Bar */}
                            <div className="bg-[#F8FAFC] px-4 py-3 flex items-center justify-between border-b border-[#E2E8F0]">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Sort By:</span>
                                    {[
                                        { key: 'name', label: 'Alphabetical' },
                                        { key: 'score', label: 'Average Score' },
                                        { key: 'date_enrolled', label: 'Date Enrolled' },
                                        { key: 'expiry', label: 'Ending Enrollment' }
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => handleSort(opt.key)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all flex items-center gap-1.5 border ${
                                                sortConfig.key === opt.key 
                                                ? 'bg-[#0F172A] border-[#0F172A] text-white' 
                                                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                                            }`}
                                        >
                                            {opt.label}
                                            {sortConfig.key === opt.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-[#64748B]">Showing {students.length} Participants</p>
                            </div>

                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-4 py-4 px-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest hidden md:grid">
                                <div className="col-span-5">Student</div>
                                <div className="col-span-3">Progress</div>
                                <div className="col-span-2 text-center">Avg. Performance</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {sortedStudents.map((student) => {
                                // Find progress for this specific course
                                const courseInfo = student.enrolled_courses?.find(c => c.id === parseInt(courseId));
                                const progress = courseInfo?.progress || 0;

                                return (
                                    <div key={student.student_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5 px-2 hover:bg-[#F8FAFC] transition-colors items-center group">
                                        <div className="col-span-5 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                                                {student.profile_image_url ? (
                                                    <img src={student.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    student.student_name?.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-[#0F172A] text-sm">{student.student_name}</p>
                                                <p className="text-[11px] text-[#94A3B8] font-bold tracking-tight">{student.student_email}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-3 pr-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[11px] font-black text-[#64748B] w-8">{progress}%</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`px-2 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase ${student.avg_marks_percentage >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {student.avg_marks_percentage}%
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${student.is_active ? 'text-green-600' : 'text-[#94A3B8]'} mr-2`}>
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
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
                                                className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-all"
                                                title="Assign Parent"
                                            >
                                                <UserPlus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                ) : activeTab === 'units' ? (
                    <div className="flex flex-col border-t border-b border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                        <div className="grid grid-cols-12 gap-4 py-4 px-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest hidden md:grid">
                            <div className="col-span-1">Order</div>
                            <div className="col-span-8">Unit Title</div>
                            <div className="col-span-3 text-right">Actions</div>
                        </div>

                        {units.length === 0 ? (
                            <div className="py-20 text-center col-span-12">
                                <p className="font-extrabold text-[#0F172A] text-xl">No units defined</p>
                                <p className="text-sm font-semibold text-[#64748B] mt-2">Units help organize lessons into logical sections.</p>
                            </div>
                        ) : (
                            units.sort((a,b) => a.sort_order - b.sort_order).map((unit) => (
                                <div key={unit.id} className="grid grid-cols-12 gap-4 py-6 px-2 hover:bg-[#F8FAFC] transition-colors items-center group">
                                    <div className="col-span-1 font-bold text-[#64748B]">{unit.sort_order}</div>
                                    <div className="col-span-8">
                                        <p className="font-extrabold text-[#0F172A] text-base">{unit.title}</p>
                                    </div>
                                    <div className="col-span-3 text-right flex justify-end gap-3">
                                        <button onClick={() => { setCurrentUnit(unit); setUnitModalOpen(true); }} className="text-[#94A3B8] hover:text-[#0F172A] transition-all">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteUnit(unit.id)} className="text-[#94A3B8] hover:text-red-600 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <Settings className="mx-auto text-[#94A3B8] mb-4" size={40} />
                        <p className="font-extrabold text-[#0F172A] text-xl">Module Settings</p>
                        <p className="text-sm font-semibold text-[#64748B] mt-2">Adjust course pricing, access levels, and visibility.</p>
                    </div>
                )}
            </div>

            {/* Parent Modal */}
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

                        <form onSubmit={handleAssignParent} className="space-y-4 text-left">
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
                                <p className="text-[10px] text-[#94A3B8] mt-1 font-bold">Existing parent accounts are linked instantly.</p>
                            </div>

                            <div className="pt-2 border-t border-[#F1F5F9] mt-4">
                                <p className="text-xs font-bold text-[#64748B] mb-4 uppercase tracking-widest">Create New Record (If Phone Not Exists)</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Parent Name</label>
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
                                className="w-full bg-[#0F172A] text-white h-14 rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 mt-6"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Process Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Unit Modal */}
            {unitModalOpen && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{currentUnit.id ? 'Edit Unit' : 'Create New Unit'}</h2>
                                <p className="text-sm text-[#64748B] mt-1 font-medium">Organize your curriculum structure.</p>
                            </div>
                            <button onClick={() => setUnitModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUnit} className="space-y-6 text-left">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Unit Title</label>
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="E.g., Getting Started with Fundamentals"
                                        value={currentUnit.title}
                                        onChange={e => setCurrentUnit({ ...currentUnit, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Sort Order</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                                        value={currentUnit.sort_order}
                                        onChange={e => setCurrentUnit({ ...currentUnit, sort_order: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={unitSaving}
                                className="w-full bg-[#0F172A] text-white h-14 rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 mt-6"
                            >
                                {unitSaving ? <Loader2 className="animate-spin" size={20} /> : (currentUnit.id ? 'Update Unit' : 'Create Unit')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-[#E2E8F0]">
                <div>
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Total Duration</p>
                    <p className="text-2xl font-black text-[#0F172A]">12h 45m</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Assessments</p>
                    <p className="text-2xl font-black text-[#0F172A]">4 Quizzes</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Status</p>
                    <p className="text-2xl font-black text-[#0F172A]">Live</p>
                </div>
            </div>

            {/* Quiz Submissions Modal */}
            {submissionsModalOpen && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Quiz Submissions</h2>
                                <p className="text-[#64748B] text-sm font-medium mt-1">Reviewing results for <span className="text-indigo-600 font-bold">{selectedQuiz?.title}</span></p>
                            </div>
                            <button onClick={() => setSubmissionsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E2E8F0] shadow-sm text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingSubmissions ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
                                    <p className="text-[#64748B] font-medium">Fetching submissions...</p>
                                </div>
                            ) : quizSubmissions.length === 0 ? (
                                <div className="text-center py-20">
                                    <CheckCircle className="mx-auto text-[#94A3B8] w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-[#0F172A] font-bold text-lg">No submissions yet</p>
                                    <p className="text-[#64748B]">Students will appear here once they complete the quiz.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quizSubmissions.map(sub => (
                                        <div 
                                            key={sub.student_id} 
                                            onClick={() => handleViewStudentResult(sub.student_id)}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC]/30 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group/item"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                                                    {sub.student_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0F172A] group-hover/item:text-indigo-700 transition-colors">{sub.student_name}</p>
                                                    <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">{sub.submitted_at}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-black ${sub.passed ? 'text-green-600' : 'text-red-500'}`}>
                                                    {sub.score}/{sub.total_mark}
                                                </p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                                                    {sub.passed ? 'Passed' : 'Failed'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 flex justify-end">
                            <button onClick={() => setSubmissionsModalOpen(false)} className="px-8 py-3 rounded-2xl font-bold bg-[#0F172A] text-white hover:bg-black transition-colors">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Result Modal */}
            {resultModalOpen && (
                <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-[#F1F5F9] flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Student Performance</h2>
                                <p className="text-[#64748B] text-sm font-bold uppercase tracking-widest mt-1">Quiz Answer Breakdown</p>
                            </div>
                            <button onClick={() => setResultModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {loadingResult ? (
                                <div className="py-20 flex flex-col items-center">
                                    <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
                                    <p className="text-[#64748B] font-bold">Analyzing answers...</p>
                                </div>
                            ) : selectedStudentResult ? (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Total Score</p>
                                            <p className="text-xl font-black text-amber-900">{selectedStudentResult.total_score}/{selectedStudentResult.total_mark}</p>
                                        </div>
                                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Status</p>
                                            <p className={`text-xl font-black ${selectedStudentResult.passed ? 'text-indigo-900' : 'text-red-900'}`}>{selectedStudentResult.passed ? 'PASSED' : 'FAILED'}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Accuracy</p>
                                            <p className="text-xl font-black text-emerald-900">{Math.round((selectedStudentResult.total_score/selectedStudentResult.total_mark)*100)}%</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Submitted</p>
                                            <p className="text-[13px] font-black text-slate-900 leading-tight">{selectedStudentResult.submitted_at}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                                            <ListIcon size={18} className="text-indigo-600" /> Question Detailed View
                                        </h3>
                                        {selectedStudentResult.questions_breakdown?.map((item, id) => (
                                            <div key={id} className={`p-6 rounded-[24px] border-2 transition-all ${item.correct ? 'border-emerald-100 bg-emerald-50/20' : 'border-red-100 bg-red-50/20'}`}>
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <p className="font-bold text-[#0F172A] text-lg">
                                                        <span className="text-indigo-600 mr-2">Q{id+1}.</span> {item.question_text}
                                                    </p>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {item.correct ? 'Correct' : 'Incorrect'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold">
                                                    <div className="bg-white/60 p-3 rounded-xl border border-white">
                                                        <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-1">Student Answer</p>
                                                        <p className={item.correct ? 'text-emerald-700' : 'text-red-600'}>
                                                            {item.student_option_id ? `Selected Option ID: ${item.student_option_id}` : 'No Answer Provided'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Correct Solution</p>
                                                        <p className="text-emerald-900">
                                                            {item.correct_option_text || `Option ID: ${item.correct_option_id}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                        <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 flex justify-end shrink-0">
                            <button onClick={() => setResultModalOpen(false)} className="px-8 py-3 rounded-2xl font-bold border-2 border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-colors">Close Review</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCurriculum;
