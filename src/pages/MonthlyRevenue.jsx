import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const MonthlyRevenue = () => {
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        try {
            const res = await api.get('/teacher/revenue/monthly');
            setMonths(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch monthly revenue', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/teacher" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Revenue History</h1>
                    <p className="text-[#64748B] font-medium mt-1">Monthly breakdown of your earnings</p>
                </div>
            </div>

            {months.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-[24px] border border-slate-200">
                    <p className="text-slate-500 font-medium">No revenue to show yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {months.map((item, i) => (
                        <Link 
                            key={i} 
                            to={`/teacher/revenue/${item.month}`}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{item.month}</h3>
                                    <p className="text-sm font-medium text-slate-500">{item.transactions_count} Transactions</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xl font-extrabold text-indigo-600">${item.revenue}</p>
                                </div>
                                <ChevronRight className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MonthlyRevenue;
