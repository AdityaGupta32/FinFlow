import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { supabase } from './Supabase'; 
import Navbar from './Navbar';
import Hero from './Hero';
import ProcessFlow from './ProcessFlow';
import Dashboard from './Dashboard';

// --- COMPONENT: ARCHITECTURE ---
// Extracted to top level for correct React structure
const Architecture = () => {
  return (
    <section className="py-32 px-6 bg-fintech-primary border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fintech-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="w-full md:w-1/2">
            <h2 className="text-5xl font-black mb-8 leading-tight text-white">
              The Neural <br />
              <span className="text-fintech-accent">Infrastructure.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Our architecture is built for high-velocity data ingestion and real-time inference. 
              By decoupling the processing engine from the UI, we ensure sub-2-second latency 
              for complex vector analysis.
            </p>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-fintech-accent/30 transition-all group">
                <h4 className="text-fintech-accent font-bold uppercase tracking-widest text-xs mb-2">Backend Engine</h4>
                <p className="text-sm text-gray-300">FastAPI managing multi-threaded PDF parsing and regression analysis.</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-fintech-accent/30 transition-all group">
                <h4 className="text-fintech-accent font-bold uppercase tracking-widest text-xs mb-2">Vector Storage</h4>
                <p className="text-sm text-gray-300">Supabase serving as the secure neural repository for transaction logs.</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 bg-fintech-card p-1 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden group">
            <div className="bg-fintech-primary/50 p-8 rounded-[2.8rem] border border-white/5">
               <div className="flex justify-between items-center mb-12">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                   <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                 </div>
                 <span className="text-[10px] text-gray-500 font-mono">FINFLOW_ENGINE_STDOUT</span>
               </div>
               <div className="font-mono text-sm space-y-2">
                 <p className="text-blue-400"># Initializing Ingestion Pipeline...</p>
                 <p className="text-gray-500">{"[INFO] Loading pre-trained joblib model..."}</p>
                 <p className="text-emerald-400">{"[SUCCESS] 94.2% Probability Threshold Met"}</p>
                 <p className="text-gray-500">{"[INFO] Normalizing 16.6 months of data..."}</p>
                 <p className="text-purple-400">{"[AI] Generating Grok Insight via Gemini..."}</p>
                 <div className="w-1 h-5 bg-fintech-accent animate-pulse inline-block" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- COMPONENT: ANIMATED BACKGROUND ---
const AnimatedBackground = () => {
  const glow1Ref = useRef(null);
  const glow2Ref = useRef(null);

  useEffect(() => {
    [glow1Ref, glow2Ref].forEach(ref => {
      gsap.to(ref.current, {
        x: "random(-100, 100)",
        y: "random(-100, 100)",
        duration: "random(10, 20)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 moving-grid opacity-30" />
      <div ref={glow1Ref} className="neural-bg-glow w-[600px] h-[600px] -top-20 -left-20" />
      <div ref={glow2Ref} className="neural-bg-glow w-[800px] h-[800px] -bottom-40 -right-40 opacity-50" />
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
      if ((txData && txData.length > 0) || mlData) setView('dashboard');
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
    <div className="min-h-screen bg-fintech-primary text-white font-sans selection:bg-fintech-accent selection:text-fintech-primary">
      <Navbar 
        user={user} 
        onSignOut={async () => await supabase.auth.signOut()}
        onHomeClick={() => setView('landing')}
        onDashboardClick={() => { if (transactionData.length > 0 || predictionData) setView('dashboard'); }}
        onLoginClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google' })}
      />

      {/* Place the background here */}
      {view === 'landing' && <AnimatedBackground />}

      <div className="pt-24 relative z-10"> 
        {view === 'dashboard' ? (
          <Dashboard transactions={transactionData} predictionData={predictionData} user={user} onUploadSuccess={() => fetchLiveFinanceData(user?.id)} />
        ) : (
          <main>
            <Hero />
            
          

            <ProcessFlow />
            <Architecture />
            
            <footer className="py-12 text-center border-t border-white/5 opacity-40">
               <p className="text-[10px] uppercase tracking-[0.3em] font-bold">
                 &copy; 2026 FinFlow Intelligence • Secure Neural Environment
               </p>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;