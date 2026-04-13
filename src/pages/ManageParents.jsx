import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Plus, UserPlus, Trash2, X, Phone, Mail, Loader2, MapPin, Calendar, FileText } from 'lucide-react';

const ManageParents = () => {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newParent, setNewParent] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: '',
        date_of_birth: '',
        parent_job: '',
        notes: ''
    });

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        try {
            const res = await api.get('/teacher/parents');
            setParents(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateParent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/teacher/parents', newParent);
            fetchParents();
            setModalOpen(false);
            setNewParent({ name: '', email: '', phone: '', password: '', address: '', date_of_birth: '', parent_job: '', notes: '' });
        } catch (err) {
            alert('Error creating parent.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteParent = async (id) => {
        if (!confirm('Are you sure you want to delete this parent account?')) return;
        try {
            await api.delete(`/teacher/parents/${id}`);
            fetchParents();
        } catch (err) {
            alert('Error deleting parent.');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Parent Administration</h1>
                    <p className="text-[#64748B] text-lg font-medium mt-1">Manage parent accounts and their connections.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="bg-indigo-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <UserPlus size={18} /> Register Parent
                </button>
            </div>

            <div className="bg-white w-full rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
                        <p className="text-[#64748B] font-medium">Loading parent records...</p>
                    </div>
                ) : parents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <Users className="text-indigo-600 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">No Parents Found</h3>
                        <p className="text-[#64748B]">Register a new parent to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Parent Profile</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Contact Info</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider">Address</th>
                                    <th className="py-5 px-8 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {parents.map(p => (
                                    <tr key={p.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#0F172A] block">{p.name}</span>
                                                    <span className="text-xs text-[#94A3B8] font-medium">#{p.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-[#475569]">
                                                    <Mail size={14} className="text-[#94A3B8]" /> {p.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#475569]">
                                                    <Phone size={14} className="text-[#94A3B8]" /> {p.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-sm text-[#64748B]">{p.address || '—'}</span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <button onClick={() => handleDeleteParent(p.id)} className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
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
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl shadow-slate-200/50 p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b border-[#F1F5F9] pb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A]">Register Parent</h2>
                                <p className="text-sm text-[#64748B] mt-1">Create a new parent account.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateParent} className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Full Name"
                                        value={newParent.name}
                                        onChange={e => setNewParent({ ...newParent, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                        <input
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="012XXXXXXXX"
                                            value={newParent.phone}
                                            onChange={e => setNewParent({ ...newParent, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                        <input
                                            type="email"
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="parent@example.com"
                                            value={newParent.email}
                                            onChange={e => setNewParent({ ...newParent, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        value={newParent.password}
                                        onChange={e => setNewParent({ ...newParent, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={newParent.date_of_birth}
                                        onChange={e => setNewParent({ ...newParent, date_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Physical Address"
                                        value={newParent.address}
                                        onChange={e => setNewParent({ ...newParent, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Job / Occupation</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                    <input
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 pl-12 pr-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Engineer, Teacher, etc."
                                        value={newParent.parent_job}
                                        onChange={e => setNewParent({ ...newParent, parent_job: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Notes</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-[#94A3B8]" size={18} />
                                    <textarea
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] pl-12 pr-4 py-3 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Additional Information"
                                        rows="2"
                                        value={newParent.notes}
                                        onChange={e => setNewParent({ ...newParent, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-indigo-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-70 mt-4"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Registration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageParents;
