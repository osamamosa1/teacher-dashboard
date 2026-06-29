import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, UserPlus, History } from 'lucide-react';
import api from '../api/axios';

const MonthlyRevenue = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/teacher/revenue/transactions');
            setTransactions(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch revenue transactions', err);
        } finally {
            setLoading(false);
        }
    };

    const total = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

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
                    <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Revenue Details</h1>
                    <p className="text-[#64748B] font-medium mt-1">
                        All enrollments & renewals — Total: <span className="text-indigo-600 font-bold">${total.toFixed(2)}</span>
                    </p>
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-[24px] border border-slate-200">
                    <p className="text-slate-500 font-medium">No revenue yet. Enroll a student in a course to record earnings.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Price</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Registered</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <span className="font-bold text-slate-800">{tx.student_name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-medium text-slate-600">{tx.course_name}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-extrabold text-indigo-600">${Number(tx.amount).toFixed(2)}</span>
                                    </td>
                                    <td className="p-4 text-right text-sm font-medium text-slate-500 whitespace-nowrap">
                                        {tx.date}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            tx.type === 'enrollment'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {tx.type === 'enrollment' ? <UserPlus size={12} /> : <History size={12} />}
                                            {tx.type}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MonthlyRevenue;
