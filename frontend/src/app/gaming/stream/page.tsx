// frontend/src/app/gaming/stream/page.tsx

export default function StreamPage() {
  const funnelUrl = "https://desktop-d824dd9.tailb6e984.ts.net/"; // Replace with your actual Funnel URL

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-6xl aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        <iframe
          src={funnelUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; clipboard-read; clipboard-write; gamepad"
          title="Aryan's Cloud Gaming Stream"
        />
      </div>
      
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
          Live: Intel Iris Xe Host
        </h1>
        <p className="text-cyan-400 font-mono text-sm mt-2">
          Status: <span className="animate-pulse">●</span> HYD-TO-VJY SECURE BRIDGE
        </p>
      </div>
    </div>
  );
}