import { useState, useEffect } from 'react';
import { Plus, Trash2, ClipboardList, X, CheckCircle, Clock, Users, BookOpen, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, AlertCircle, Calendar, Eye, Edit2 } from 'lucide-react';
import api from '../api/axios';

const CurrentExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedExam, setExpandedExam] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [toast, setToast] = useState(null);
    
    const [editId, setEditId] = useState(null);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [selectedExamTitle, setSelectedExamTitle] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const emptyQuestion = () => ({
        id: null,
        text: '', type: 'mcq', degree: 1,
        options: [
            { id: null, text: '', isCorrect: false },
            { id: null, text: '', isCorrect: false },
            { id: null, text: '', isCorrect: false },
            { id: null, text: '', isCorrect: false },
        ]
    });

    const [form, setForm] = useState({
        title: '',
        description: '',
        duration: 30,
        passingScore: 0,
        startDate: '',
        endDate: '',
        gradeId: '',
        subjectId: '',
        questions: [emptyQuestion()],
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [examsRes, gradesRes, subjectsRes] = await Promise.allSettled([
                api.get('/teacher/standalone-exams'),

                api.get('/teacher/grades'),
                api.get('/teacher/subjects'),
            ]);
            
            if (examsRes.status === 'fulfilled') setExams(examsRes.value.data.data || []);
            else throw new Error(`Exams fetch failed with status: ${examsRes.reason?.response?.status || 'network error'} for ${examsRes.reason?.config?.url}`);
            
            if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data.data || []);
            if (subjectsRes.status === 'fulfilled') setSubjects(subjectsRes.value.data.data || []);
        } catch (e) {
            console.error(e);
            showToast(`Failed to load data: ${e.response?.data?.message || e.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Form helpers ────────────────────────────────────────────────────────

    const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));

    const removeQuestion = (qi) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));

    const updateQuestion = (qi, field, value) => setForm(f => {
        const qs = [...f.questions];
        qs[qi] = { ...qs[qi], [field]: value };
        return { ...f, questions: qs };
    });

    const updateOption = (qi, oi, field, value) => setForm(f => {
        const qs = [...f.questions];
        const opts = [...qs[qi].options];
        // If marking correct in MCQ, uncheck all others first
        if (field === 'isCorrect' && value === true) opts.forEach((o, i) => { if (i !== oi) opts[i] = { ...o, isCorrect: false }; });
        opts[oi] = { ...opts[oi], [field]: value };
        qs[qi] = { ...qs[qi], options: opts };
        return { ...f, questions: qs };
    });

    const addOption = (qi) => setForm(f => {
        const qs = [...f.questions];
        qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', isCorrect: false }] };
        return { ...f, questions: qs };
    });

    const removeOption = (qi, oi) => setForm(f => {
        const qs = [...f.questions];
        qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, i) => i !== oi) };
        return { ...f, questions: qs };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return showToast('Exam title is required', 'error');
        if (form.questions.length === 0) return showToast('Add at least one question', 'error');
        for (const q of form.questions) {
            if (!q.text.trim()) return showToast('All questions must have text', 'error');
            if (q.options.every(o => !o.isCorrect)) return showToast('Each question must have one correct answer', 'error');
        }
        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                duration: parseInt(form.duration),
                passing_score: parseInt(form.passingScore),
                start_date: form.startDate,
                end_date: form.endDate,
                grade_id: form.gradeId ? parseInt(form.gradeId) : null,
                subject_id: form.subjectId ? parseInt(form.subjectId) : null,
                questions: form.questions.map(q => ({
                    id: q.id,
                    text: q.text, type: q.type, degree: parseInt(q.degree),
                    options: q.options.map(o => ({ 
                        id: o.id,
                        text: o.text, 
                        is_correct: o.isCorrect 
                    }))
                }))
            };
            
            if (editId) {
                await api.put(`/teacher/standalone-exams/${editId}`, payload);
                showToast('Exam updated successfully!');
            } else {
                await api.post('/teacher/standalone-exams', payload);
                showToast('Exam created successfully!');
            }

            setShowForm(false);
            setEditId(null);
            fetchData();
            setForm({ title: '', description: '', duration: 30, passingScore: 0, startDate: '', endDate: '', gradeId: '', subjectId: '', questions: [emptyQuestion()] });
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save exam', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    
    const openEdit = (exam) => {
        setForm({
            title: exam.title || '',
            description: exam.description || '',
            duration: exam.duration || 30,
            passingScore: exam.passingScore || 0,
            startDate: exam.startDate ? exam.startDate.slice(0, 16) : '',
            endDate: exam.endDate ? exam.endDate.slice(0, 16) : '',
            gradeId: exam.grade?.id || '',
            subjectId: exam.subject?.id || '',
            questions: exam.questions?.length > 0 ? exam.questions.map(q => ({
                id: q.id,
                text: q.text, type: q.type, degree: q.degree,
                options: q.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
            })) : [emptyQuestion()]
        });
        setEditId(exam.id);
        setShowForm(true);
    };

    const fetchSubmissions = async (exam) => {
        setSubmissionsLoading(true);
        setShowSubmissions(true);
        setSelectedExamTitle(exam.title);
        try {
            const res = await api.get(`/teacher/standalone-exams/${exam.id}/submissions`);
            setSubmissions(res.data.data || []);
            setSelectedSubmission(null);
        } catch (e) {
            showToast('Failed to load submissions', 'error');
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const toggleExam = async (id) => {
        try {
            const res = await api.put(`/teacher/standalone-exams/${id}/toggle`);

            showToast(res.data.message);
            fetchData();
        } catch { showToast('Failed to toggle exam', 'error'); }
    };

    const deleteExam = async (id) => {
        if (!window.confirm('Delete this exam? This cannot be undone.')) return;
        try {
            await api.delete(`/teacher/standalone-exams/${id}`);

            showToast('Exam deleted');
            fetchData();
        } catch { showToast('Failed to delete exam', 'error'); }
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    const totalMark = form.questions.reduce((s, q) => s + (parseInt(q.degree) || 0), 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-semibold text-sm transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Current Events Exams</h1>
                    <p className="text-[#64748B] mt-1">Create and manage standalone exams for your students</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="bg-indigo-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                    <Plus size={18} /> New Exam
                </button>
            </div>

            {/* Exam Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="p-6 bg-indigo-50 rounded-full mb-4"><ClipboardList size={40} className="text-indigo-400" /></div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">No exams yet</h3>
                    <p className="text-[#64748B]">Click "New Exam" to create your first current events exam</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map(exam => (
                        <div key={exam.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${exam.isActive ? 'border-indigo-100' : 'border-gray-200 opacity-70'}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${exam.isActive && !exam.isExpired ? 'bg-emerald-100 text-emerald-700' : exam.isExpired ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {exam.isExpired ? 'Expired' : exam.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {exam.grade && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{exam.grade.name}</span>}
                                        </div>
                                        <h3 className="text-base font-extrabold text-[#0F172A]">{exam.title}</h3>
                                        {exam.description && <p className="text-sm text-[#64748B] mt-1 line-clamp-2">{exam.description}</p>}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => fetchSubmissions(exam)} title="View Submissions" className="p-2 rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all">
                                            <Eye size={18} />
                                        </button>
                                        <button onClick={() => openEdit(exam)} title="Edit Exam" className="p-2 rounded-xl text-amber-500 bg-amber-50 hover:bg-amber-100 transition-all">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => toggleExam(exam.id)} title={exam.isActive ? 'Deactivate' : 'Activate'}
                                            className={`p-2 rounded-xl transition-all ${exam.isActive ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}>
                                            {exam.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button onClick={() => deleteExam(exam.id)} title="Delete Exam" className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#64748B]">
                                    <span className="flex items-center gap-1.5"><BookOpen size={13} /> {exam.questionsCount} Questions</span>
                                    <span className="flex items-center gap-1.5"><Clock size={13} /> {exam.duration} min</span>
                                    <span className="flex items-center gap-1.5"><Users size={13} /> {exam.submissionsCount} Submissions</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle size={13} /> Pass: {exam.passingScore}/{exam.totalMark}</span>
                                </div>

                                <div className="mt-3 flex gap-3 text-xs text-[#94A3B8]">
                                    <span className="flex items-center gap-1"><Calendar size={11} /> Start: {exam.startDate?.slice(0, 10)}</span>
                                    <span className="flex items-center gap-1"><Calendar size={11} /> End: {exam.endDate?.slice(0, 10)}</span>
                                </div>
                            </div>

                            <button onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                                className="w-full px-6 py-3 border-t border-[#F1F5F9] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] rounded-b-2xl flex items-center justify-center gap-1 transition-all">
                                {expandedExam === exam.id ? <><ChevronUp size={14} /> Hide Questions</> : <><ChevronDown size={14} /> Show Questions</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Exam Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl mt-8 mb-8">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-8 border-b border-[#F1F5F9]">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#0F172A]">{editId ? 'Edit Exam' : 'Create Current Exam'}</h2>
                                <p className="text-[#64748B] mt-1 text-sm">{editId ? 'Update details and questions' : 'Build a standalone exam for students'}</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-all text-[#64748B]"><X size={22} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-[#0F172A] text-sm uppercase tracking-widest">Exam Info</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="Exam title (e.g. Mid-Term Math Quiz)"
                                        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 font-semibold text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Description / instructions (optional)" rows={2}
                                        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none resize-none" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">Duration (min)</label>
                                        <input type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">Passing Score</label>
                                        <input type="number" min="0" max={totalMark} value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">Grade</label>
                                        <select value={form.gradeId} onChange={e => setForm(f => ({ ...f, gradeId: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                                            <option value="">All grades</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">Subject</label>
                                        <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                                            <option value="">All subjects</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">Start Date</label>
                                        <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#64748B] mb-1 block">End Date</label>
                                        <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3">
                                    <span className="text-sm font-bold text-indigo-800">Total Mark: {totalMark} pts</span>
                                    <span className="text-xs text-indigo-600">{form.questions.length} question(s)</span>
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-extrabold text-[#0F172A] text-sm uppercase tracking-widest">Questions</h3>
                                    <button type="button" onClick={addQuestion}
                                        className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all">
                                        <Plus size={14} /> Add Question
                                    </button>
                                </div>

                                {form.questions.map((q, qi) => (
                                    <div key={qi} className="border border-[#E2E8F0] rounded-2xl p-5 space-y-4 bg-[#FAFBFF]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-[#64748B] uppercase tracking-widest">Question {qi + 1}</span>
                                            {form.questions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all"><Trash2 size={15} /></button>
                                            )}
                                        </div>

                                        <input value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)}
                                            placeholder="Question text..." required
                                            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none bg-white focus:ring-2 focus:ring-indigo-200" />

                                        <div className="flex gap-3 items-center">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-[#64748B] mb-1 block">Type</label>
                                                <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}
                                                    className="w-full border border-[#E2E8F0] bg-white rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200">
                                                    <option value="mcq">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[#64748B] mb-1 block">Marks</label>
                                                <input type="number" min="1" value={q.degree} onChange={e => updateQuestion(qi, 'degree', e.target.value)}
                                                    className="w-24 border border-[#E2E8F0] bg-white rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
                                            </div>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#64748B]">Answers — click the circle to mark correct</label>
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-3">
                                                    <button type="button" onClick={() => updateOption(qi, oi, 'isCorrect', true)}
                                                        className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-indigo-400'}`} />
                                                    <input value={opt.text} onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                                                        placeholder={`Option ${oi + 1}`}
                                                        className="flex-1 border border-[#E2E8F0] bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                                                    {q.options.length > 2 && (
                                                        <button type="button" onClick={() => removeOption(qi, oi)} className="p-1 rounded text-red-400 hover:bg-red-50 shrink-0"><X size={14} /></button>
                                                    )}
                                                </div>
                                            ))}
                                            {q.type === 'mcq' && q.options.length < 6 && (
                                                <button type="button" onClick={() => addOption(qi)}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 transition-all">
                                                    <Plus size={12} /> Add option
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-all">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="px-8 py-3 rounded-xl font-extrabold bg-indigo-900 text-white hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (editId ? 'Update Exam' : 'Create Exam')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {showSubmissions && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pt-10">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">Submissions</h2>
                                <p className="text-sm text-gray-500 mt-1">{selectedExamTitle}</p>
                            </div>
                            <button onClick={() => setShowSubmissions(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {submissionsLoading ? (
                                <div className="flex justify-center p-10"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>
                            ) : submissions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-semibold">No submissions yet.</div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Score</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {submissions.map(sub => (
                                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                            {sub.student_name?.charAt(0) || sub.studentName?.charAt(0) || '?'}
                                                        </div>
                                                        {sub.student_name || sub.studentName || `Student #${sub.student_id || sub.studentId}`}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        <span className={sub.passed ? 'text-emerald-600' : 'text-red-500'}>
                                                            {sub.score}
                                                        </span>
                                                        <span className="text-gray-400"> / {sub.total_mark || sub.totalMark}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {sub.passed ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                                                                <CheckCircle size={12} /> Passed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                                                                <AlertCircle size={12} /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {sub.submitted_at || sub.submittedAt}
                                                        {(sub.is_auto_submitted || sub.isAutoSubmitted) && <span className="ml-2 text-xs text-orange-400 border border-orange-200 px-1.5 py-0.5 rounded">Auto</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => setSelectedSubmission(sub)}
                                                            className="px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs transition-all"
                                                        >
                                                            View Answers
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Selection Preview / Nested Detail */}
                            {selectedSubmission && (
                                <div className="mt-8 pt-8 border-t-2 border-gray-100 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                                            <ClipboardList className="text-indigo-600" size={20} />
                                            Answers for {selectedSubmission.student_name || selectedSubmission.studentName}
                                        </h3>
                                        <button onClick={() => setSelectedSubmission(null)} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-lg transition-all">Close Details</button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {(() => {
                                            const breakdown = selectedSubmission.questions_breakdown || selectedSubmission.questionsBreakdown;
                                            console.log('Submission detail data:', selectedSubmission);
                                            if (!breakdown || breakdown.length === 0) {
                                                return <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed">No answer data available for this submission.</div>;
                                            }
                                            return breakdown.map((q, idx) => (
                                                <div key={idx} className={`p-5 rounded-2xl border-2 transition-all ${q.correct ? 'border-emerald-100 bg-emerald-50/20' : 'border-red-100 bg-red-50/20'}`}>
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1 block">Question {idx + 1}</span>
                                                            <p className="font-bold text-[#0F172A] text-sm leading-relaxed">{q.question_text || q.questionText}</p>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {q.correct ? (
                                                                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs bg-emerald-100/50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                                    <CheckCircle size={14} /> +{q.degree}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-red-500 font-black text-xs bg-red-100/50 px-2.5 py-1 rounded-full border border-red-200">
                                                                    <X size={14} /> 0/{q.degree}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-3 mt-4 text-xs">
                                                        <div className="flex-1 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                                            <span className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Student Answer</span>
                                                            <span className={`font-black ${q.correct ? 'text-emerald-700' : 'text-danger'}`}>{q.student_answer_text || q.studentAnswerText || 'No Answer'}</span>
                                                        </div>
                                                        {!q.correct && (
                                                            <div className="flex-1 p-3 rounded-xl bg-white border border-gray-100 shadow-sm border-l-4 border-l-emerald-400">
                                                                <span className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Correct Answer</span>
                                                                <span className="font-black text-emerald-700">{q.correct_option_text || q.correctOptionText}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrentExams;
