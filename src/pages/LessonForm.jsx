import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
    ChevronLeft, Loader2, PlayCircle, Video, FileText,
    CheckCircle, HelpCircle, Award, Clock, Save,
    X, ArrowRight, Settings, Info, Plus, Trash2, ChevronRight
} from 'lucide-react';

const LessonForm = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const isEdit = !!lessonId;
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [newLesson, setNewLesson] = useState({
        title: '',
        type: 'video',
        content: '',
        extra: '',
        is_free: false,
        is_required: true,
        video: { description: '', embed_url: '', thumbnail_url: '', duration: '', source_type: 'youtube' },
        exam: { description: '', duration: 60, total_mark: 100, passing_grade: 50, start_date: '', end_date: '', questions: [] },
        assignment: { description: '', due_date: '', points: 100 },
        unit_id: ''
    });
    const [units, setUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    useEffect(() => {
        fetchUnits();
        if (isEdit) {
            fetchLesson();
        }
    }, [isEdit, lessonId, courseId]);

    const fetchUnits = async () => {
        setUnitsLoading(true);
        try {
            const res = await api.get(`/teacher/courses/${courseId}/units`);
            setUnits(res.data.data || []);
        } catch (err) {
            console.error('Error fetching units', err);
        } finally {
            setUnitsLoading(false);
        }
    };

    const fetchLesson = async () => {
        try {
            const res = await api.get(`/teacher/lessons/${lessonId}`);
            const lesson = res.data.data;
            setNewLesson({
                ...newLesson,
                title: lesson.title,
                type: lesson.type,
                content: lesson.content,
                extra: lesson.extra || '',
                is_free: lesson.is_free,
                is_required: lesson.is_required,
                unit_id: lesson.unit_id || '',
                video: lesson.video || newLesson.video,
                exam: lesson.exam || newLesson.exam,
                assignment: lesson.assignment || newLesson.assignment
            });
        } catch (err) {
            console.error(err);
            alert('Could not retrieve module meta-data');
            navigate(`/teacher/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Security Error: Only PDF files are allowed for students.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setSaving(true);
        try {
            // Health check to new dedicated controller
            const ping = await api.get('/uploads/ping');
            console.log('Upload Health Check:', ping.data);

            const res = await api.post('/uploads/pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('PDF Uploaded Successfully:', res.data.url);
            setNewLesson({ ...newLesson, extra: res.data.url });
        } catch (err) {
            console.error('PDF Upload Failed!', {
                error: err,
                response: err.response?.data,
                status: err.response?.status
            });
            alert(`Failed to upload PDF: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { 
                ...newLesson, 
                course_id: parseInt(courseId, 10),
                unit_id: newLesson.unit_id ? parseInt(newLesson.unit_id) : null
            };
            if (isEdit) {
                await api.put(`/teacher/lessons/${lessonId}`, payload);
            } else {
                await api.post('/teacher/lessons', payload);
            }
            navigate(`/teacher/courses/${courseId}`);
        } catch (err) {
            console.error('Save lesson error:', err);
            let msg = 'Failed to save lesson.';
            let details = '';

            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    // Handle HTML error pages from IIS/ASP.NET
                    details = err.response.data.substring(0, 200);
                } else {
                    msg = err.response.data.message || msg;
                    details = err.response.data.inner || '';
                }
            }
            alert(`${msg}${details ? `\nDetails: ${details}` : ''}`);
        } finally {
            setSaving(false);
        }
    };

    const addQuestion = () => {
        const updatedExam = { ...newLesson.exam };
        updatedExam.questions.push({ text: '', type: 'mcq', degree: 5, options: [{ text: '' }, { text: '' }] });
        setNewLesson({ ...newLesson, exam: updatedExam });
    };

    const updateQuestion = (index, field, value) => {
        const updatedExam = { ...newLesson.exam };
        updatedExam.questions[index][field] = value;
        setNewLesson({ ...newLesson, exam: updatedExam });
    };

    const addOption = (qIndex) => {
        const updatedExam = { ...newLesson.exam };
        updatedExam.questions[qIndex].options.push({ text: '', is_correct: false });
        setNewLesson({ ...newLesson, exam: updatedExam });
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const updatedExam = { ...newLesson.exam };
        if (field === 'is_correct' || field === 'isCorrect') {
            // Uncheck others for this question
            updatedExam.questions[qIndex].options = updatedExam.questions[qIndex].options.map((opt, i) => ({
                ...opt,
                is_correct: i === oIndex ? value : false
            }));
        } else {
            updatedExam.questions[qIndex].options[oIndex][field] = value;
        }
        setNewLesson({ ...newLesson, exam: updatedExam });
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm font-medium text-[#64748B] mb-6">
                <Link to="/teacher" className="hover:text-[#0F172A] transition-colors">Dashboard</Link>
                <ChevronRight size={16} className="mx-2" />
                <Link to="/teacher/courses" className="hover:text-[#0F172A] transition-colors">Courses</Link>
                <ChevronRight size={16} className="mx-2" />
                <Link to={`/teacher/courses/${courseId}`} className="hover:text-[#0F172A] transition-colors">Curriculum</Link>
                <ChevronRight size={16} className="mx-2" />
                <span className="text-[#0F172A] font-bold">{isEdit ? 'Edit Lesson' : 'New Lesson'}</span>
            </div>

            <div className="bg-white w-full rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="p-8 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]/50">
                    <div>
                        <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">{isEdit ? 'Edit Lesson Module' : 'Create Lesson Module'}</h2>
                        <p className="text-[#64748B] text-sm font-medium mt-1">Configure lesson content and properties below.</p>
                    </div>
                </div>

                <form onSubmit={handleSaveLesson} className="p-10 space-y-12">
                    {/* Section 1: Basic Info */}
                    <div className="space-y-8">
                        <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-4">1. Basic Information</h3>

                        <div className="grid grid-cols-3 gap-10 items-start">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#0F172A]">Lesson Title</h4>
                                <p className="text-xs text-[#64748B] leading-relaxed">A clear and descriptive title.</p>
                            </div>
                            <div className="col-span-2">
                                <input className="input-field" placeholder="E.g., Introduction to Neural Networks" value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-10 items-start">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#0F172A]">Content Type</h4>
                                <p className="text-xs text-[#64748B] leading-relaxed">Select the primary format of this lesson.</p>
                            </div>
                            <div className="col-span-2">
                                <select className="input-field" value={newLesson.type} onChange={e => setNewLesson({ ...newLesson, type: e.target.value })}>
                                    <option value="video">Video Lecture</option>
                                    <option value="exam">Quiz / Examination</option>
                                    <option value="assignment">Assignment / Project</option>
                                    <option value="text">Document / Text</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-10 items-start">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#0F172A]">Target Unit</h4>
                                <p className="text-xs text-[#64748B] leading-relaxed">Select which section this lesson belongs to.</p>
                            </div>
                            <div className="col-span-2">
                                <select 
                                    className="input-field" 
                                    value={newLesson.unit_id} 
                                    onChange={e => setNewLesson({ ...newLesson, unit_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a Unit</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.title}</option>
                                    ))}
                                </select>
                                {units.length === 0 && !unitsLoading && (
                                    <p className="text-[10px] text-amber-600 font-bold mt-2">
                                        No units found. Please create a unit in the course dashboard first.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-10 items-start">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#0F172A]">Lesson Properties</h4>
                                <p className="text-xs text-[#64748B] leading-relaxed">Configure access and requirements.</p>
                            </div>
                            <div className="col-span-2 flex gap-4">
                                <label className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${newLesson.is_free ? 'border-indigo-600 bg-indigo-50/50' : 'border-[#E2E8F0] hover:border-indigo-300'}`}>
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" checked={newLesson.is_free} onChange={() => setNewLesson({ ...newLesson, is_free: !newLesson.is_free })} />
                                    <div>
                                        <p className="font-bold text-sm text-[#0F172A]">Free Preview</p>
                                        <p className="text-xs text-[#64748B]">Available without enrollment</p>
                                    </div>
                                </label>

                                <label className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${newLesson.is_required ? 'border-emerald-500 bg-emerald-50/50' : 'border-[#E2E8F0] hover:border-emerald-300'}`}>
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer" checked={newLesson.is_required} onChange={() => setNewLesson({ ...newLesson, is_required: !newLesson.is_required })} />
                                    <div>
                                        <p className="font-bold text-sm text-[#0F172A]">Mandatory</p>
                                        <p className="text-xs text-[#64748B]">Required to complete course</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Specific Payload */}
                    <div className="space-y-8 pt-6">
                        <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-4">2. Module Content</h3>

                        {newLesson.type === 'video' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Video URL</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Embed link to the video asset.</p>
                                    </div>
                                    <div className="col-span-2">
                                        <input className="input-field font-mono text-sm" placeholder="https://youtube.com/embed/..." value={newLesson.content} onChange={e => setNewLesson({ ...newLesson, content: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Metadata</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Duration and hosting platform.</p>
                                    </div>
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[#64748B] mb-1.5 block">Duration</label>
                                            <input className="input-field" placeholder="45:00" value={newLesson.video.duration} onChange={e => setNewLesson({ ...newLesson, video: { ...newLesson.video, duration: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[#64748B] mb-1.5 block">Platform</label>
                                            <select className="input-field" value={newLesson.video.source_type} onChange={e => setNewLesson({ ...newLesson, video: { ...newLesson.video, source_type: e.target.value } })}>
                                                <option value="youtube">YouTube</option>
                                                <option value="vimeo">Vimeo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {newLesson.type === 'text' && (
                            <div className="grid grid-cols-3 gap-10 items-start animate-in fade-in slide-in-from-bottom-2">
                                <div className="col-span-2 space-y-4">
                                    <textarea className="input-field h-48 resize-none py-3" placeholder="Enter text content here..." value={newLesson.content} onChange={e => setNewLesson({ ...newLesson, content: e.target.value })}></textarea>
                                    
                                    <div className="pt-4 border-t border-[#F1F5F9]">
                                        <h4 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2"><FileText size={16} className="text-indigo-600"/> Attach PDF (Optional)</h4>
                                        <div className="flex gap-3 items-center">
                                            <label className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold text-xs transition-colors">
                                                <Plus size={14} /> {newLesson.extra ? 'Change PDF' : 'Upload PDF'}
                                                <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                                            </label>
                                            {newLesson.extra && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                                                    <CheckCircle size={12} /> Document Attached
                                                    <button type="button" onClick={() => setNewLesson({...newLesson, extra: ''})} className="text-red-500 hover:text-red-700 ml-1"><X size={12}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {newLesson.type === 'assignment' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Instructions</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Clear steps for the assignment.</p>
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <textarea className="input-field h-32 resize-none py-3" placeholder="Explain the assignment..." value={newLesson.assignment.description} onChange={e => setNewLesson({ ...newLesson, assignment: { ...newLesson.assignment, description: e.target.value } })}></textarea>
                                        
                                        <div className="pt-4 border-t border-[#F1F5F9]">
                                            <h4 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2"><FileText size={16} className="text-indigo-600"/> Resource PDF (Optional)</h4>
                                            <div className="flex gap-3 items-center">
                                                <label className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold text-xs transition-colors">
                                                    <Plus size={14} /> {newLesson.extra ? 'Change PDF' : 'Upload PDF'}
                                                    <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                                                </label>
                                                {newLesson.extra && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                                                        <CheckCircle size={12} /> Resource Attached
                                                        <button type="button" onClick={() => setNewLesson({...newLesson, extra: ''})} className="text-red-500 hover:text-red-700 ml-1"><X size={12}/></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Points / Grade</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Maximum points achievable.</p>
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" className="input-field" placeholder="100" value={newLesson.assignment.points} onChange={e => setNewLesson({ ...newLesson, assignment: { ...newLesson.assignment, points: parseInt(e.target.value) || 0 } })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {newLesson.type === 'exam' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Exam Settings</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Configure grading and time limits.</p>
                                    </div>
                                    <div className="col-span-2 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[#64748B] mb-1.5 block">Time Limit (mins)</label>
                                            <input type="number" className="input-field text-lg font-bold" value={newLesson.exam.duration} onChange={e => setNewLesson({ ...newLesson, exam: { ...newLesson.exam, duration: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[#64748B] mb-1.5 block">Total Points</label>
                                            <input type="number" className="input-field text-lg font-bold" value={newLesson.exam.total_mark} onChange={e => setNewLesson({ ...newLesson, exam: { ...newLesson.exam, total_mark: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[#64748B] mb-1.5 block">Passing Grade %</label>
                                            <input type="number" className="input-field text-lg font-bold text-indigo-600" value={newLesson.exam.passing_grade} onChange={e => setNewLesson({ ...newLesson, exam: { ...newLesson.exam, passing_grade: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-10 items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-[#0F172A]">Question Bank</h4>
                                        <p className="text-xs text-[#64748B] leading-relaxed">Add and manage questions for this exam.</p>
                                        <button type="button" onClick={addQuestion} className="w-full mt-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                            <Plus size={16} /> Add Question
                                        </button>
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        {newLesson.exam.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 relative group overflow-hidden shadow-sm hover:border-indigo-200 transition-colors">
                                                <button type="button" onClick={() => {
                                                    const updatedExam = { ...newLesson.exam };
                                                    updatedExam.questions.splice(qIdx, 1);
                                                    setNewLesson({ ...newLesson, exam: updatedExam });
                                                }} className="absolute top-4 right-4 text-[#94A3B8] hover:text-red-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>

                                                <div className="flex items-center gap-3 mb-4 pr-10">
                                                    <span className="bg-indigo-100 text-indigo-700 w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm">Q{qIdx + 1}</span>
                                                    <input className="input-field flex-1" placeholder="Enter question..." value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
                                                    <input type="number" className="input-field w-20 text-center" placeholder="Pts" value={q.degree} onChange={e => updateQuestion(qIdx, 'degree', parseInt(e.target.value) || 0)} />
                                                </div>

                                                <div className="pl-10 space-y-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex gap-2 items-center">
                                                            <input 
                                                                type="checkbox" 
                                                                className="w-5 h-5 rounded border-[#E2E8F0] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                checked={opt.is_correct}
                                                                onChange={e => updateOption(qIdx, oIdx, 'is_correct', e.target.checked)}
                                                            />
                                                            <input 
                                                                className={`input-field h-10 text-sm py-1 ${opt.is_correct ? 'border-2 border-green-500 bg-green-50' : ''}`} 
                                                                placeholder={`Option ${oIdx + 1}`} 
                                                                value={opt.text} 
                                                                onChange={e => updateOption(qIdx, oIdx, 'text', e.target.value)} 
                                                            />
                                                            {opt.is_correct && <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Correct</span>}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => addOption(qIdx)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                                                        <Plus size={12} /> Add Option
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 flex justify-end gap-4 border-t border-[#F1F5F9]">
                        <button type="button" onClick={() => navigate(`/teacher/courses/${courseId}`)} className="btn-secondary px-8">Discard</button>
                        <button type="submit" disabled={saving} className="bg-indigo-900 text-white px-10 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : (isEdit ? 'Save Changes' : 'Create Lesson')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LessonForm;
