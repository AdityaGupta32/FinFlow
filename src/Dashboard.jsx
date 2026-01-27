import React, { useMemo, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import autoTable from 'jspdf-autotable';
import { supabase } from './Supabase'; 
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  ArrowDownCircle, ShieldAlert, Plus, X, 
  BrainCircuit, Landmark, TrendingUp, Sparkles, Save,
  Briefcase, GraduationCap, Coins, Calendar, Trash2,
  Gauge, Loader2, Clock
} from 'lucide-react';
import ScrollReveal from './ScrollReveal.jsx';
import FileUpload from './FileUpload.jsx';

const COLORS = ['#38BDF8', '#34D399', '#A78BFA', '#F472B6', '#FBBF24', '#F87171'];

const Dashboard = ({ transactions = [], predictionData = null, user = null, onUploadSuccess }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  
  const [profile, setProfile] = useState({
    job_title: '',
    education_level: '',
    employment_status: '', 
    monthly_income: 0,
    credit_score: 0,
  });
  
  const [loans, setLoans] = useState([]);

  // Fetch real-time data from Supabase
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

  const addLoan = () => setLoans([...loans, { type: 'Personal', emi: 0, interest: 0, duration: 0 }]);
  const removeLoan = (index) => loans.length > 1 && setLoans(loans.filter((_, i) => i !== index));
  const updateLoan = (index, field, value) => {
    const updatedLoans = [...loans];
    updatedLoans[index][field] = value;
    setLoans(updatedLoans);
  };

  const syncLiabilityData = async () => {
    if (!user) return; // Alert removed here
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
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData, 
      });
      // Handle response logic here if needed
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

    const sortedDates = transactions
      .map(t => new Date(t.date))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b);

    const dateRange = sortedDates.length > 0 
      ? `${sortedDates[0].toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${sortedDates[sortedDates.length - 1].toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
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
    const moneyTransferAmount = Math.abs(expense - normalizedExpense);
    const cashFlowData = [
      { name: 'Income', amount: parseFloat(profile.monthly_income), fill: '#34D399' },
      { name: 'Expenses', amount: normalizedExpense, fill: '#F87171' },
      { name: 'Savings', amount: Math.max(0, parseFloat(profile.monthly_income) - normalizedExpense), fill: '#38BDF8' },
      { name: 'Money Transfer', amount: moneyTransferAmount, fill: '#A78BFA' }
    ];

    const chartData = Object.keys(categoryMap).map(key => ({
      name: key, value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

    return { expense, chartData, dateRange, cashFlowData };
  }, [transactions, profile.monthly_income]);

  return (
    <div className="min-h-screen bg-fintech-primary p-6 pt-24 md:p-12 text-white relative">
      
      {isUploadOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-fintech-primary/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsUploadOpen(false)} />
          <div className="relative z-[160] w-full max-w-4xl bg-fintech-card border border-white/10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <button onClick={() => setIsUploadOpen(false)} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white z-30"><X size={28} /></button>
            <div className="p-2">
              <FileUpload user_id={user?.id} onUploadSuccess={() => { onUploadSuccess(); setIsUploadOpen(false); }} />
            </div>
          </div>
        </div>
      )}

      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Financial Health Matrix</h1>
            {summary.dateRange && (
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-fintech-accent flex items-center gap-2">
                <Clock size={12} /> {summary.dateRange}
              </span>
            )}
          </div>
          <p className="text-gray-400">AI-Driven Insights for <span className="text-fintech-accent">{user?.user_metadata?.full_name || "Aditya Gupta"}</span></p>
        </div>
        <button onClick={() => setIsUploadOpen(true)} className="px-6 py-3 bg-fintech-accent text-fintech-primary rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer">
          <Plus size={20} /> Add Statement
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <SummaryCard title="Total Burn" amount={summary.expense} icon={ArrowDownCircle} colorClass="text-red-400" bgClass="bg-red-500/20" iconColor="text-red-400" isExpense />
        <SummaryCard title="Risk Indicators" amount={predictionData?.alerts?.length || 0} icon={ShieldAlert} colorClass="text-orange-500" bgClass="bg-orange-500/20" iconColor="text-orange-500" noCurrency />
      </div>

      <div className="bg-fintech-card rounded-3xl border border-white/5 p-8 shadow-2xl h-[400px] mb-12">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} /> Normalized Cash Flow
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={summary.cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(1)}k`} />
            <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '12px', color:'#ffffff' }} itemStyle={{color:'#ffffff'}} markerStyle={{ display: 'none' }} />
            <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ScrollReveal>
        <div className="mb-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 bg-fintech-card rounded-3xl border border-white/5 p-8 shadow-2xl space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Briefcase size={16} /> Profile</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Job Title</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fintech-accent" value={profile.job_title} onChange={(e) => setProfile({...profile, job_title: e.target.value})}>
                    <option value="AI/ML Engineer">AI/ML Engineer</option>
                    <option value="Manager">Manager</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1"><GraduationCap size={12} /> Education</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fintech-accent" value={profile.education_level} onChange={(e) => setProfile({...profile, education_level: e.target.value})}>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD</option>
                    <option value="High School">High School</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Income (₹)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fintech-accent" value={profile.monthly_income} onChange={(e) => setProfile({...profile, monthly_income: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1"><Gauge size={10} /> Credit Score</label>
                  <input type="number" className="w-full bg-white/5 border border-fintech-accent/30 rounded-xl p-3 text-sm text-fintech-accent font-bold" value={profile.credit_score} onChange={(e) => setProfile({...profile, credit_score: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-fintech-card rounded-3xl border border-white/5 p-8 shadow-2xl space-y-6 h-full overflow-hidden">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Landmark size={16} /> Liability Engine</h3>
                <button onClick={addLoan} className="text-xs flex items-center gap-1 text-fintech-accent hover:text-white transition-colors"><Plus size={14} /> Add Another Loan</button>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {loans.map((loan, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 relative group">
                    <div className="space-y-1 text-xs">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Type</label>
                      <select className="w-full bg-fintech-primary border border-white/10 rounded-lg p-2" value={loan.type} onChange={(e) => updateLoan(index, 'type', e.target.value)}>
                        <option value="Personal">Personal Loan</option>
                        <option value="Home">Home Loan</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest">EMI (₹)</label>
                      <input type="number" className="w-full bg-fintech-primary border border-white/10 rounded-lg p-2 text-xs" value={loan.emi} onChange={(e) => updateLoan(index, 'emi', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Rate (%)</label>
                      <input type="number" step="0.1" className="w-full bg-fintech-primary border border-white/10 rounded-lg p-2 text-xs" value={loan.interest} onChange={(e) => updateLoan(index, 'interest', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Term (Mo)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-full bg-fintech-primary border border-white/10 rounded-lg p-2 text-xs" value={loan.duration} onChange={(e) => updateLoan(index, 'duration', e.target.value)} />
                        {loans.length > 1 && ( <button onClick={() => removeLoan(index)} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button> )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-fintech-card p-8 rounded-3xl border border-fintech-accent/30 border-l-4 border-l-fintech-accent shadow-2xl relative overflow-hidden group">
                <BrainCircuit size={80} className="absolute -bottom-4 -right-4 text-fintech-accent opacity-5" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><TrendingUp size={14} /> Forecast</h3>
                <p className="text-3xl font-bold text-white">₹{predictionData?.prediction || "0.00"}</p>
                <p className="text-[10px] text-gray-500 mt-2 font-bold italic">94.2% Probability</p>
              </div>

              <div className="lg:col-span-2 bg-fintech-card p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Sparkles size={14} className="text-amber-400" /> AI Suggestions</h3>
                  <p className="text-sm text-gray-300 italic leading-relaxed">
                    {predictionData?.suggestion || "Awaiting neural parameters..."}
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 self-end">
                  <button onClick={syncLiabilityData} disabled={isSyncing} className="flex items-center justify-center gap-2 px-8 py-3 bg-fintech-accent text-fintech-primary rounded-xl text-xs font-bold hover:bg-white transition-all disabled:opacity-50">
                    {isSyncing ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} Sync Neural Parameters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 bg-fintech-card rounded-3xl border border-white/5 p-8 h-[500px] flex flex-col shadow-2xl">
          <h3 className="text-xl font-bold mb-8">Vector Transaction Log</h3>
          <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar space-y-4">
            {transactions.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-fintech-primary/40 border border-white/5 hover:border-fintech-accent/40 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {t.category?.[0] || 'V'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-200">{t.description}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{t.date} • {t.category}</p>
                  </div>
                </div>
                <p className={`font-mono font-bold text-lg ${t.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fintech-card rounded-3xl border border-white/5 p-8 h-[500px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-bold mb-8">Spend Concentration</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.chartData} innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value">
                  {summary.chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '12px',color:'#ffffff' }} itemStyle={{ color: '#ffffff' }} markerStyle={{ display: 'none' }}/>
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryCard = ({ title, amount, icon: Icon, colorClass, bgClass, iconColor, isExpense, noCurrency }) => (
  <ScrollReveal>
    <div className="bg-fintech-card p-6 rounded-2xl border border-white/5 shadow-lg h-full flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-2.5 rounded-xl ${bgClass}`}><Icon className={`w-6 h-6 ${iconColor}`} /></div>
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <p className={`text-4xl font-bold tracking-tight ${colorClass}`}>{!noCurrency && '₹'}{amount.toLocaleString()}</p>
    </div>
  </ScrollReveal>
);

export default Dashboard;