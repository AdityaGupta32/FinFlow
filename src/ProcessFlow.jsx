import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, BrainCircuit, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ProcessFlow = () => {
  useEffect(() => {
    // GSAP animation for staggered entry from the left
    gsap.utils.toArray('.process-step').forEach((step) => {
      gsap.fromTo(step, 
        { opacity: 0, x: -40 },
        {
          scrollTrigger: {
            trigger: step,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 1, x: 0, duration: 1, ease: "power3.out"
        }
      );
    });
  }, []);

  return (
    <section id="process" className="py-32 px-6 md:px-24 bg-fintech-primary relative overflow-hidden">
      {/* Background Neural Trace - Shifted left to match the new alignment */}
      <div className="absolute top-0 left-12 md:left-32 w-px h-full bg-gradient-to-b from-fintech-accent/0 via-fintech-accent/20 to-transparent hidden md:block" />

      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-4">The Pipeline</h2>
          <p className="text-fintech-accent font-mono uppercase tracking-[0.4em] text-sm">Automated Financial Ingestion</p>
        </div>

        <div className="flex flex-col gap-24">
          
          {/* Step 1: Neural Extraction */}
          <div className="process-step grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 shrink-0 rounded-[2rem] bg-fintech-card border border-fintech-accent/20 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.1)]">
                <FileText className="text-fintech-accent w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-white">01. Neural Extraction</h3>
            </div>
            <div className="md:border-l md:border-white/10 md:pl-12">
              <p className="text-gray-400 text-lg leading-relaxed">
                Binary extraction of UPI transaction logs from raw PDF statements using `pdfplumber`. 
                We normalize fragmented bank data into a structured vector feed.
              </p>
            </div>
          </div>

          {/* Step 2: ML Forecasting */}
          <div className="process-step grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 shrink-0 rounded-[2rem] bg-fintech-card border border-fintech-success/20 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.1)]">
                <TrendingUp className="text-fintech-success w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-white">02. ML Forecasting</h3>
            </div>
            <div className="md:border-l md:border-white/10 md:pl-12">
              <p className="text-gray-400 text-lg leading-relaxed">
                Multi-feature regression analysis using `joblib` models. We process 10 neural 
                parameters to predict future spending patterns with high precision.
              </p>
            </div>
          </div>

          {/* Step 3: Grok AI Engine */}
          <div className="process-step grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 shrink-0 rounded-[2rem] bg-fintech-card border border-purple-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <BrainCircuit className="text-purple-400 w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-white">03. Grok AI Engine</h3>
            </div>
            <div className="md:border-l md:border-white/10 md:pl-12">
              <p className="text-gray-400 text-lg leading-relaxed">
              Smart contextual analysis that turns your spending habits into actionable financial advice.”

Personalized insights and witty money advice, shaped by how you actually spend.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;