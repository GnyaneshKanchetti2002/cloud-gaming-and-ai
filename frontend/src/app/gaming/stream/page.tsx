// frontend/src/app/gaming/stream/page.tsx
'use client'; // Required if using onClick handlers in Next.js App Router

export default function StreamPage() {
  const streamUrl = "https://desktop-d824dd9.tailb6e984.ts.net"; 

  const handleLaunch = () => {
    // Opens the stream in a clean, new tab without iframe restrictions
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      
      {/* Stream Container / Launch Pad */}
      <div className="w-full max-w-6xl aspect-video bg-gray-900 flex flex-col items-center justify-center rounded-xl border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        <h2 className="text-3xl font-bold text-white mb-4 tracking-widest">READY TO STREAM</h2>
        <p className="text-gray-400 mb-8 max-w-md text-center">
          For the lowest latency and full keyboard/mouse capture, the stream will open in an isolated secure window.
        </p>
        
        <button 
          onClick={handleLaunch}
          className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
        >
          LAUNCH DESKTOP
        </button>
      </div>
      
      {/* Telemetry & Status UI */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl text-center">
        <div className="p-4 bg-gray-900 rounded-lg border border-cyan-800 flex flex-col justify-center">
          <p className="text-gray-400 text-xs uppercase mb-1">Bridge Status</p>
          <p className="text-cyan-400 font-mono text-sm flex items-center justify-center gap-2">
            <span className="animate-pulse text-green-500">●</span> HYD-TO-VJY SECURE DIRECT
          </p>
        </div>

        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col justify-center">
          <h1 className="text-xl font-bold text-white tracking-widest uppercase">
            Intel Iris Xe Host
          </h1>
          <p className="text-gray-400 text-xs uppercase mt-1">Liquid Compute Node</p>
        </div>

        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col justify-center">
          <p className="text-gray-400 text-xs uppercase mb-1">Target Framerate</p>
          <p className="text-white font-mono">60 FPS</p>
        </div>
      </div>
    </div>
  );
}