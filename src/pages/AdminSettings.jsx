import { useState, useEffect } from 'react';
import { Settings, Save, Upload, CheckCircle, AlertCircle, Globe, Image as ImageIcon, MessageSquare, Phone } from 'lucide-react';
import api from '../api/axios';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        app_name: '',
        logo_url: '',
        facebook_url: '',
        youtube_url: '',
        whatsapp_number: '',
        global_announcement: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/1');
            setSettings(res.data.data);
        } catch (err) {
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings({ ...settings, logo_url: res.data.url });
            showToast('Logo uploaded successfully');
        } catch (err) {
            showToast('Failed to upload logo', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/settings', settings);
            showToast('Settings saved successfully');
        } catch (err) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-10 pb-10 max-w-4xl">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold transition-all animate-in slide-in-from-right-8 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {toast.msg}
                </div>
            )}

            <header>
                <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Platform Settings</h1>
                <p className="text-[#64748B] text-lg font-medium mt-1">Manage global branding, social links, and announcements.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Branding Section */}
                <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-3">
                        <ImageIcon className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-bold text-[#0F172A]">Global Branding</h2>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#0F172A] mb-2">Application Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                        value={settings.app_name}
                                        onChange={e => setSettings({...settings, app_name: e.target.value})}
                                        placeholder="e.g., MPS Academy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#0F172A] mb-2">Logo Management</label>
                                    <div className="flex items-center gap-6 p-4 border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                                        <div className="w-20 h-20 bg-[#F1F5F9] rounded-2xl flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
                                            {settings.logo_url ? (
                                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon className="text-[#94A3B8]" size={32} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer font-bold text-xs transition-colors">
                                                <Upload size={14} />
                                                {uploading ? 'Uploading...' : 'Upload New Logo'}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                            </label>
                                            <p className="text-[10px] text-[#64748B] mt-2 font-medium uppercase tracking-wider">Clear background PNG recommended (200x200px)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0]">
                                <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-[#64748B]">Preview in Student App</h4>
                                <div className="bg-white rounded-3xl shadow-lg border border-[#E2E8F0] overflow-hidden w-full max-w-[240px] mx-auto aspect-[9/16] relative">
                                    <div className="h-1/3 bg-indigo-600 p-4 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                                            <img src={settings.logo_url || '/assets/logo.png'} className="w-8 h-8 object-contain" />
                                        </div>
                                        <p className="text-white text-[10px] font-black">{settings.app_name}</p>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="h-2 w-1/2 bg-[#F1F5F9] rounded-full" />
                                        <div className="h-20 w-full bg-[#F1F5F9] rounded-xl" />
                                        <div className="h-2 w-full bg-[#F1F5F9] rounded-full" />
                                        <div className="h-2 w-3/4 bg-[#F1F5F9] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Section */}
                <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-3">
                        <Globe className="text-emerald-600" size={24} />
                        <h2 className="text-xl font-bold text-[#0F172A]">Social & Contact</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                                <Phone size={14} className="text-emerald-600" /> WhatsApp Number
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                                value={settings.whatsapp_number}
                                onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                                placeholder="e.g., 201007309722"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#0F172A] mb-2">Facebook URL</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                value={settings.facebook_url}
                                onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                                placeholder="https://facebook.com/your-page"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-[#0F172A] mb-2">YouTube Channel URL</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-red-500 outline-none font-medium transition-all"
                                value={settings.youtube_url}
                                onChange={e => setSettings({...settings, youtube_url: e.target.value})}
                                placeholder="https://youtube.com/@channel"
                            />
                        </div>
                    </div>
                </div>

                {/* Announcement Section */}
                <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-3">
                        <MessageSquare className="text-amber-600" size={24} />
                        <h2 className="text-xl font-bold text-[#0F172A]">Public Announcement</h2>
                    </div>
                    <div className="p-8">
                        <label className="block text-sm font-bold text-[#0F172A] mb-2">Global Message (Appears to all students)</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-amber-500 outline-none font-medium transition-all h-32 resize-none"
                            value={settings.global_announcement}
                            onChange={e => setSettings({...settings, global_announcement: e.target.value})}
                            placeholder="e.g., New courses have been added for the final exams review!"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-indigo-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
