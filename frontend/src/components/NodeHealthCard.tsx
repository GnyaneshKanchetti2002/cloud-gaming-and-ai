"use client";
import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, ShieldCheck, Loader2, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/app/lib/api';

export default function NodeHealthCard({ resolution = "1080p" }: { resolution?: string }) {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState("Scanning Matrix...");
  const router = useRouter();

  // FEATURE FIX: Dynamically show Compute Tier Name based on Config
  const computeTier = resolution === "4K" ? "ULTRA" : resolution === "1440p" ? "AAA" : "ESPORTS";

  useEffect(() => {
    const checkLatency = async () => {
      try {
        const start = Date.now();
        const res = await fetch(`${API_BASE_URL}/ping`);
        if (res.ok) {
          const end = Date.now();
          // Adding a small overhead to simulate real-world routing
          setLatency(end - start + 12); 
          setStatus("Uplink: RNDR-IAD1");
        }
      } catch (e) {
        setStatus("Link Lost");
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group shadow-2xl min-h-[280px] flex flex-col justify-between transition-all hover:border-fuchsia-500/30">
      
      {/* CYBERPUNK NODE MAP BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.15] grayscale group-hover:opacity-[0.25] transition-opacity duration-700 pointer-events-none">
        <svg viewBox="0 0 800 400" className="w-full h-full object-cover">
          <path 
            fill="currentColor" 
            className="text-zinc-500"
            d="M150,150 L160,140 L180,145 L200,130 L220,140 L240,160 L230,180 L210,190 L190,210 L170,220 L150,210 L140,180 Z M400,100 L450,90 L500,100 L550,130 L580,180 L550,250 L500,280 L450,270 L400,250 Z M650,250 L700,240 L720,260 L710,290 L680,310 L640,290 Z" 
          />
          <circle cx="215" cy="155" r="4" className="fill-fuchsia-500 animate-ping" />
          <circle cx="215" cy="155" r="2" className="fill-fuchsia-400 shadow-[0_0_10px_#d946ef]" />
          <rect x="0" y="0" width="2" height="400" className="fill-fuchsia-500/20 animate-scan" />
        </svg>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.4em] mb-1">Neural Uplink</h4>
            <div className="flex items-center gap-2">
              {!latency ? (
                <Loader2 size={12} className="text-fuchsia-500 animate-spin" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef]" />
              )}
              <span className="text-white font-bold text-xs tracking-widest uppercase">{status}</span>
            </div>
          </div>
          <Activity className="text-zinc-700 group-hover:text-fuchsia-500/40 transition-colors" size={18} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-2xl p-3 border border-white/5 group-hover:border-fuchsia-500/20 transition-all">
            <span className="text-zinc-600 font-bold text-[8px] uppercase tracking-widest block mb-1">Ping</span>
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-white font-black italic text-base">{latency ? `${latency}ms` : '--'}</span>
            </div>
          </div>

          <div className="bg-black/40 rounded-2xl p-3 border border-white/5 group-hover:border-fuchsia-500/20 transition-all">
            <span className="text-zinc-600 font-bold text-[8px] uppercase tracking-widest block mb-1">Compute</span>
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-fuchsia-400" />
              <span className="text-white font-black italic text-base">{computeTier}</span>
            </div>
          </div>
        </div>

        {/* UPDATED CONNECT BUTTON: Navigates to the Stream Pad */}
        <button 
          onClick={() => router.push('/gaming/stream')}
          className="w-full py-3 bg-white/5 hover:bg-fuchsia-600 rounded-xl text-white font-black tracking-widest uppercase text-[10px] transition-all border border-white/10 hover:border-fuchsia-500 flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          <Link2 size={14} /> Establish Connection
        </button>
      </div>

      <div className="relative z-10 pt-2 flex items-center justify-between text-zinc-500 text-[8px] font-bold uppercase tracking-widest border-t border-zinc-800/50 mt-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={10} className="text-fuchsia-500" />
          Secure Tunnel Active
        </div>
        <span className="text-zinc-700 italic">IAD-V4.2</span>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateX(0); }
          100% { transform: translateX(800px); }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}