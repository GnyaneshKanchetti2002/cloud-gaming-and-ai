// frontend/src/app/gaming/stream/page.tsx

export default function StreamPage() {
  // Using the direct MagicDNS URL with port 8080 to allow UDP video traffic
  const streamUrl = "https://desktop-d824dd9.tailb6e984.ts.net:8080"; 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      
      {/* Stream Container */}
      <div className="w-full max-w-6xl aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        <iframe
          src={streamUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; clipboard-read; clipboard-write; gamepad"
          title="Aryan's Cloud Gaming Stream"
        />
      </div>
      
      {/* Telemetry & Status UI */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl text-center">
        
        {/* Connection Status */}
        <div className="p-4 bg-gray-900 rounded-lg border border-cyan-800 flex flex-col justify-center">
          <p className="text-gray-400 text-xs uppercase mb-1">Bridge Status</p>
          <p className="text-cyan-400 font-mono text-sm flex items-center justify-center gap-2">
            <span className="animate-pulse text-green-500">●</span> HYD-TO-VJY SECURE DIRECT
          </p>
        </div>

        {/* Host Identity */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col justify-center">
          <h1 className="text-xl font-bold text-white tracking-widest uppercase">
            Intel Iris Xe Host
          </h1>
          <p className="text-gray-400 text-xs uppercase mt-1">Liquid Compute Node</p>
        </div>

        {/* Stream Metrics Placeholder */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col justify-center">
          <p className="text-gray-400 text-xs uppercase mb-1">Target Framerate</p>
          <p className="text-white font-mono">60 FPS</p>
        </div>

      </div>
    </div>
  );
}