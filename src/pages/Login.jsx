import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import {
    Lock,
    Mail,
    Loader2,
    ArrowRight,
    Eye,
    EyeOff,
    ShieldCheck,
    Globe
} from "lucide-react";
import axios from "axios";

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [error, setError] = useState("");

    useState(() => {
        const fetchSettings = async () => {
            try {
                // Determine API root based on the dashboard context
                const res = await axios.get('/api/v1/settings/1');
                setSettings(res.data.data);
            } catch (err) {
                console.error("Failed to load settings");
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/dashboard/login", {
                login: email,
                password
            });

            const { token, user } = response.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "admin") navigate("/admin");
            else navigate("/teacher");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Invalid credentials. Please verify your login details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden p-6">

            {/* background glow */}
            <div className="absolute w-[500px] h-[500px] bg-indigo-300/40 blur-[140px] rounded-full -top-32 -left-32"></div>
            <div className="absolute w-[400px] h-[400px] bg-purple-300/40 blur-[120px] rounded-full -bottom-32 -right-32"></div>

            <div className="w-full max-w-md">

                {/* card */}
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-10">

                    {/* logo */}
                    <div className="flex flex-col items-center mb-8">

                        <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-2">
                            {settings?.logo_url ? (
                                <img src={settings.logo_url} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <ShieldCheck className="text-indigo-900" size={32} />
                            )}
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
                            {settings?.app_name || "Welcome Back"}
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Sign in to your dashboard
                        </p>

                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* EMAIL */}
                        <div className="relative">

                            <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="peer w-full h-14 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                placeholder=" "
                            />

                            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all 
              peer-placeholder-shown:top-1/2 
              peer-placeholder-shown:text-sm 
              peer-focus:top-2 
              peer-focus:text-xs 
              peer-focus:text-indigo-600
              peer-not-placeholder-shown:top-2
              peer-not-placeholder-shown:text-xs">
                                Email
                            </label>

                        </div>

                        {/* PASSWORD */}
                        <div className="relative">

                            <Lock
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="peer w-full h-14 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                placeholder=" "
                            />

                            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all 
              peer-placeholder-shown:top-1/2 
              peer-placeholder-shown:text-sm 
              peer-focus:top-2 
              peer-focus:text-xs 
              peer-focus:text-indigo-600
              peer-not-placeholder-shown:top-2
              peer-not-placeholder-shown:text-xs">
                                Password
                            </label>

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>

                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-center font-medium">
                                {error}
                            </div>
                        )}

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-indigo-900/30"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                    </form>

                    {/* footer */}
                    <div className="mt-8 text-center text-xs text-slate-500">

                        Don't have an account?{" "}
                        <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                            Contact Admin
                        </span>

                    </div>

                </div>

                {/* bottom */}
                <div className="flex justify-center gap-4 mt-6 text-[10px] uppercase text-slate-400 font-bold tracking-wider">

                    <span className="hover:text-indigo-600 cursor-pointer">
                        Privacy Policy
                    </span>

                    <span>•</span>

                    <span className="hover:text-indigo-600 cursor-pointer">
                        Terms
                    </span>

                </div>

            </div>

        </div>
    );
};

export default Login;
