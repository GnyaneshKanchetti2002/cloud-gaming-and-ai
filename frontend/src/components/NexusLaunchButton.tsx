"use client";
import { useState } from "react";

interface NexusLaunchProps {
  tailscaleIp: string;
  tierId: string; // 'esports', 'aaa', 'ultra'
  resolution?: string; // '1080', '1440', '4K'
  fps?: number; // 60, 120
  bitrate?: number; // 15000
  appName?: string;
  className?: string;
}

export default function NexusLaunchButton({
  tailscaleIp,
  tierId,
  resolution = "1080",
  fps = 60,
  bitrate = 15000,
  appName = "Playnite",
  className = ""
}: NexusLaunchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    if (isLoading) return; // Prevent double billing
    setIsLoading(true);
    setError(null);

    try {
      // 1. Hit the Python API to deduct credits and stringently generate token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/generate-nexus-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tier_id: tierId })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Transaction failed");
      }

      const data = await response.json();
      const token = data.token;

      // 2. Format the protocol link and execute the Operating System intent
      const nexusLink = `nexusgp://play?ip=${tailscaleIp}&res=${resolution}&fps=${fps}&bitrate=${bitrate}&token=${token}&app=${appName}`;
      
      window.location.assign(nexusLink);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to ignite platform");
      setIsLoading(false); // Only allow retry if it definitively failed
    } 
    // If it succeeds, the OS catches the link. We keep isLoading = true to prevent re-clicks.
  };

  return (
    <div className="flex flex-col items-center">
      <button 
        className={`px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-rose-500 hover:from-fuchsia-500 hover:to-rose-400 text-white rounded-xl font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all transform active:scale-95 ${isLoading ? "opacity-50 cursor-not-allowed saturate-0" : ""} ${className}`}
        onClick={handleLaunch}
        disabled={isLoading}
      >
        {isLoading ? "Deducting Credits..." : "Ignite Compute Node"}
      </button>
      {error && <p className="text-rose-500 text-sm mt-3 font-semibold bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20">{error}</p>}
    </div>
  );
}
