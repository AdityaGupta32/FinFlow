import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { Loader2, Shield, Layers } from 'lucide-react'; // Added icons for the internal components
import { supabase } from './Supabase'; 
import Navbar from './Navbar';
import Hero from './Hero';
import ProcessFlow from './ProcessFlow';
import Dashboard from './Dashboard';

// --- COMPONENT 1: ARCHITECTURE (Defined Internally) ---
const Architecture = () => {
  const terminalRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!terminalRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const rotateX = (clientY / innerHeight - 0.5) * 15;
      const rotateY = (clientX / innerWidth - 0.5) * -15;

      gsap.to(terminalRef.current, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.8,
        ease: "power2.out",
        transformPerspective: 1200
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-40 px-6 bg-[#FCFDFF] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-[45%] space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em]">Compute Node: Active</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black leading-[1.05] text-slate-900 tracking-tighter">
                The Neural <br />
                <span className="text-blue-600">Infrastructure.</span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed font-medium border-l-4 border-blue-500/20 pl-6">
                Institutional-grade backend logic built for sub-2-second inference and secure vector scaling.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>
                  <div><h4 className="font-bold text-slate-900">Backend Engine</h4><p className="text-sm text-slate-500">FastAPI & ML Inference.</p></div>
                </div>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900"><Shield /></div>
                  <div><h4 className="font-bold text-slate-900">Vector Storage</h4><p className="text-sm text-slate-500">Supabase Repository.</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-[55%] perspective-2000 py-10">
            <div ref={terminalRef} className="bg-slate-950 p-1 rounded-[4rem] shadow-2xl overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
              <div className="bg-slate-900/90 backdrop-blur-2xl p-10 rounded-[3.8rem] border border-white/10 font-mono text-sm space-y-4">
                 <div className="flex gap-2 mb-8">
                   <div className="w-3 h-3 rounded-full bg-red-500" />
                   <div className="w-3 h-3 rounded-full bg-yellow-500" />
                   <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 </div>
                 <p className="text-blue-400"># Initializing Ingestion Pipeline...</p>
                 <p className="text-emerald-400">{"[SUCCESS] 94.2% Probability Met"}</p>
                 <p className="text-purple-400 font-bold">{"[AI] Grok Insight Generated."}</p>
                 <div className="w-3 h-6 bg-blue-500 animate-pulse rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- COMPONENT 2: ANIMATED BACKGROUND ---
const AnimatedBackground = () => {
  const glow1Ref = useRef(null);
  const glow2Ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      [glow1Ref, glow2Ref].forEach(ref => {
        gsap.to(ref.current, {
          x: "random(-100, 100)", y: "random(-100, 100)",
          duration: "random(15, 25)", repeat: -1, yoyo: true, ease: "sine.inOut"
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#FAFBFF]">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div ref={glow1Ref} className="absolute w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px] -top-20 -left-20" />
      <div ref={glow2Ref} className="absolute w-[800px] h-[800px] rounded-full bg-indigo-50/50 blur-[140px] -bottom-40 -right-40" />
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null);
  const [transactionData, setTransactionData] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('landing'); 

  const fetchLiveFinanceData = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
      const { data: mlData } = await supabase.from('spending_results').select('*').eq('user_id', userId).order('calculation_date', { ascending: false }).limit(1).maybeSingle();
      setTransactionData(txData || []);
      if (mlData) {
        setPredictionData({
          prediction: mlData.predicted_next_month_expense,
          actual: mlData.actual_monthly_expense,
          suggestion: mlData.suggestion
        });
      }
      setView('dashboard'); 
    } catch (error) {
      console.error("Supabase Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) fetchLiveFinanceData(activeUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) fetchLiveFinanceData(activeUser.id);
      else { setTransactionData([]); setPredictionData(null); setView('landing'); }
    });
    return () => subscription.unsubscribe();
  }, [fetchLiveFinanceData]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-x-hidden">
      <Navbar 
        user={user} 
        onSignOut={async () => await supabase.auth.signOut()}
        onHomeClick={() => setView('landing')}
        onDashboardClick={() => { if (user) setView('dashboard'); }}
        onLoginClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google' })}
      />

      {view === 'landing' && <AnimatedBackground />}

      <div className="relative z-10"> 
        {view === 'dashboard' ? (
          <div className="pt-24">
            <Dashboard transactions={transactionData} predictionData={predictionData} user={user} onUploadSuccess={() => fetchLiveFinanceData(user?.id)} />
          </div>
        ) : (
          <main>
            <Hero />
            <ProcessFlow />
            <Architecture />
            <footer className="py-24 text-center border-t border-slate-100 bg-white">
               <div className="max-w-7xl mx-auto flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-blue-100">
                    <Layers className="text-white w-6 h-6" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.4em] font-black text-slate-400">
                    &copy; 2026 FinFlow Intelligence • Secure Neural Environment
                  </p>
               </div>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;