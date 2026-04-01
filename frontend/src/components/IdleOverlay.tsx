// frontend/src/components/IdleOverlay.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface IdleOverlayProps {
  onAction: () => void;
  onShutdown: () => void;
}

export default function IdleOverlay({ onAction, onShutdown }: IdleOverlayProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) {
      onShutdown();
      return;
    }
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, onShutdown]);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-3xl flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300">
        
        {/* Glowing Warning Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-rose-500 blur-[60px] opacity-20 animate-pulse" />
          <div className="relative bg-zinc-900 border border-rose-500/30 p-8 rounded-full shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]">
            <ShieldAlert className="text-rose-500 animate-bounce" size={48} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
            Mainframe Idle Detection
          </h2>
          <p className="text-zinc-500 font-bold tracking-widest text-[10px] uppercase">
            No Life Signs detected for 15 minutes. Hibernate sequence engaged.
          </p>
        </div>

        {/* Big Countdown */}
        <div className="py-10 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 shadow-inner">
            <div className="text-8xl font-black italic text-white tabular-nums tracking-tighter">
                {countdown.toString().padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-fuchsia-400 font-black text-[10px] tracking-[0.4em] uppercase">
                <Loader2 size={12} className="animate-spin" />
                Snapshotting Session...
            </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onAction}
            className="w-full py-5 bg-white text-black font-black uppercase tracking-widest hover:bg-fuchsia-500 hover:text-white transition-all rounded-2xl shadow-xl shadow-fuchsia-500/10"
          >
            I am still here
          </button>
          <button 
            onClick={onShutdown}
            className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] hover:text-rose-500 transition-colors"
          >
            Power Down Immediately
          </button>
        </div>

        <p className="text-zinc-700 text-[9px] font-medium italic">
          Progress will be persisted to the Nexus Cloud Node.
        </p>
      </div>
    </div>
  );
}