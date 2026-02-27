import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from './Supabase'; 
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  ArrowDownCircle, ShieldAlert, Plus, X, 
  BrainCircuit, Landmark, TrendingUp, Sparkles, Save,
  Briefcase, Trash2, Loader2, Clock, ArrowUpRight
} from 'lucide-react';
import ScrollReveal from './ScrollReveal.jsx';
import FileUpload from './FileUpload.jsx';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

const Dashboard = ({ transactions = [], predictionData = null, user = null, onUploadSuccess }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [offers, setOffers] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [targetBank, setTargetBank] = useState("HDFC Regalia");
  
  const [profile, setProfile] = useState({
    job_title: '',
    education_level: '',
    employment_status: '', 
    monthly_income: 0,
    credit_score: 0,
  });
  
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('spending_results')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          job_title: data.job_title || 'AI/ML Engineer',
          education_level: data.education_level || "Bachelor's",
          employment_status: data.employment_status || "Employed",
          monthly_income: data.monthly_income_usd || 0,
          credit_score: data.credit_score || 700,
        });

        setLoans([{
          type: data.loan_type || 'Personal',
          emi: data.monthly_emi_usd || 0,
          interest: data.loan_interest_rate_pct || 0,
          duration: data.loan_term_months || 0
        }]);
      }
    };
    fetchUserData();
  }, [user]);

  const handleScanOffers = async () => {
    setIsScraping(true);
    try {
      const response = await fetch("http://localhost:8000/scrape-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_name: targetBank }),
      });
      const data = await response.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error("Scraper Error:", err);
    } finally {
      setIsScraping(false);
    }
  };

  const addLoan = () => setLoans([...loans, { type: 'Personal', emi: 0, interest: 0, duration: 0 }]);
  const removeLoan = (index) => loans.length > 1 && setLoans(loans.filter((_, i) => i !== index));
  const updateLoan = (index, field, value) => {
    const updatedLoans = [...loans];
    updatedLoans[index][field] = value;
    setLoans(updatedLoans);
  };

  const syncLiabilityData = async () => {
    if (!user) return;
    setIsSyncing(true);
    const totalEMI = loans.reduce((acc, curr) => acc + parseFloat(curr.emi || 0), 0);
    const totalInterest = loans.reduce((acc, curr) => acc + parseFloat(curr.interest || 0), 0);
    const avgInterest = loans.length > 0 ? totalInterest / loans.length : 0;
    const maxDuration = Math.max(...loans.map(l => parseInt(l.duration || 0)));

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("monthly_income", profile.monthly_income);
    formData.append("job_title", profile.job_title);
    formData.append("education", profile.education_level);
    formData.append("employment", profile.employment_status);
    formData.append("has_loan", loans.length > 0 ? "yes" : "no");
    formData.append("loan_type", loans[0]?.type || "None");
    formData.append("loan_term_months", maxDuration);
    formData.append("monthly_emi_usd", totalEMI);
    formData.append("loan_interest_rate_pct", avgInterest);
    formData.append("credit_score", profile.credit_score);

    try {
      await fetch("http://localhost:8000/predict", { method: "POST", body: formData });
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const summary = useMemo(() => {
    let expense = 0;
    const categoryMap = {};
    if (!Array.isArray(transactions) || transactions.length === 0) 
        return { expense: 0, chartData: [], dateRange: "", cashFlowData: [] };

    const sortedDates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d)).sort((a, b) => a - b);
    const dateRange = sortedDates.length > 0 
      ? `${sortedDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${sortedDates[sortedDates.length - 1].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : "";

    transactions.forEach(t => {
      const amt = parseFloat(String(t.amount).replace(/,/g, ''));
      if (isNaN(amt) || amt >= 0) return; 
      const absAmt = Math.abs(amt);
      expense += absAmt;
      const cat = t.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + absAmt;
    });
    
    const daysDiff = (Math.max(...sortedDates) - Math.min(...sortedDates)) / (1000 * 60 * 60 * 24);
    const numMonths = Math.max(1, Math.round(daysDiff / 30.44 * 10) / 10);
    const normalizedExpense = expense / numMonths;
    const moneyTransferAmount = Math.max(0, expense - normalizedExpense);

    const cashFlowData = [
      { name: 'Income', amount: parseFloat(profile.monthly_income), fill: '#10b981' },
      { name: 'Avg. Expense', amount: normalizedExpense, fill: '#f43f5e' },
      { name: 'Money Transfer', amount: moneyTransferAmount, fill: '#f59e0b' },
      { name: 'Savings', amount: Math.max(0, parseFloat(profile.monthly_income) - normalizedExpense), fill: '#6366f1' }
    ];

    const chartData = Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] })).sort((a, b) => b.value - a.value);

    return { expense, chartData, dateRange, cashFlowData };
  }, [transactions, profile.monthly_income]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 pt-24 md:p-12 text-slate-900 relative selection:bg-indigo-100">
      
      {isUploadOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative z-[210] w-full max-w-4xl bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <button onClick={() => setIsUploadOpen(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 z-30 transition-colors"><X size={28} /></button>
            <div className="p-8">
              <FileUpload user_id={user?.id} onUploadSuccess={() => { onUploadSuccess(); setIsUploadOpen(false); }} />
            </div>
          </div>
        </div>
      )}

      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Health Matrix</h1>
            {summary.dateRange && (
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Clock size={12} /> {summary.dateRange}
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium">AI-Driven Insights for <span className="text-indigo-600 font-bold">{user?.user_metadata?.full_name || "Aditya Gupta"}</span></p>
        </div>
        <button onClick={() => setIsUploadOpen(true)} className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95">
          <Plus size={18} /> Add Statement
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <SummaryCard title="Total Expenditure" amount={summary.expense} icon={ArrowDownCircle} colorClass="text-slate-900" bgClass="bg-[#FFFFF0]" iconColor="text-rose-500" isBalance />
        <SummaryCard title="Risk Indicators" amount={predictionData?.alerts?.length || 0} icon={ShieldAlert} colorClass="text-amber-600" bgClass="bg-[#FFFFF0]" iconColor="text-amber-500" noCurrency />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm h-[450px] mb-12">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-slate-900">
          <TrendingUp className="text-emerald-500" size={24} /> Normalized Cash Flow Architecture
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={summary.cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Briefcase size={16} /> Demographics</h3>
            <div className="space-y-6">
              <ProfileInput label="Role" value={profile.job_title} onChange={(v) => setProfile({...profile, job_title: v})} options={["AI/ML Engineer", "Manager", "Doctor", "Student"]} />
              <ProfileInput label="Education" value={profile.education_level} onChange={(v) => setProfile({...profile, education_level: v})} options={["Bachelor's", "Master's", "PhD"]} />
              <ProfileInput label="Monthly Income" value={profile.monthly_income} onChange={(v) => setProfile({...profile, monthly_income: v})} type="number" />
              <ProfileInput label="Credit Vitality" value={profile.credit_score} onChange={(v) => setProfile({...profile, credit_score: v})} type="number" highlight />
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 bg-[#FFFFF0]"><Landmark size={16} /> Liability Ledger</h3>
              <button onClick={addLoan} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14} /> Add Instrument</button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {loans.map((loan, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all group">
                  <LoanField label="Type" value={loan.type} onChange={(v) => updateLoan(idx, 'type', v)} options={['Personal', 'Home', 'Education']} />
                  <LoanField label="EMI (₹)" value={loan.emi} onChange={(v) => updateLoan(idx, 'emi', v)} />
                  <LoanField label="Rate (%)" value={loan.interest} onChange={(v) => updateLoan(idx, 'interest', v)} />
                  <div className="flex items-center gap-3">
                    <LoanField label="Term (Mo)" value={loan.duration} onChange={(v) => updateLoan(idx, 'duration', v)} />
                    {loans.length > 1 && ( <button onClick={() => removeLoan(idx)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button> )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 items-stretch">
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="relative overflow-hidden bg-[#1e2235] p-5 rounded-[1.8rem] shadow-xl group h-[180px] flex flex-col justify-between border border-slate-700/50 shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit size={80} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-300 mb-2">Neural Burn Forecast</h3>
                <div className="w-9 h-7 bg-gradient-to-br from-amber-200 to-amber-500 rounded-md shadow-inner" />
              </div>
              <Sparkles size={16} className="text-indigo-400" />
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white tracking-widest mb-2 font-mono">
                ₹{predictionData?.prediction || "0.00"}
              </p>
              <div className="flex justify-between items-end border-t border-white/10 pt-2">
                <div>
                  <p className="text-[7px] text-slate-400 uppercase font-bold">Account Index</p>
                  <p className="text-[9px] text-white font-mono tracking-tighter">**** **** **** 8842</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-slate-400 uppercase font-bold">Confidence</p>
                  <p className="text-[9px] text-emerald-400 font-bold">94.2% MATCH</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-500" /> Rewards Scanner
              </h3>
              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">LIVE</span>
            </div>
            <div className="mb-4 flex gap-2">
               <input 
                type="text" 
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value)}
                placeholder="Bank Name"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
              />
              <button 
                onClick={handleScanOffers}
                disabled={isScraping}
                className="bg-[#0f172a] hover:bg-indigo-600 text-white p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isScraping ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {offers.length > 0 ? (
                offers.map((offer, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
                    <p className="text-[10px] font-bold text-slate-800 leading-tight mb-1">{offer.merchant}</p>
                    <p className="text-[9px] text-indigo-600 font-medium leading-tight">{offer.benefit}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-6">
                  <BrainCircuit size={20} className="mb-2" />
                  <p className="text-[9px] font-medium leading-relaxed">Enter bank name <br/> to pull live deals</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REFINED STATIC HEIGHT OPTIMIZATION CARD */}
        <div className="lg:col-span-3 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[484px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <TrendingUp size={18} className="text-indigo-600" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Optimization Architecture</h3>
            </div>
            <span className="text-[8px] font-bold text-indigo-400 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">Static Node</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 mb-4">
            <p className="text-sm text-slate-600 italic leading-relaxed font-serif">
              "{predictionData?.suggestion || "Synthesizing transaction logs to define liquidity thresholds..."}"
            </p>
          </div>

          <div className="mt-auto flex justify-end">
            <button 
              onClick={syncLiabilityData} 
              disabled={isSyncing} 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
               {isSyncing ? <Loader2 className="animate-spin w-3 h-3" /> : <Save size={12} />} 
               Sync Global Parameters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-10 h-[550px] flex flex-col shadow-sm">
          <h3 className="text-xl font-bold mb-8 text-slate-900">Neural Transaction Log</h3>
          <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar space-y-4">
            {transactions.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${t.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    {t.category?.[0] || 'T'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.description}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{t.date} • {t.category}</p>
                  </div>
                </div>
                <p className={`font-mono font-bold text-lg ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 h-[550px] shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-8 text-slate-900">Spend Concentration</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.chartData} innerRadius={80} outerRadius={120} paddingAngle={6} dataKey="value">
                  {summary.chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

// STABLE SUMMARY CARD COMPONENT
const SummaryCard = ({ title, amount, icon: Icon, colorClass, bgClass, iconColor, noCurrency, isBalance }) => (
  <div className={`${bgClass} p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center transition-all hover:shadow-md h-full group`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest">{title}</h3>
      <div className="p-3 bg-slate-50 rounded-2xl shadow-inner transition-transform group-hover:scale-110">
        {/* Added type check for Icon to ensure it is a valid component */}
        {typeof Icon === 'function' ? <Icon className={`w-6 h-6 ${iconColor}`} /> : <div className="w-6 h-6 bg-slate-200 rounded-full" />}
      </div>
    </div>
    <p className={`text-4xl font-extrabold tracking-tighter ${colorClass}`}>
      {!noCurrency && '₹'}{amount?.toLocaleString() || '0'}
    </p>
    {isBalance && <p className="text-[10px] text-emerald-600 font-bold mt-4 flex items-center gap-1.5"><ArrowUpRight size={12}/> 15.43% than last month</p>}
  </div>
);

const ProfileInput = ({ label, value, onChange, options, highlight, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">{label}</label>
    {options ? (
      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input type={type} className={`w-full bg-slate-50 border ${highlight ? 'border-indigo-200 text-indigo-600 font-bold' : 'border-slate-100'} rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all`} value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

const LoanField = ({ label, value, onChange, options }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">{label}</label>
    {options ? (
      <select className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-400 cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-400 font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default Dashboard;