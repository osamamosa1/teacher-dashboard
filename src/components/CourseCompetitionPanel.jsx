import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
    Trophy, Loader2, Plus, Search, Users, HelpCircle, Eye, EyeOff,
    Trash2, Save, ChevronDown, ChevronUp, X
} from 'lucide-react';

const normalizeStudent = (s) => ({
    id: s.student_id ?? s.studentId ?? s.id,
    name: s.student_name ?? s.studentName ?? s.name ?? '—',
    email: s.student_email ?? s.email ?? '',
});

const normalizeOption = (o) => ({
    text: String(o?.text ?? o?.Text ?? o?.option_text ?? ''),
    is_correct: !!(o?.is_correct ?? o?.isCorrect ?? o?.IsCorrect),
});

const normalizeQuestionsForEdit = (questions) =>
    (questions || []).map(q => ({
        text: String(q?.text ?? q?.Text ?? ''),
        type: q?.type ?? q?.Type ?? 'mcq',
        degree: Number(q?.degree ?? q?.Degree ?? 1) || 1,
        options: (q?.options ?? q?.Options ?? []).length
            ? (q.options ?? q.Options).map(normalizeOption)
            : [{ text: '', is_correct: true }, { text: '', is_correct: false }],
    }));

const CourseCompetitionPanel = ({ courseId, students: studentsProp }) => {
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState({ cup: null, league: null });
    const [students, setStudents] = useState([]);
    const [availableExams, setAvailableExams] = useState({ course_exams: [], standalone_exams: [] });
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [editQuestions, setEditQuestions] = useState(null);
    const [editRoundId, setEditRoundId] = useState(null);
    const [tieModal, setTieModal] = useState(null);
    const [matchDetail, setMatchDetail] = useState(null);
    const [answersView, setAnswersView] = useState(null);
    const [copyExamForm, setCopyExamForm] = useState({ lesson: [], standalone: [] });
    const [activeType, setActiveType] = useState('league');

    const [form, setForm] = useState({
        type: 'league',
        student_ids: [],
        questions_per_round: 5,
        time_limit_minutes: 15,
    });

    useEffect(() => {
        loadAll();
    }, [courseId]);

    useEffect(() => {
        if (studentsProp?.length) {
            setStudents(studentsProp);
        }
    }, [studentsProp]);

    const loadStudents = async () => {
        try {
            const res = await api.get(`/teacher/courses/${courseId}/students`);
            const raw = res.data?.data ?? res.data ?? [];
            setStudents(Array.isArray(raw) ? raw : []);
        } catch (e) {
            console.error('Failed to load course students', e);
            setStudents([]);
        }
    };

    const loadAll = async () => {
        setLoading(true);
        await loadStudents();

        try {
            const [compResult, examResult, lessonsResult] = await Promise.allSettled([
                api.get(`/teacher/courses/${courseId}/competitions`),
                api.get(`/teacher/courses/${courseId}/competitions/available-exams`),
                api.get(`/teacher/courses/${courseId}/lessons`),
            ]);

            if (compResult.status === 'fulfilled') {
                setCompetitions(compResult.value.data?.data || { cup: null, league: null });
            } else {
                console.error('Competitions load failed', compResult.reason);
                setCompetitions({ cup: null, league: null });
            }

            let exams = examResult.status === 'fulfilled'
                ? (examResult.value.data?.data || { course_exams: [], standalone_exams: [] })
                : { course_exams: [], standalone_exams: [] };

            const lessonsData = lessonsResult.status === 'fulfilled'
                ? (lessonsResult.value.data?.data || [])
                : [];

            if (!exams.course_exams?.length && lessonsData.length) {
                const fromLessons = lessonsData
                    .filter(l => (l.type || '').toLowerCase() === 'exam')
                    .map(l => ({
                        id: l.id,
                        title: l.exam?.title || l.title,
                        source: 'lesson',
                        questions_count: l.exam?.questions?.length ?? 0,
                    }));
                if (fromLessons.length) exams = { ...exams, course_exams: fromLessons };
            }
            setAvailableExams(exams);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        const q = studentSearch.trim().toLowerCase();
        const list = students.map(normalizeStudent);
        if (!q) return list;
        return list.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
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

    const toggleAllFiltered = (select) => {
        const ids = filteredStudents.map(s => s.id);
        setForm(f => {
            if (select) {
                const merged = new Set([...f.student_ids, ...ids]);
                return { ...f, student_ids: [...merged] };
            }
            const idSet = new Set(ids);
            return { ...f, student_ids: f.student_ids.filter(x => !idSet.has(x)) };
        });
    };

    const filteredSelectedCount = useMemo(() => {
        const ids = new Set(filteredStudents.map(s => s.id));
        return form.student_ids.filter(id => ids.has(id)).length;
    }, [filteredStudents, form.student_ids]);

    const allFilteredSelected = filteredStudents.length > 0 && filteredSelectedCount === filteredStudents.length;

    const enrolledCount = students.length;

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
        const studentIds = form.student_ids.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0);
        if (studentIds.length < 2) {
            alert('اختر طالبين على الأقل');
            return;
        }
        if (!courseId || Number.isNaN(courseId)) {
            alert('معرّف الكورس غير صالح');
            return;
        }
        setCreating(true);
        try {
            await api.post(`/teacher/courses/${courseId}/competitions`, {
                type: form.type,
                student_ids: studentIds,
                questions_per_round: Number(form.questions_per_round) || 5,
                time_limit_seconds: (Number(form.time_limit_minutes) || 15) * 60,
            });
            setShowForm(false);
            setForm({ type: 'league', student_ids: [], questions_per_round: 5, time_limit_minutes: 15 });
            await loadAll();
            alert('تم إنشاء المسابقة. أضف أسئلة الجولة 1 ثم فعّلها.');
        } catch (e) {
            const msg = e.response?.data?.message || e.response?.data?.detail || e.message || 'فشل إنشاء المسابقة';
            alert(msg);
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

    const openRoundEditor = (comp, round) => {
        setEditRoundId(round.id);
        setActiveType(comp.type);
        setEditQuestions(normalizeQuestionsForEdit(round.questions || []));
        setCopyExamForm({ lesson: [], standalone: [] });
    };

    const saveQuestions = async () => {
        const comp = competitions[activeType];
        if (!comp || !editRoundId) return;
        setSaving(true);
        try {
            await api.put(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds/${editRoundId}/questions`, {
                questions: editQuestions.map((q, i) => ({
                    id: 0, text: q.text, type: q.type || 'mcq', degree: q.degree || 1, sort_order: i,
                    options: (q.options || []).map(o => ({
                        id: 0,
                        text: String(o.text ?? ''),
                        is_correct: !!(o.is_correct ?? o.isCorrect),
                    })),
                })),
            });
            setEditQuestions(null);
            setEditRoundId(null);
            await loadAll();
            alert('تم حفظ أسئلة الجولة');
        } catch (e) {
            alert('فشل حفظ الأسئلة');
        } finally {
            setSaving(false);
        }
    };

    const copyExamToRound = async (comp) => {
        if (!editRoundId) return;
        if (!copyExamForm.lesson.length && !copyExamForm.standalone.length) {
            alert('اختر امتحان للنسخ');
            return;
        }
        try {
            await api.post(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds/${editRoundId}/copy-from-exam`, {
                lesson_exam_ids: copyExamForm.lesson,
                standalone_exam_ids: copyExamForm.standalone,
            });
            await loadAll();
            const updated = (await api.get(`/teacher/courses/${courseId}/competitions`)).data?.data?.[activeType];
            const round = updated?.rounds?.find(r => r.id === editRoundId);
            if (round) setEditQuestions(normalizeQuestionsForEdit(round.questions || []));
            alert('تم نسخ الأسئلة لهذه الجولة فقط');
        } catch (e) {
            alert(e.response?.data?.message || 'فشل النسخ');
        }
    };

    const activateRound = async (comp, roundId) => {
        if (!window.confirm('تفعيل هذه الجولة؟ الطلاب يقدروا يلعبوا فوراً.')) return;
        try {
            await api.post(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds/${roundId}/activate`);
            await loadAll();
            alert('تم تفعيل الجولة');
        } catch (e) {
            alert(e.response?.data?.message || 'أضف أسئلة أولاً');
        }
    };

    const startNextRound = async (comp) => {
        if (!window.confirm('إغلاق الجولة الحالية؟ من لم يسلّم = 0. ثم إنشاء جولة جديدة.')) return;
        try {
            await api.post(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds/next`);
            await loadAll();
            alert('تم إغلاق الجولة وإنشاء جولة جديدة (مسودة). أضف أسئلتها ثم فعّلها.');
        } catch (e) {
            const data = e.response?.data;
            if (data?.code === 'tie_break_required' && data?.ties?.length) {
                setTieModal({ compId: comp.id, compType: type, ties: data.ties });
                return;
            }
            alert(data?.message || 'فشل');
        }
    };

    const pickKnockoutWinner = async (compId, matchId, winnerId) => {
        try {
            const res = await api.post(`/teacher/courses/${courseId}/competitions/${compId}/matches/${matchId}/pick-winner`, {
                winner_id: winnerId,
            });
            await loadAll();
            const remaining = res.data?.data?.pending_ties || [];
            if (remaining.length === 0) {
                setTieModal(null);
                alert('تم اختيار الفائز. يمكنك الآن بدء الجولة التالية.');
            } else {
                setTieModal(m => m ? { ...m, ties: remaining } : null);
            }
        } catch (e) {
            alert(e.response?.data?.message || 'فشل اختيار الفائز');
        }
    };

    const sortTeacherMatches = (matches) => [...(matches || [])].sort((a, b) => {
        const key = (m) => {
            if (m.status === 'tie_pending' || m.status === 'partial') return 0;
            if (m.status === 'pending') return 1;
            return 2;
        };
        return key(a) - key(b);
    });

    const openMatchDetail = async (comp, match) => {
        try {
            const res = await api.get(`/teacher/courses/${courseId}/competitions/${comp.id}/matches/${match.id}`);
            setMatchDetail({ comp, data: res.data?.data });
            setAnswersView(null);
        } catch (e) {
            alert(e.response?.data?.message || 'فشل تحميل تفاصيل المباراة');
        }
    };

    const showPlayerAnswers = (playerKey, playerName) => {
        if (!matchDetail?.data?.rounds) return;
        const rounds = matchDetail.data.rounds
            .map(r => ({
                round_number: r.round_number,
                submission: r[`${playerKey}_submission`],
            }))
            .filter(r => r.submission?.submitted);
        setAnswersView({ playerName, rounds });
    };

    const addRound = async (comp) => {
        try {
            await api.post(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds`, {
                questions_per_round: comp.questions_per_round || 5,
                time_limit_seconds: comp.time_limit_seconds || 900,
            });
            await loadAll();
        } catch (e) {
            alert('فشل إضافة جولة');
        }
    };

    const updateRoundSettings = async (comp, roundId, field, value) => {
        try {
            const round = comp.rounds?.find(r => r.id === roundId);
            if (!round) return;
            await api.put(`/teacher/courses/${courseId}/competitions/${comp.id}/rounds/${roundId}/settings`, {
                questions_per_round: field === 'q' ? Number(value) : round.questions_per_round,
                time_limit_seconds: field === 't' ? Number(value) * 60 : round.time_limit_seconds,
            });
            await loadAll();
        } catch (e) {
            alert('فشل تحديث الإعدادات');
        }
    };

    const roundStatusLabel = (s) => ({ draft: 'مسودة', active: 'نشطة', closed: 'منتهية' }[s] || s);

    const addQuestion = () => {
        setEditQuestions(qs => [...(qs || []), {
            text: '', type: 'mcq', degree: 1,
            options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
        }]);
    };

    const deleteQuestion = (idx) => {
        setEditQuestions(qs => qs.filter((_, i) => i !== idx));
    };

    const updateQuestionField = (qi, field, value) => {
        setEditQuestions(qs => {
            const copy = [...qs];
            copy[qi] = { ...copy[qi], [field]: value };
            return copy;
        });
    };

    const updateOption = (qi, oi, field, value) => {
        setEditQuestions(qs => {
            const copy = [...qs];
            const options = [...(copy[qi].options || [])];
            if (field === 'is_correct' && value) {
                options.forEach((opt, j) => { options[j] = { ...opt, is_correct: j === oi }; });
            } else {
                options[oi] = { ...options[oi], [field]: value };
            }
            copy[qi] = { ...copy[qi], options };
            return copy;
        });
    };

    const addOption = (qi) => {
        setEditQuestions(qs => {
            const copy = [...qs];
            copy[qi] = {
                ...copy[qi],
                options: [...(copy[qi].options || []), { text: '', is_correct: false }],
            };
            return copy;
        });
    };

    const deleteOption = (qi, oi) => {
        setEditQuestions(qs => {
            const copy = [...qs];
            const options = (copy[qi].options || []).filter((_, j) => j !== oi);
            if (options.length && !options.some(o => o.is_correct)) {
                options[0] = { ...options[0], is_correct: true };
            }
            copy[qi] = { ...copy[qi], options: options.length >= 2 ? options : copy[qi].options };
            return copy;
        });
    };

    const startKnockout = async (comp) => {
        if (!window.confirm('بدء مرحلة خروج المغلوب؟ أول 2 من كل مجموعة + المتأهلون مباشرة — قرعة عشوائية.')) return;
        try {
            await api.post(`/teacher/courses/${courseId}/competitions/${comp.id}/start-knockout`);
            await loadAll();
            alert('تم بدء مرحلة خروج المغلوب');
        } catch (e) {
            alert(e.response?.data?.message || 'تأكد من اكتمال مباريات المجموعات أولاً');
        }
    };

    const formatTime = (sec) => {
        if (!sec && sec !== 0) return '—';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const phaseLabel = (phase) => ({
        groups: 'دور المجموعات',
        knockout: 'خروج المغلوب',
        finished: 'انتهت',
        league: 'الدوري',
    }[phase] || phase);

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
                            · {comp.questions_per_round || 5} سؤال/جولة · {Math.round((comp.time_limit_seconds || 900) / 60)} دقيقة
                        </p>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">
                            {phaseLabel(comp.phase)}
                            {comp.active_round && ` · الجولة ${comp.active_round.round_number} نشطة`}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => addRound(comp)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">
                            + جولة جديدة
                        </button>
                        <button onClick={() => startNextRound(comp)} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold">
                            الجولة التالية
                        </button>
                        {type === 'cup' && comp.phase === 'groups' && (
                            <button onClick={() => startKnockout(comp)} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm font-bold">
                                بدء خروج المغلوب
                            </button>
                        )}
                        <button onClick={() => toggleShowAnswers(comp)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${comp.allow_show_answers ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {comp.allow_show_answers ? <Eye size={16} /> : <EyeOff size={16} />}
                            {comp.allow_show_answers ? 'إظهار الإجابات' : 'إخفاء الإجابات'}
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-sm text-slate-600 mb-2">الجولات</h4>
                    <div className="space-y-2">
                        {(comp.rounds || []).map(round => (
                            <div key={round.id} className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border ${round.status === 'active' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                                <span className="font-bold text-sm">جولة {round.round_number}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${round.status === 'active' ? 'bg-indigo-600 text-white' : round.status === 'closed' ? 'bg-slate-400 text-white' : 'bg-white text-slate-600 border'}`}>
                                    {roundStatusLabel(round.status)}
                                </span>
                                <span className="text-xs text-slate-500">{round.questions_count || 0} سؤال · {round.questions_per_round} يظهر · {Math.round((round.time_limit_seconds || 900) / 60)} د</span>
                                {round.status === 'draft' && (
                                    <>
                                        <input type="number" min={1} defaultValue={round.questions_per_round} onBlur={e => updateRoundSettings(comp, round.id, 'q', e.target.value)} className="w-16 text-xs border rounded px-2 py-1" title="عدد الأسئلة" />
                                        <input type="number" min={1} defaultValue={Math.round((round.time_limit_seconds || 900) / 60)} onBlur={e => updateRoundSettings(comp, round.id, 't', e.target.value)} className="w-16 text-xs border rounded px-2 py-1" title="دقائق" />
                                        <button onClick={() => openRoundEditor(comp, round)} className="text-xs font-bold text-indigo-600 px-2 py-1 bg-white rounded-lg border">أسئلة الجولة</button>
                                        <button onClick={() => activateRound(comp, round.id)} className="text-xs font-bold text-white px-3 py-1 bg-indigo-600 rounded-lg">تفعيل</button>
                                    </>
                                )}
                                {round.status === 'closed' && (
                                    <button onClick={() => openRoundEditor(comp, round)} className="text-xs font-bold text-slate-500 px-2 py-1">عرض الأسئلة</button>
                                )}
                            </div>
                        ))}
                        {!comp.rounds?.length && <p className="text-xs text-slate-400">لا توجد جولات بعد</p>}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-sm text-slate-600 mb-2">الترتيب (فوز=3 · تعادل=1 · التعادل بالوقت)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b">
                                    <th className="text-right py-2 px-2">#</th>
                                    <th className="text-right py-2 px-2">الطالب</th>
                                    <th className="text-right py-2 px-2">المجموعة</th>
                                    <th className="text-right py-2 px-2">نقاط</th>
                                    <th className="text-right py-2 px-2">الوقت</th>
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
                                        <td className="py-2 px-2 text-xs text-slate-500">{formatTime(p.total_time_seconds)}</td>
                                        <td className="py-2 px-2 text-xs">{p.wins}/{p.draws}/{p.losses}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {type === 'cup' && (
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 mb-2">المجموعات</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[...new Set((comp.participants || []).map(p => p.group_number).filter(g => g > 0))].sort().map(gn => (
                                <div key={gn} className="bg-slate-50 rounded-xl p-3">
                                    <p className="font-bold text-sm mb-2">المجموعة {gn}</p>
                                    {(comp.participants || [])
                                        .filter(p => p.group_number === gn)
                                        .sort((a, b) => b.points - a.points || (a.total_time_seconds || 0) - (b.total_time_seconds || 0))
                                        .map((p, i) => (
                                            <div key={p.id} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                                                <span>{i + 1}. {p.student_name}</span>
                                                <span className="font-bold">{p.points}ن · {formatTime(p.total_time_seconds)}</span>
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(comp.pending_ties || []).length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
                        <p className="font-bold text-rose-800 text-sm">⚠️ متعادلون في خروج المغلوب — اختر الفائز قبل الجولة التالية</p>
                        {comp.pending_ties.map(t => (
                            <div key={t.match_id} className="flex flex-wrap items-center gap-2 bg-white rounded-lg p-3 border border-rose-100">
                                <span className="text-sm font-bold text-slate-700 flex-1 min-w-[200px]">
                                    {t.player1_name} ({t.player1_score}ن · {formatTime(t.player1_time_seconds)})
                                    {' vs '}
                                    {t.player2_name} ({t.player2_score}ن · {formatTime(t.player2_time_seconds)})
                                </span>
                                <button onClick={() => pickKnockoutWinner(comp.id, t.match_id, t.player1_id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                                    فوز {t.player1_name}
                                </button>
                                <button onClick={() => pickKnockoutWinner(comp.id, t.match_id, t.player2_id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                                    فوز {t.player2_name}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {(comp.matches || []).length > 0 && (
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 mb-2">المباريات</h4>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                            {sortTeacherMatches(comp.matches).map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => openMatchDetail(comp, m)}
                                    className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm w-full text-right cursor-pointer hover:ring-2 hover:ring-indigo-200 transition ${m.status === 'tie_pending' ? 'bg-rose-50 border border-rose-200' : m.status === 'partial' ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}
                                >
                                    <span>
                                        {m.stage === 'knockout' && <span className="text-xs text-amber-600 ml-1">كأس R{m.knockout_round}</span>}
                                        {m.player1_name} vs {m.player2_name}
                                    </span>
                                    <span className="font-bold text-slate-500">
                                        {m.status === 'completed'
                                            ? `${m.player1_score} - ${m.player2_score}${m.is_draw ? ' (تعادل)' : ''}`
                                            : m.status === 'tie_pending' ? 'تعادل — اختر الفائز'
                                            : m.status === 'partial' ? 'جاري...' : m.status === 'bye' ? 'إعفاء' : 'لم تبدأ'}
                                    </span>
                                </button>
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
                        بعد اختيار الطلاب، أضف أسئلة كل جولة على حدة (نسخ من امتحان أو يدوي) ثم فعّل الجولة.
                    </p>

                    <div>
                        <label className="font-bold text-sm flex items-center gap-2 mb-2">
                            <Users size={16} /> اختيار الطلاب
                        </label>

                        <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 overflow-hidden">
                            <div className="p-3 border-b border-slate-200 bg-white">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    <input
                                        type="text"
                                        placeholder="بحث بالاسم أو البريد..."
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                                    <p className="text-xs text-slate-500">
                                        {studentSearch.trim()
                                            ? `${filteredStudents.length} نتيجة · ${filteredSelectedCount} محدد`
                                            : `${enrolledCount} طالب · ${form.student_ids.length} محدد`}
                                    </p>
                                    {filteredStudents.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => toggleAllFiltered(!allFilteredSelected)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50"
                                        >
                                            {allFilteredSelected ? 'إلغاء تحديد المعروض' : 'تحديد كل المعروض'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto bg-white">
                                {filteredStudents.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-8 px-4">
                                        {enrolledCount === 0
                                            ? 'لا يوجد طلاب مشتركين في الكورس'
                                            : 'لا توجد نتائج مطابقة للبحث'}
                                    </p>
                                ) : (
                                    filteredStudents.map(s => {
                                        const selected = form.student_ids.includes(s.id);
                                        return (
                                            <label
                                                key={s.id}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                                                    selected ? 'bg-indigo-50 hover:bg-indigo-100/80' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleStudent(s.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                                                    {s.email && (
                                                        <p className="text-xs text-slate-400 truncate mt-0.5">{s.email}</p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                                محدد: <span className="font-bold text-indigo-600">{form.student_ids.length}</span> من {enrolledCount} طالب
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold text-sm mb-2 block">عدد أسئلة كل جولة</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={form.questions_per_round}
                                onChange={e => setForm(f => ({ ...f, questions_per_round: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-sm mb-2 block">الوقت الأقصى (دقيقة) — يُسلّم تلقائياً عند انتهائه</label>
                            <input
                                type="number"
                                min={1}
                                max={180}
                                value={form.time_limit_minutes}
                                onChange={e => setForm(f => ({ ...f, time_limit_minutes: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
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
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-extrabold">أسئلة الجولة (لا تؤثر على الامتحان الأصلي)</h3>
                            <button onClick={() => { setEditQuestions(null); setEditRoundId(null); }}><X size={20} /></button>
                        </div>
                        <div className="p-4 border-b bg-slate-50 space-y-2">
                            <p className="text-xs font-bold text-slate-600">نسخ من امتحان لهذه الجولة فقط:</p>
                            <div className="grid md:grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                                {(availableExams.course_exams || []).map(ex => (
                                    <label key={ex.id} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={copyExamForm.lesson.includes(ex.id)} onChange={() => setCopyExamForm(f => ({ ...f, lesson: f.lesson.includes(ex.id) ? f.lesson.filter(x => x !== ex.id) : [...f.lesson, ex.id] }))} />
                                        {ex.title}
                                    </label>
                                ))}
                                {(availableExams.standalone_exams || []).map(ex => (
                                    <label key={ex.id} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={copyExamForm.standalone.includes(ex.id)} onChange={() => setCopyExamForm(f => ({ ...f, standalone: f.standalone.includes(ex.id) ? f.standalone.filter(x => x !== ex.id) : [...f.standalone, ex.id] }))} />
                                        {ex.title} (مستقل)
                                    </label>
                                ))}
                            </div>
                            <button onClick={() => copyExamToRound(competitions[activeType])} className="text-xs font-bold text-indigo-600">نسخ المحدد للجولة</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-5">
                            {editQuestions.map((q, qi) => (
                                <div key={qi} className="border-2 border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                                    <div className="flex items-start gap-3">
                                        <span className="shrink-0 w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">
                                            {qi + 1}
                                        </span>
                                        <textarea
                                            className="flex-1 min-h-[72px] w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                            value={q.text}
                                            onChange={e => updateQuestionField(qi, 'text', e.target.value)}
                                            placeholder="نص السؤال..."
                                            rows={2}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => deleteQuestion(qi)}
                                            className="shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            title="حذف السؤال"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="pr-11 space-y-3">
                                        <p className="text-xs font-bold text-slate-500">الاختيارات — حدّد الإجابة الصحيحة</p>
                                        {(q.options || []).map((o, oi) => (
                                            <div
                                                key={oi}
                                                className={`flex items-start gap-3 p-3 rounded-xl border-2 bg-white transition-colors ${
                                                    o.is_correct ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200'
                                                }`}
                                            >
                                                <label className="flex items-center gap-2 shrink-0 pt-2 cursor-pointer" title="الإجابة الصحيحة">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qi}`}
                                                        checked={!!o.is_correct}
                                                        onChange={() => updateOption(qi, oi, 'is_correct', true)}
                                                        className="w-4 h-4 text-emerald-600"
                                                    />
                                                    <span className={`text-xs font-bold whitespace-nowrap ${o.is_correct ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                        {o.is_correct ? '✓ صح' : 'اختيار'}
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="flex-1 min-w-0 w-full min-h-[44px] border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={o.text ?? ''}
                                                    onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                                                    placeholder={`نص الاختيار ${oi + 1}...`}
                                                    rows={2}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => deleteOption(qi, oi)}
                                                    disabled={(q.options || []).length <= 2}
                                                    className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="حذف الاختيار"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addOption(qi)}
                                            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1"
                                        >
                                            <Plus size={16} /> إضافة اختيار
                                        </button>
                                    </div>
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
            {matchDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-800">تفاصيل المباراة</h3>
                                {matchDetail.data?.match?.stage === 'knockout' && (
                                    <p className="text-xs text-amber-600 font-bold">كأس · جولة {matchDetail.data.match.knockout_round}</p>
                                )}
                            </div>
                            <button onClick={() => { setMatchDetail(null); setAnswersView(null); }} className="text-slate-400 hover:text-slate-600 font-bold px-2">✕</button>
                        </div>

                        {answersView ? (
                            <div className="space-y-4">
                                <button onClick={() => setAnswersView(null)} className="text-sm font-bold text-indigo-600">← رجوع للمباراة</button>
                                <h4 className="font-bold text-slate-700">إجابات {answersView.playerName}</h4>
                                {answersView.rounds.length === 0 ? (
                                    <p className="text-sm text-slate-500">لا توجد إجابات مسجّلة</p>
                                ) : answersView.rounds.map(r => (
                                    <div key={r.round_number} className="border border-slate-200 rounded-xl p-4 space-y-3">
                                        <p className="font-bold text-sm text-indigo-600">الجولة {r.round_number} — {r.submission.score}/{r.submission.total_mark} · {formatTime(r.submission.time_taken_seconds)}</p>
                                        {(r.submission.answers || []).map((a, i) => (
                                            <div key={i} className={`p-3 rounded-lg text-sm ${a.is_correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                                <p className="font-bold text-slate-800 mb-1">{i + 1}. {a.question_text}</p>
                                                <p className="text-slate-600">اختيار الطالب: <span className="font-bold">{a.selected_option_text || '—'}</span></p>
                                                <p className="text-slate-600">الإجابة الصحيحة: <span className="font-bold text-emerald-700">{a.correct_option_text || '—'}</span></p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="font-extrabold text-slate-800">{matchDetail.data?.match?.player1_name}</p>
                                        <p className="text-2xl font-black text-indigo-600 my-1">{matchDetail.data?.match?.player1_score ?? 0}</p>
                                        <p className="text-xs text-slate-500">{formatTime(matchDetail.data?.match?.player1_time_seconds)}</p>
                                        <button onClick={() => showPlayerAnswers('player1', matchDetail.data?.match?.player1_name)} className="mt-3 w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">
                                            عرض الإجابات
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="font-extrabold text-slate-800">{matchDetail.data?.match?.player2_name}</p>
                                        <p className="text-2xl font-black text-indigo-600 my-1">{matchDetail.data?.match?.player2_score ?? 0}</p>
                                        <p className="text-xs text-slate-500">{formatTime(matchDetail.data?.match?.player2_time_seconds)}</p>
                                        <button onClick={() => showPlayerAnswers('player2', matchDetail.data?.match?.player2_name)} className="mt-3 w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">
                                            عرض الإجابات
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 text-center">كل سؤال = درجة واحدة في المسابقات</p>
                            </>
                        )}
                    </div>
                </div>
            )}
            {tieModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
                        <h3 className="font-extrabold text-lg text-rose-800">اختيار الفائز — تعادل في خروج المغلوب</h3>
                        <p className="text-sm text-slate-600">تعادل اللاعبان في النقاط ووقت التسليم. اختر من يتأهل قبل بدء الجولة التالية.</p>
                        {tieModal.ties.map(t => (
                            <div key={t.match_id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-bold text-center text-slate-700">
                                    {t.player1_name} ({t.player1_score}ن · {formatTime(t.player1_time_seconds)})
                                    <span className="text-slate-400 mx-2">vs</span>
                                    {t.player2_name} ({t.player2_score}ن · {formatTime(t.player2_time_seconds)})
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => pickKnockoutWinner(tieModal.compId, t.match_id, t.player1_id)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">
                                        {t.player1_name}
                                    </button>
                                    <button onClick={() => pickKnockoutWinner(tieModal.compId, t.match_id, t.player2_id)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">
                                        {t.player2_name}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setTieModal(null)} className="w-full py-2 rounded-xl border font-bold text-slate-600">إغلاق</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCompetitionPanel;
