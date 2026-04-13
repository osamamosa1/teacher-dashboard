import { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Mail, Phone, MapPin, Calendar, FileText, Loader2, Save, Camera } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/user/profile');
            setProfile(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const res = await api.put('/auth/user/profile', profile);
            setProfile(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data)); // Update local storage
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Error updating profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            <p className="text-[#64748B] font-medium">Loading your profile...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">Account Settings</h1>
                <p className="text-[#64748B] text-lg font-medium mt-1">Manage your personal information and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] p-8 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <img 
                                src={profile.profile_image_url || `https://ui-avatars.com/api/?name=${profile.name}&background=6366f1&color=fff&size=128`} 
                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg shadow-indigo-100"
                                alt={profile.name}
                            />
                            <button className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all border-4 border-white">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-[#0F172A]">{profile.name}</h2>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">{profile.role}</p>
                        
                        <div className="mt-8 pt-8 border-t border-[#F1F5F9] space-y-4 text-left">
                            <div className="flex items-center gap-3 text-[#64748B]">
                                <Mail size={16} />
                                <span className="text-sm font-medium">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#64748B]">
                                <Phone size={16} />
                                <span className="text-sm font-medium">{profile.phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] p-8">
                        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-widest mb-6 border-b border-[#F1F5F9] pb-4">Subscription</h3>
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Current Plan</p>
                            <p className="text-lg font-black text-indigo-900">{profile.subscription_type || 'Premium'}</p>
                        </div>
                    </div>
                </div>

                {/* Right: Edit Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleUpdate} className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                        <div className="p-8 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]/50">
                            <h3 className="text-xl font-bold text-[#0F172A]">Edit Personal Information</h3>
                            {message && <span className="text-emerald-600 text-sm font-bold animate-fade">{message}</span>}
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                                    <input 
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={profile.name}
                                        onChange={e => setProfile({...profile, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Phone Number</label>
                                    <input 
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={profile.phone}
                                        onChange={e => setProfile({...profile, phone: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                                <input 
                                    type="email"
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={profile.email}
                                    onChange={e => setProfile({...profile, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Date of Birth</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={profile.date_of_birth}
                                        onChange={e => setProfile({...profile, date_of_birth: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Location / Address</label>
                                    <input 
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="City, Country"
                                        value={profile.address}
                                        onChange={e => setProfile({...profile, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#0F172A] mb-1.5 block">Bio / Notes</label>
                                <textarea 
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Write a short bio..."
                                    rows="4"
                                    value={profile.notes}
                                    onChange={e => setProfile({...profile, notes: e.target.value})}
                                />
                            </div>

                            <div className="pt-6 border-t border-[#F1F5F9] flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-indigo-900 text-white h-12 px-8 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
