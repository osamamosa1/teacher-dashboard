import { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserPlus, Trash2, X, Loader2, Users, Edit, Search, Check, ShieldAlert } from 'lucide-react';

const emptyAssistant = {
    name: '',
    email: '',
    phone: '',
    password: '',
    allowed_course_ids: []
};

const ManageAssistants = () => {
    const [assistants, setAssistants] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAssistant, setEditingAssistant] = useState(null);
    const [formData, setFormData] = useState(emptyAssistant);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [aRes, cRes] = await Promise.all([
                api.get('/teacher/assistants'),
                api.get('/teacher/courses')
            ]);
            setAssistants(aRes.data.data || []);
            setCourses(cRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingAssistant(null);
        setFormData(emptyAssistant);
        setModalOpen(true);
    };

    const openEditModal = (assistant) => {
        // Parse course IDs from string "1,2,3" into array [1,2,3]
        const allowedCourseIds = assistant.allowed_course_ids 
            ? assistant.allowed_course_ids.split(',').map(id => parseInt(id)).filter(Boolean)
            : [];
            
        setEditingAssistant(assistant);
        setFormData({
            name: assistant.name || '',
            email: assistant.email || '',
            phone: assistant.phone || '',
            password: '',
            allowed_course_ids: allowedCourseIds
        });
        setModalOpen(true);
    };

    const toggleCourseSelection = (courseId) => {
        setFormData(prev => {
            const current = prev.allowed_course_ids;
            const updated = current.includes(courseId)
                ? current.filter(id => id !== courseId)
                : [...current, courseId];
            return { ...prev, allowed_course_ids: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                allowed_course_ids: formData.allowed_course_ids
            };

            if (editingAssistant) {
                if (!payload.password) delete payload.password;
                await api.put(`/teacher/assistants/${editingAssistant.id}`, payload);
            } else {
                await api.post('/teacher/assistants', payload);
            }
            fetchData();
            setModalOpen(false);
            setFormData(emptyAssistant);
            setEditingAssistant(null);
        } catch (err) {
            alert(err.response?.data?.message || (editingAssistant ? 'Error updating assistant' : 'Error creating assistant'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAssistant = async (id, name) => {
        if (!window.confirm(`Delete assistant "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/teacher/assistants/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete assistant.');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Manage Assistants</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Manage assistant accounts and configure their courses access.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={openCreateModal} className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <UserPlus size={18} /> Register Assistant
                    </button>
                </div>
            </div>

            <div className="bg-white w-full rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
                        <p className="text-[#64748B] font-medium">Loading assistants...</p>
                    </div>
                ) : assistants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <Users className="text-indigo-600 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">No Assistants Found</h3>
                        <p className="text-[#64748B]">Get started by registering a new assistant account.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Assistant Name</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Phone / Email</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Allowed Courses</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {assistants.map(a => {
                                    const allowedIds = a.allowed_course_ids 
                                        ? a.allowed_course_ids.split(',').map(id => parseInt(id)).filter(Boolean)
                                        : [];
                                    const allowedTitles = courses
                                        .filter(c => allowedIds.includes(c.id))
                                        .map(c => c.title)
                                        .join(', ');

                                    return (
                                        <tr key={a.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {a.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#0F172A] block">{a.name}</span>
                                                        <span className="text-xs text-[#94A3B8] font-medium">Assistant ID: #{a.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <span className="text-sm text-[#475569] font-semibold block">{a.phone}</span>
                                                <span className="text-xs text-[#94A3B8] font-medium block">{a.email}</span>
                                            </td>
                                            <td className="py-5 px-8">
                                                {allowedIds.length === 0 ? (
                                                    <span className="text-xs text-red-500 font-bold bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                                        <ShieldAlert size={12} />
                                                        No courses allowed
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg truncate max-w-[280px] block" title={allowedTitles}>
                                                        {allowedIds.length} Course(s): {allowedTitles}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(a)}
                                                        className="p-2 text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Assistant"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteAssistant(a.id, a.name)} 
                                                        className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                        title="Delete Assistant"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">
                                    {editingAssistant ? 'Edit Assistant' : 'Register Assistant'}
                                </h2>
                                <p className="text-sm text-[#64748B] mt-1">
                                    {editingAssistant ? 'Update assistant credentials and access.' : 'Create a new assistant profile.'}
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                <input className="input-field" placeholder="Assistant's full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                    <input className="input-field" placeholder="example@academy.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Phone Number</label>
                                    <input className="input-field" placeholder="012XXXXXXXX" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Password {editingAssistant && <span className="text-[#94A3B8] font-normal">(leave blank to keep)</span>}</label>
                                <input className="input-field" placeholder="••••••••" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingAssistant} />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-3 block">Configure Course Access</label>
                                <div className="border border-[#E2E8F0] rounded-2xl max-h-[180px] overflow-y-auto p-4 space-y-2.5 bg-[#F8FAFC]">
                                    {courses.length === 0 ? (
                                        <p className="text-xs text-[#94A3B8] font-semibold text-center py-4">No courses available for access selection.</p>
                                    ) : (
                                        courses.map(c => {
                                            const isSelected = formData.allowed_course_ids.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleCourseSelection(c.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                                        isSelected 
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                                                            : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="text-xs">{c.title}</span>
                                                    {isSelected && <Check size={14} className="text-indigo-600" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#F1F5F9] mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                                    Cancel
                                </button>
                                <button disabled={saving} className="bg-indigo-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : (editingAssistant ? 'Save Changes' : 'Confirm Registration')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAssistants;
