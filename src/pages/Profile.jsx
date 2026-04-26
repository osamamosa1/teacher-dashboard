import { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Mail, Phone, MapPin, Calendar, FileText, Loader2, Save, Camera, LogOut, Settings as SettingsIcon, Globe, Facebook, Youtube, MessageCircle, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingBranding, setUpdatingBranding] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchInitData();
    }, []);

    const fetchInitData = async () => {
        try {
            const [profileRes, settingsRes] = await Promise.all([
                api.get('/user/profile'),
                api.get('/settings/1')
            ]);
            const profileData = profileRes.data?.data?.user || profileRes.data?.data;
            if (profileData && typeof profileData === 'object') {
                setProfile(profileData);
            }
            if (settingsRes.data?.data) {
                setSettings(settingsRes.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const res = await api.put('/user/profile', profile);
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

    const handleBrandingUpdate = async (e) => {
        e.preventDefault();
        setUpdatingBranding(true);
        try {
            await api.post('/settings', settings);
            alert('Branding updated successfully! Refresh to see changes.');
        } catch (err) {
            alert('Error updating branding settings.');
        } finally {
            setUpdatingBranding(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            <p className="text-[#64748B] font-medium">Loading your profile...</p>
        </div>
    );


    if (!profile) return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">Failed to load profile</h2>
            <button onClick={fetchInitData} className="btn btn-primary">Try Again</button>
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

                        <button 
                            onClick={handleLogout}
                            className="w-full mt-6 flex items-center justify-center gap-2 py-3 border border-red-100 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={16} /> Log Out
                        </button>
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

                    {/* Branding Settings (Visible to all) */}
                    {settings && (
                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-5">
                            <form onSubmit={handleBrandingUpdate} className="bg-white rounded-[32px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                                <div className="p-8 border-b border-[#F1F5F9] flex items-center gap-3 bg-indigo-50/30">
                                    <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                        <Globe className="text-indigo-600" size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F172A]">Platform Branding</h3>
                                </div>
                                
                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                             <div className="space-y-2">
                                                 <label className="text-sm font-bold text-[#0F172A] block">Platform Logo URL</label>
                                                 <div className="flex gap-2">
                                                     <input 
                                                         className="flex-1 bg-[#f8fafc] border border-slate-200 h-12 pl-4 pr-4 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" 
                                                         placeholder="Logo URL" 
                                                         value={settings.logo_url} 
                                                         onChange={e => setSettings({ ...settings, logo_url: e.target.value })} 
                                                     />
                                                     <label className="h-12 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors font-bold text-xs shrink-0">
                                                         <Image size={16} /> 
                                                         Upload
                                                         <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                             const file = e.target.files[0];
                                                             if (!file) return;
                                                             const formData = new FormData();
                                                             formData.append('file', file);
                                                             try {
                                                                 const res = await api.post('/uploads/image', formData);
                                                                 setSettings({ ...settings, logo_url: res.data.url });
                                                             } catch (err) {
                                                                 alert('Upload failed');
                                                             }
                                                         }} />
                                                     </label>
                                                 </div>
                                             </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-[#0F172A] block">Platform Display Name</label>
                                                <input 
                                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-12 px-4 rounded-xl text-sm font-semibold text-[#0F172A] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                    value={settings.app_name}
                                                    onChange={e => setSettings({...settings, app_name: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-[#F8FAFC] rounded-24 border border-dashed border-[#CBD5E1] p-6 flex flex-col items-center justify-center text-center">
                                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4">Logo Preview</p>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0]">
                                                <img 
                                                    src={settings.logo_url} 
                                                    className="max-h-20 max-w-[200px] object-contain" 
                                                    alt="Logo Preview"
                                                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=LOGO+ERROR&background=ef4444&color=fff'; }}
                                                />
                                            </div>
                                            <p className="mt-4 text-[11px] text-[#64748B] leading-relaxed">
                                                Recommended: Transparent PNG, 400x120px
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact Info Section */}
                                    <div className="pt-8 border-t border-[#F1F5F9] space-y-6">
                                        <h4 className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                                                    <Facebook size={14} className="text-[#1877F2]" /> Facebook URL
                                                </label>
                                                <input 
                                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    value={settings.facebook_url}
                                                    onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                                                    placeholder="https://facebook.com/yourpage"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                                                    <Youtube size={14} className="text-[#FF0000]" /> YouTube URL
                                                </label>
                                                <input 
                                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    value={settings.youtube_url}
                                                    onChange={e => setSettings({...settings, youtube_url: e.target.value})}
                                                    placeholder="https://youtube.com/@yourchannel"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                                                    <MessageCircle size={14} className="text-[#25D366]" /> WhatsApp Number
                                                </label>
                                                <input 
                                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-11 px-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    value={settings.whatsapp_number}
                                                    onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                                                    placeholder="0123456789"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#F1F5F9] flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={updatingBranding}
                                            className="bg-indigo-600 text-white h-12 px-8 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                        >
                                            {updatingBranding ? <Loader2 className="animate-spin" size={20} /> : <SettingsIcon size={18} />}
                                            Update Platform Branding
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
