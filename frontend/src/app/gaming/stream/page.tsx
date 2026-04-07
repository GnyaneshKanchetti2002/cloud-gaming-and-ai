'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Monitor, Wifi, Zap, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function StreamPage() {
  const router = useRouter();
  const [isLaunched, setIsLaunched] = useState(false);

  // NOTE: In production, these would be fetched from your backend/Zustand store
  // based on the node assigned to the user.
  const nodeIp = "100.x.y.z"; // User's Tailscale IP for the assigned Spectre
  const moonlightPin = "1234"; // The pairing PIN generated for this session

  const handleLaunch = () => {
    // 1. Construct the Protocol URL
    // This triggers the native NexusGP/Moonlight client via the OS
    const protocolUrl = `nexusgp://connect?ip=${nodeIp}&pin=${moonlightPin}&mode=esports`;

    // 2. Trigger the Native Launcher
    window.location.href = protocolUrl;

    // 3. Update UI state to show the link is active
    setIsLaunched(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 animate-in fade-in duration-1000">
      
      {/* Back to Dashboard */}
      <button 
        onClick={() => router.push('/gaming')}
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
      >
        <ArrowLeft size={16} /> Dashboard
      </button>

      {/* Launch Pad UI */}
      <div className="w-full max-w-5xl aspect-video bg-zinc-900/50 flex flex-col items-center justify-center rounded-[2rem] border border-fuchsia-500/30 shadow-[0_0_100px_rgba(217,70,239,0.1)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        
        <div className="relative z-10 text-center space-y-6 px-6">
          {!isLaunched ? (
            <>
              <div className="inline-block px-4 py-1 bg-fuchsia-500/10 rounded-full border border-fuchsia-500/20 mb-4">
                <p className="text-fuchsia-400 font-mono text-[10px] tracking-[0.4em] uppercase">Connection Ready</p>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase">
                Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400">Streaming</span>
              </h2>
              
              <p className="text-zinc-500 max-w-md mx-auto text-sm font-medium tracking-wide leading-relaxed">
                Your high-performance node is warmed up. Click below to initialize the secure native neural link.
              </p>
              
              <button 
                onClick={handleLaunch}
                className="group relative px-12 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_20px_40px_rgba(217,70,239,0.3)] hover:shadow-[0_20px_60px_rgba(217,70,239,0.5)] active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.2em] text-sm">
                  <ExternalLink size={18} /> Initialize Native Link
                </span>
              </button>
            </>
          ) : (
            <div className="animate-in zoom-in duration-500">
              <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Link Established</h2>
              <p className="text-zinc-500 mt-4 max-w-sm mx-auto text-sm">
                The NexusGP Native Client has been summoned. Your session is now encrypted via Tailscale.
              </p>
              <button 
                onClick={() => setIsLaunched(false)}
                className="mt-8 text-fuchsia-400 text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors"
              >
                Re-trigger Launcher
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Real-time Telemetry Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-2">
          <Wifi className="text-fuchsia-500 mb-2" size={20} />
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Signal Path</p>
          <p className="text-white font-mono text-xs uppercase tracking-tighter italic">NATIVE_PROTOCOL_V1</p>
        </div>

        <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-2">
          <Monitor className="text-fuchsia-500 mb-2" size={20} />
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Client Mode</p>
          <p className="text-white font-mono text-xs uppercase tracking-tighter italic">High-Performance Native</p>
        </div>

        <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-2">
          <Zap className="text-fuchsia-500 mb-2" size={20} />
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Latency Optim.</p>
          <p className="text-white font-mono text-xs uppercase tracking-tighter italic">Direct HW Acceleration</p>
        </div>
      </div>
    </div>
  );
}