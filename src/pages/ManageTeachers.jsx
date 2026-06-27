import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus, Trash2, X, Loader2, Users, Edit, Eye } from 'lucide-react';

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
            alert('Failed to open teacher dashboard.');
        } finally {
            setImpersonatingId(null);
        }
    };

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
                                            <div className="flex justify-end gap-2">
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
        </div>
    );
};

export default ManageTeachers;
