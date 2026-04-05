'use client';
import { useRouter } from 'next/navigation';
import { X, Shield } from 'lucide-react';

export default function PlayPage() {
  const router = useRouter();
  const maskedUrl = "/api/stream-proxy";

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-[9999]">
      {/* Header Bar */}
      <div className="h-12 bg-zinc-950 border-b border-fuchsia-900/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
            <span className="text-fuchsia-400 font-mono text-[9px] uppercase tracking-[0.3em]">Neural Link: Stable</span>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/gaming/stream')}
          className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-3 py-1 rounded border border-rose-500/30 transition-all text-[10px] font-bold uppercase"
        >
          <X size={12} className="inline mr-1" /> Terminate
        </button>
      </div>

      {/* The Iframe Section */}
      <div className="flex-1 bg-zinc-900">
        <iframe 
          src={maskedUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; pointer-lock; gamepad"
          title="Liquid Compute Stream"
        />
      </div>
    </div>
  );
}