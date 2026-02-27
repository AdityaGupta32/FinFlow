import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, BrainCircuit, TrendingUp, ArrowRight, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ProcessFlow = () => {
  const containerRef = useRef(null);
  const horizontalRef = useRef(null);

  useEffect(() => {
    // 3D Horizontal Staggered Entry
    const cards = gsap.utils.toArray('.process-card-horizontal');
    
    gsap.fromTo(cards, 
      { 
        opacity: 0, 
        x: 100, 
        rotateY: 45, 
        scale: 0.9 
      },
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        scale: 1,
        stagger: 0.3,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        }
      }
    );

    // Subtle floating loop for the 3D cards
    gsap.to(".process-card-horizontal", {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.2
    });
  }, []);

  return (
    <section ref={containerRef} id="process" className="py-32 px-6 md:px-24 bg-[#F8FAFC] overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        {/* LEFT SIDE: About Us / Narrative */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-[10px] font-bold uppercase tracking-widest">Our Methodology</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
            Engineered for <br />
            <span className="text-blue-600 text-3xl md:text-5xl">Absolute Precision.</span>
          </h2>

          <p className="text-lg text-slate-500 max-w-md leading-relaxed">
            At FinFlow.ai, we bridge the gap between raw UPI data and institutional intelligence. 
            Our pipeline is a closed-loop system designed to ingest, process, and predict 
            financial trajectories in real-time.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
              <p className="text-slate-700 font-semibold italic text-sm">"Turning transaction history into a strategic asset."</p>
            </div>
          </div>

          <button className="flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all">
            Deep Dive into Documentation <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT SIDE: 3D Horizontal Card Stack */}
        <div className="relative h-[500px] flex items-center perspective-2000">
          <div ref={horizontalRef} className="flex flex-col gap-6 w-full">
            
            <Horizontal3DCard 
              index="01"
              icon={<FileText className="text-blue-600" />}
              title="Extraction"
              desc="PDFPlumber binary parsing for UPI logs."
            />

            <Horizontal3DCard 
              index="02"
              icon={<TrendingUp className="text-blue-600" />}
              title="Forecasting"
              desc="Joblib-backed ML regression models."
            />

            <Horizontal3DCard 
              index="03"
              icon={<BrainCircuit className="text-blue-600" />}
              title="Grok Logic"
              desc="Contextual AI spending habit analysis."
            />

          </div>
        </div>
      </div>
    </section>
  );
};

/* Horizontal 3D Card Sub-component */
const Horizontal3DCard = ({ index, icon, title, desc }) => {
  return (
    <div className="process-card-horizontal group bg-white border border-slate-200 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 flex items-center gap-6 cursor-default">
      <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
        {icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
          <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{index}</span>
        </div>
        <p className="text-slate-500 text-sm leading-snug">{desc}</p>
      </div>

      <div className="w-1 h-10 bg-slate-100 rounded-full group-hover:bg-blue-400 transition-colors" />
    </div>
  );
};

export default ProcessFlow;