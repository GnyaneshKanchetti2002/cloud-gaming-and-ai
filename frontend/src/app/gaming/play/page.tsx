'use client';
import { useRouter } from 'next/navigation';
import { X, Shield, Activity, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PlayPage() {
  const router = useRouter();
  const [loadError, setLoadError] = useState(false);
  const maskedUrl = "/api/stream-proxy";

  // Timeout to check if the stream actually loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadError(true);
    }, 8000); // If black for 8 seconds, show the helper
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-[9999]">
      {/* Top Controller Bar */}
      <div className="h-12 bg-zinc-950 border-b border-fuchsia-900/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_#d946ef]" />
            <span className="text-fuchsia-500 font-mono text-[9px] uppercase tracking-[0.3em]">
              Uplink: Active
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/gaming/stream')}
          className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-3 py-1 rounded border border-rose-500/30 transition-all text-[10px] font-bold uppercase"
        >
          <X size={12} /> Terminate
        </button>
      </div>

      {/* The Masked Stream Container */}
      <div className="flex-1 bg-zinc-900 relative flex items-center justify-center">
        
        {/* Loading / Error UI overlay */}
        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
            <AlertCircle className="text-fuchsia-500 mb-4" size={48} />
            <h3 className="text-white font-black uppercase tracking-widest mb-2">Security Handshake Delayed</h3>
            <p className="text-zinc-500 text-xs max-w-xs mb-6">
              Your browser may be blocking the secure iframe. Click below to open the direct encrypted tunnel.
            </p>
            <a 
              href="https://desktop-d824dd9.tailb6e984.ts.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              <ExternalLink size={14} /> Open Direct Tunnel
            </a>
          </div>
        )}

        <iframe 
          src={maskedUrl}
          className="w-full h-full border-none"
          // These allow the Iframe to bypass standard "Same-Origin" blocks
          allow="autoplay; fullscreen; pointer-lock; gamepad; clipboard-read; clipboard-write"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin"
          title="Liquid Compute Stream"
        />
        
        <div className="absolute bottom-6 left-6 pointer-events-none opacity-20 flex items-center gap-2">
          <Shield size={12} className="text-white" />
          <p className="text-white font-mono text-[8px] uppercase tracking-widest">Secure Iframe Gateway</p>
        </div>
      </div>
    </div>
  );
}