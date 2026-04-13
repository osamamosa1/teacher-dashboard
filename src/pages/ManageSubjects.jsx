import { useState, useEffect } from 'react';
import api from '../api/axios';
import { BookOpen, Plus, Trash2, X, Loader2, Tag } from 'lucide-react';

const ManageSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '' });

    useEffect(() => { fetchSubjects(); }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/subjects', newSubject);
            fetchSubjects();
            setModalOpen(false);
            setNewSubject({ name: '' });
        } catch (err) {
            alert('Error creating subject.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await api.delete(`/admin/subjects/${id}`);
            fetchSubjects();
        } catch (err) {
            alert('Error deleting subject.');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Subject Management</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Define and manage academic subject areas.</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={18} /> Add Subject
                </button>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
                        <p className="text-[#64748B] font-medium">Loading subjects...</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <BookOpen className="text-indigo-600 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">No Subjects Found</h3>
                        <p className="text-[#64748B]">Add a subject to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                        {subjects.map(s => (
                            <div key={s.id} className="group relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Tag className="text-indigo-600" size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#0F172A] truncate">{s.name}</p>
                                    <p className="text-xs text-[#94A3B8] font-medium mt-0.5">ID #{s.id}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Subject Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-xl p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-[#F1F5F9] pb-5">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">Add Subject</h2>
                                <p className="text-sm text-[#64748B] mt-1">Create a new academic subject.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Subject Name</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. Mathematics, Biology..."
                                        value={newSubject.name}
                                        onChange={e => setNewSubject({ name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                                    Cancel
                                </button>
                                <button disabled={saving} className="flex-1 bg-indigo-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={18}/> Add Subject</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubjects;
