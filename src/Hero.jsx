import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ShieldCheck, BrainCircuit, Activity, Zap, CreditCard, ArrowRight, Fingerprint, PieChart, BarChart3 } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const visualRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(textRef.current.children, 
      { opacity: 0, x: -40 }, 
      { opacity: 1, x: 0, duration: 1, stagger: 0.15, delay: 0.4 }
    )
    .fromTo(visualRef.current,
      { opacity: 0, scale: 0.85, rotateY: -10 },
      { opacity: 1, scale: 1, rotateY: 0, duration: 1.4 },
      "-=1"
    );

    // Subtle 3D Floating Loop
    gsap.to(".floating-element", {
      y: 12,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: { amount: 1.5, from: "center" }
    });
  }, []);

  return (
    <section ref={containerRef} className="min-h-screen flex items-center justify-center px-6 md:px-20 relative overflow-hidden bg-[#F9FAFB]">
      {/* Decorative Gradient Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        
        {/* LEFT SIDE: Copy & Conversion */}
        <div ref={textRef} className="text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-200 bg-white shadow-sm">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              System Live: 99.9% Uptime
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Flow Right . <br />
            <span className="text-blue-600">Future Bright .</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-md leading-relaxed">
            A specialized ledger for high-net-worth tracking. Seamlessly categorize UPI flows and forecast future liquidity with our proprietary ML engine.
          </p>

          <div className="flex gap-4 pt-4">
            <button className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
              Start Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Compact 3D Visual with Analytics */}
        <div ref={visualRef} className="relative h-[600px] flex items-center justify-center perspective-1000">
          
          {/* Scaled-Down Pro Device */}
          <div className="floating-element relative w-[240px] h-[480px] bg-white rounded-[2.5rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden z-20">
             {/* Screen Content: Advanced Analytics UI */}
             <div className="p-5 pt-10 space-y-5">
                <div className="flex justify-between items-center mb-2">
                    <div className="h-2 w-12 bg-slate-200 rounded-full" />
                    <Fingerprint className="w-4 h-4 text-slate-300" />
                </div>

                {/* Circular Liquidity Gauge */}
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset="100" className="text-blue-500" />
                    </svg>
                    <div className="absolute text-center">
                        <span className="text-xs text-slate-400 block uppercase font-bold tracking-tighter">Liquidity</span>
                        <span className="text-lg font-black text-slate-800">82%</span>
                    </div>
                </div>

                {/* Spending Heatmap Bars */}
                <div className="space-y-3 pt-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-500 w-1/2" />
                        <div className="h-full bg-indigo-400 w-1/4" />
                        <div className="h-full bg-slate-300 w-1/4" />
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-end p-1 justify-center gap-0.5">
                                <div className="w-1.5 h-1/2 bg-blue-200 rounded-t-sm" />
                                <div className="w-1.5 h-3/4 bg-blue-400 rounded-t-sm" />
                                <div className="w-1.5 h-1/3 bg-blue-100 rounded-t-sm" />
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>

          {/* External Analytics Node 1: Market Pulse */}
          <div className="floating-element absolute top-10 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 z-30 w-40 flex items-center gap-3">
             <div className="p-2 bg-emerald-50 rounded-lg"><PieChart className="w-4 h-4 text-emerald-600" /></div>
             <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Growth</div>
                <div className="text-sm font-black text-slate-800">+4.2%</div>
             </div>
          </div>

          {/* External Analytics Node 2: Burn Rate Chart */}
          <div className="floating-element absolute bottom-20 left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-30 w-48">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-900 uppercase">Burn Rate</span>
                <BarChart3 className="w-4 h-4 text-blue-500" />
             </div>
             <div className="flex items-end gap-1 h-12">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-50 rounded-t-sm hover:bg-blue-500 transition-colors" style={{ height: `${h}%` }} />
                ))}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;