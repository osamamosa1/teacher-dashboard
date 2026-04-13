import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, History, UserPlus } from 'lucide-react';
import api from '../api/axios';

const MonthTransactions = () => {
    const { month } = useParams();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, [month]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teacher/revenue/month/${month}`);
            setTransactions(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
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
                <Link to="/teacher/revenue" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Transactions</h1>
                    <p className="text-[#64748B] font-medium mt-1">Detailed breakdown for {month}</p>
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-[24px] border border-slate-200">
                    <p className="text-slate-500 font-medium">No transactions found for this month.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student & Course</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 w-1">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            tx.type === 'enrollment' 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {tx.type === 'enrollment' ? <UserPlus size={14} /> : <History size={14} />}
                                            {tx.type}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{tx.student_name}</span>
                                            <span className="text-sm font-medium text-slate-500">{tx.course_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-extrabold text-indigo-600">${tx.amount.toFixed(2)}</span>
                                    </td>
                                    <td className="p-4 text-right text-sm font-medium text-slate-500">
                                        {tx.date}
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

export default MonthTransactions;
