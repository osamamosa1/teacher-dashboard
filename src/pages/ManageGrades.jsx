import { useState, useEffect } from 'react';
import api from '../api/axios';
import { GraduationCap, Plus, Trash2, X, Loader2, Award } from 'lucide-react';

const ManageGrades = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newGrade, setNewGrade] = useState({ name: '' });
    const [editingGrade, setEditingGrade] = useState(null);

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teacher/grades');
            if (res.data && Array.isArray(res.data.data)) {
                setGrades(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching grades:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const name = editingGrade ? editingGrade.name : newGrade.name;
        
        try {
            if (editingGrade) {
                await api.put(`/teacher/grades/${editingGrade.id}`, { name });
            } else {
                await api.post('/teacher/grades', { name });
            }
            fetchGrades();
            setModalOpen(false);
            setNewGrade({ name: '' });
            setEditingGrade(null);
        } catch (err) {
            alert('Failed to save grade.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this grade?')) return;
        try {
            await api.delete(`/teacher/grades/${id}`);
            fetchGrades();
        } catch (err) {
            alert('Failed to delete grade.');
        }
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#F8FAFC]">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0F172A]">Grade Management</h1>
                    <p className="text-[#64748B] mt-1">Manage academic levels for your courses.</p>
                </div>
                <button 
                    onClick={() => { setEditingGrade(null); setNewGrade({name: ''}); setModalOpen(true); }}
                    className="bg-indigo-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={20} /> Add Grade
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-[#E2E8F0] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-indigo-600" size={40} />
                        <p className="text-[#64748B] font-medium">Loading academic levels...</p>
                    </div>
                ) : grades.length === 0 ? (
                    <div className="py-32 flex flex-col items-center gap-4 text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                            <GraduationCap className="text-indigo-600" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">No Grades Found</h3>
                        <p className="text-[#64748B]">Create your first academic grade to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                        {grades.map(g => (
                            <div key={g.id} className="group relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Award size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#0F172A] truncate text-lg">{g.name}</p>
                                        <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Level ID: {g.id}</p>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { setEditingGrade(g); setModalOpen(true); }}
                                        className="p-2 text-[#64748B] hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm"
                                    >
                                        <Award size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(g.id)}
                                        className="p-2 text-[#64748B] hover:text-red-600 hover:bg-white rounded-lg shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[500]">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#0F172A]">{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 bg-[#F1F5F9] rounded-full text-[#64748B]">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-2 block">Grade Name</label>
                                <input 
                                    className="w-full h-12 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-[#0F172A] transition-all"
                                    placeholder="e.g. Grade 10"
                                    value={editingGrade ? editingGrade.name : newGrade.name}
                                    onChange={e => editingGrade ? setEditingGrade({...editingGrade, name: e.target.value}) : setNewGrade({name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 font-bold text-[#64748B] border border-[#E2E8F0] rounded-xl">Cancel</button>
                                <button disabled={saving} className="flex-1 py-3 bg-indigo-900 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={18} /> {editingGrade ? 'Update' : 'Save'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageGrades;
