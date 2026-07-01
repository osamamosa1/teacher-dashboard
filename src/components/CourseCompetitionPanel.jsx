import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
    Trophy, Loader2, Plus, Search, Users, HelpCircle, Eye, EyeOff,
    Trash2, Save, ChevronDown, ChevronUp, X
} from 'lucide-react';

const CourseCompetitionPanel = ({ courseId }) => {
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState({ cup: null, league: null });
    const [students, setStudents] = useState([]);
    const [availableExams, setAvailableExams] = useState({ course_exams: [], standalone_exams: [] });
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [editQuestions, setEditQuestions] = useState(null);
    const [activeType, setActiveType] = useState('league');

    const [form, setForm] = useState({
        type: 'league',
        student_ids: [],
        lesson_exam_ids: [],
        standalone_exam_ids: [],
    });

    useEffect(() => {
        loadAll();
    }, [courseId]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [compRes, studRes, examRes] = await Promise.all([
                api.get(`/teacher/courses/${courseId}/competitions`),
                api.get(`/teacher/courses/${courseId}/students`),
                api.get(`/teacher/courses/${courseId}/competitions/available-exams`),
            ]);
            setCompetitions(compRes.data?.data || { cup: null, league: null });
            setStudents(studRes.data?.data || []);
            setAvailableExams(examRes.data?.data || { course_exams: [], standalone_exams: [] });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        const q = studentSearch.trim().toLowerCase();
        if (!q) return students;
        return students.filter(s =>
            (s.student_name || s.name || '').toLowerCase().includes(q) ||
            (s.student_email || s.email || '').toLowerCase().includes(q)
        );
    }, [students, studentSearch]);

    const toggleStudent = (id) => {
        setForm(f => ({
            ...f,
            student_ids: f.student_ids.includes(id)
                ? f.student_ids.filter(x => x !== id)
                : [...f.student_ids, id],
        }));
    };

    const toggleLessonExam = (id) => {
        setForm(f => ({
            ...f,
            lesson_exam_ids: f.lesson_exam_ids.includes(id)
                ? f.lesson_exam_ids.filter(x => x !== id)
                : [...f.lesson_exam_ids, id],
        }));
    };

    const toggleStandaloneExam = (id) => {
        setForm(f => ({
            ...f,
            standalone_exam_ids: f.standalone_exam_ids.includes(id)
                ? f.standalone_exam_ids.filter(x => x !== id)
                : [...f.standalone_exam_ids, id],
        }));
    };

    const handleCreate = async () => {
        if (form.student_ids.length < 2) {
            alert('اختر طالبين على الأقل');
            return;
        }
        if (!form.lesson_exam_ids.length && !form.standalone_exam_ids.length) {
            alert('اختر امتحان واحد على الأقل لنسخ الأسئلة');
            return;
        }
        setCreating(true);
        try {
            await api.post(`/teacher/courses/${courseId}/competitions`, {
                type: form.type,
                student_ids: form.student_ids,
                lesson_exam_ids: form.lesson_exam_ids,
                standalone_exam_ids: form.standalone_exam_ids,
            });
            setShowForm(false);
            setForm({ type: 'league', student_ids: [], lesson_exam_ids: [], standalone_exam_ids: [] });
            await loadAll();
            alert('تم إنشاء المسابقة بنجاح. المسابقة القديمة من نفس النوع تم حذفها.');
        } catch (e) {
            alert(e.response?.data?.message || 'فشل إنشاء المسابقة');
        } finally {
            setCreating(false);
        }
    };

    const toggleShowAnswers = async (comp) => {
        try {
            await api.put(`/teacher/courses/${courseId}/competitions/${comp.id}/show-answers`, {
                allow_show_answers: !comp.allow_show_answers,
            });
            await loadAll();
        } catch (e) {
            alert('فشل تحديث الإعداد');
        }
    };

    const openQuestionEditor = (comp) => {
        setEditQuestions(JSON.parse(JSON.stringify(comp.questions || [])));
        setActiveType(comp.type);
    };

    const saveQuestions = async () => {
        const comp = competitions[activeType];
        if (!comp) return;
        setSaving(true);
        try {
            await api.put(`/teacher/courses/${courseId}/competitions/${comp.id}/questions`, {
                questions: editQuestions.map((q, i) => ({
                    id: 0,
                    text: q.text,
                    type: q.type || 'mcq',
                    degree: q.degree || 1,
                    sort_order: i,
                    options: (q.options || []).map(o => ({
                        id: 0,
                        text: o.text,
                        is_correct: !!o.is_correct,
                    })),
                })),
            });
            setEditQuestions(null);
            await loadAll();
            alert('تم حفظ الأسئلة');
        } catch (e) {
            alert('فشل حفظ الأسئلة');
        } finally {
            setSaving(false);
        }
    };

    const addQuestion = () => {
        setEditQuestions(qs => [...(qs || []), {
            text: '', type: 'mcq', degree: 1,
            options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
        }]);
    };

    const deleteQuestion = (idx) => {
        setEditQuestions(qs => qs.filter((_, i) => i !== idx));
    };

    const renderCompetitionCard = (type, label) => {
        const comp = competitions[type];
        if (!comp) {
            return (
                <div key={type} className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                    <Trophy className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-500 font-bold mb-1">لا توجد مسابقة {label}</p>
                    <p className="text-xs text-slate-400">أنشئ مسابقة جديدة من الزر أعلاه</p>
                </div>
            );
        }

        return (
            <div key={type} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="font-extrabold text-[#0F172A] text-lg flex items-center gap-2">
                            <Trophy size={20} className="text-amber-500" />
                            {label}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {comp.participants?.length || 0} متنافس · {comp.matches?.length || 0} مباراة · {comp.questions?.length || 0} سؤال
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => toggleShowAnswers(comp)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                comp.allow_show_answers
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                        >
                            {comp.allow_show_answers ? <Eye size={16} /> : <EyeOff size={16} />}
                            {comp.allow_show_answers ? 'سماح — الإجابات ظاهرة' : 'منع — الإجابات مخفية'}
                        </button>
                        <button
                            onClick={() => openQuestionEditor(comp)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-bold"
                        >
                            <HelpCircle size={16} /> تعديل الأسئلة
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-sm text-slate-600 mb-2">الترتيب (فوز=3 · تعادل=1)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b">
                                    <th className="text-right py-2 px-2">#</th>
                                    <th className="text-right py-2 px-2">الطالب</th>
                                    <th className="text-right py-2 px-2">المجموعة</th>
                                    <th className="text-right py-2 px-2">نقاط</th>
                                    <th className="text-right py-2 px-2">ف/ت/خ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(comp.participants || []).map((p, i) => (
                                    <tr key={p.id} className="border-b border-slate-50">
                                        <td className="py-2 px-2 font-bold">{i + 1}</td>
                                        <td className="py-2 px-2">
                                            {p.student_name}
                                            {p.direct_advance && (
                                                <span className="mr-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">متأهل مباشرة</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2">{p.direct_advance ? '—' : (p.group_number || '—')}</td>
                                        <td className="py-2 px-2 font-extrabold text-indigo-600">{p.points}</td>
                                        <td className="py-2 px-2 text-xs">{p.wins}/{p.draws}/{p.losses}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(comp.matches || []).length > 0 && (
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 mb-2">المباريات</h4>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                            {comp.matches.map(m => (
                                <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2 text-sm">
                                    <span>{m.player1_name} vs {m.player2_name}</span>
                                    <span className="font-bold text-slate-500">
                                        {m.status === 'completed'
                                            ? `${m.player1_score} - ${m.player2_score}${m.is_draw ? ' (تعادل)' : ''}`
                                            : m.status === 'partial' ? 'جاري...' : 'لم تبدأ'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A]">المسابقات</h2>
                    <p className="text-sm text-slate-500">دوري أو كأس — إنشاء مسابقة جديدة يحذف القديمة من نفس النوع</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setForm(f => ({ ...f, type: activeType })); }}
                    className="flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800"
                >
                    <Plus size={18} /> إضافة مسابقة
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 space-y-5">
                    <h3 className="font-extrabold text-lg">مسابقة جديدة</h3>

                    <div className="flex gap-3">
                        {['league', 'cup'].map(t => (
                            <button
                                key={t}
                                onClick={() => setForm(f => ({ ...f, type: t }))}
                                className={`px-5 py-2 rounded-xl font-bold border-2 transition-all ${
                                    form.type === t
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-500'
                                }`}
                            >
                                {t === 'league' ? 'دوري' : 'كأس (مجموعات)'}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                        {form.type === 'league'
                            ? 'الدوري: كل طالب يواجه كل الطلاب الآخرين. الفوز 3 نقاط، التعادل 1.'
                            : 'الكأس: مجموعات من 4. الزيادة 1-2 يتأهلون مباشرة. أكثر من 2 يُكوَّنون مجموعة. كل واحد يواجه زملاء مجموعته.'}
                    </p>

                    <div>
                        <label className="font-bold text-sm flex items-center gap-2 mb-2">
                            <Users size={16} /> اختيار المتنافسين
                        </label>
                        <div className="relative mb-2">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="بحث بالاسم..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y">
                            {filteredStudents.map(s => {
                                const id = s.student_id || s.id;
                                const name = s.student_name || s.name;
                                const selected = form.student_ids.includes(id);
                                return (
                                    <label key={id} className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 ${selected ? 'bg-indigo-50' : ''}`}>
                                        <input type="checkbox" checked={selected} onChange={() => toggleStudent(id)} />
                                        <span className="text-sm font-medium">{name}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">محدد: {form.student_ids.length}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold text-sm mb-2 block">امتحانات الكورس (نسخ الأسئلة)</label>
                            <div className="max-h-32 overflow-y-auto border rounded-xl divide-y">
                                {(availableExams.course_exams || []).map(ex => (
                                    <label key={ex.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                                        <input type="checkbox" checked={form.lesson_exam_ids.includes(ex.id)} onChange={() => toggleLessonExam(ex.id)} />
                                        {ex.title} ({ex.questions_count} س)
                                    </label>
                                ))}
                                {!availableExams.course_exams?.length && <p className="p-3 text-xs text-slate-400">لا توجد امتحانات في الكورس</p>}
                            </div>
                        </div>
                        <div>
                            <label className="font-bold text-sm mb-2 block">امتحانات مستقلة</label>
                            <div className="max-h-32 overflow-y-auto border rounded-xl divide-y">
                                {(availableExams.standalone_exams || []).map(ex => (
                                    <label key={ex.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                                        <input type="checkbox" checked={form.standalone_exam_ids.includes(ex.id)} onChange={() => toggleStandaloneExam(ex.id)} />
                                        {ex.title} ({ex.questions_count} س)
                                    </label>
                                ))}
                                {!availableExams.standalone_exams?.length && <p className="p-3 text-xs text-slate-400">لا توجد امتحانات مستقلة</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="animate-spin" size={16} /> : <Trophy size={16} />}
                            إنشاء المسابقة
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border font-bold text-slate-500">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-b pb-2">
                {['league', 'cup'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveType(t)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${activeType === t ? 'bg-[#0F172A] text-white' : 'text-slate-500'}`}
                    >
                        {t === 'league' ? 'الدوري' : 'الكأس'}
                    </button>
                ))}
            </div>

            <div className="grid gap-4">
                {renderCompetitionCard('league', 'مسابقة الدوري')}
                {renderCompetitionCard('cup', 'مسابقة الكأس')}
            </div>

            {editQuestions && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-extrabold">تعديل أسئلة المسابقة</h3>
                            <button onClick={() => setEditQuestions(null)}><X size={20} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-4">
                            {editQuestions.map((q, qi) => (
                                <div key={qi} className="border rounded-xl p-4 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                            value={q.text}
                                            onChange={e => {
                                                const copy = [...editQuestions];
                                                copy[qi].text = e.target.value;
                                                setEditQuestions(copy);
                                            }}
                                            placeholder="نص السؤال"
                                        />
                                        <button onClick={() => deleteQuestion(qi)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>
                                    {(q.options || []).map((o, oi) => (
                                        <div key={oi} className="flex gap-2 items-center">
                                            <input
                                                type="radio"
                                                name={`correct-${qi}`}
                                                checked={!!o.is_correct}
                                                onChange={() => {
                                                    const copy = [...editQuestions];
                                                    copy[qi].options = copy[qi].options.map((opt, j) => ({ ...opt, is_correct: j === oi }));
                                                    setEditQuestions(copy);
                                                }}
                                            />
                                            <input
                                                className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                                                value={o.text}
                                                onChange={e => {
                                                    const copy = [...editQuestions];
                                                    copy[qi].options[oi].text = e.target.value;
                                                    setEditQuestions(copy);
                                                }}
                                                placeholder={`اختيار ${oi + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <button onClick={addQuestion} className="w-full py-2 border-2 border-dashed rounded-xl text-sm font-bold text-indigo-600">
                                + إضافة سؤال
                            </button>
                        </div>
                        <div className="p-4 border-t flex gap-3">
                            <button onClick={saveQuestions} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold">
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} حفظ
                            </button>
                            <button onClick={() => setEditQuestions(null)} className="px-5 py-2 rounded-xl border font-bold">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCompetitionPanel;
