'use client';
import { useRouter } from 'next/navigation';
import { X, Maximize2, ShieldCheck } from 'lucide-react';

export default function PlayPage() {
  const router = useRouter();

  // This is the masked proxy path defined in your next.config.js
  const maskedUrl = "/api/stream-proxy";

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-[999]">
      {/* Secure HUD Bar */}
      <div className="h-14 bg-zinc-950 border-b border-fuchsia-500/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 rounded-full border border-fuchsia-500/20">
            <ShieldCheck size={14} className="text-fuchsia-400" />
            <span className="text-fuchsia-400 font-mono text-[10px] tracking-[0.2em] uppercase">
              Secure Neural Link Active
            </span>
          </div>
          <div className="hidden md:block w-[2px] h-4 bg-zinc-800"></div>
          <span className="hidden md:block text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
            Node: Spectre_G1 // Latency: Optimized
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/gaming/stream')}
            className="group flex items-center gap-2 bg-rose-500/10 hover:bg-rose-600 px-4 py-1.5 rounded-lg border border-rose-500/30 transition-all"
          >
            <X size={14} className="text-rose-500 group-hover:text-white" />
            <span className="text-rose-500 group-hover:text-white text-[10px] font-black uppercase tracking-widest">
              Terminate
            </span>
          </button>
        </div>
      </div>

      {/* The Actual Game Engine (Masked Iframe) */}
      <div className="flex-1 relative bg-zinc-900">
        <iframe 
          src={maskedUrl}
          className="w-full h-full border-none"
          // Critical for cloud gaming input & performance
          allow="autoplay; fullscreen; pointer-lock; gamepad"
          title="Liquid Compute Stream"
        />
        
        {/* Anti-URL-Leak Overlay (Very subtle watermark) */}
        <div className="absolute top-4 right-4 pointer-events-none opacity-10">
          <p className="text-white font-mono text-[8px] rotate-90 origin-right">
            LIQUID_COMPUTE_SECURE_SESSION_{new Date().getTime()}
          </p>
        </div>
      </div>
    </div>
  );
}