// frontend/src/app/gaming/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, Zap, Loader2, StopCircle, LogOut, Wifi, Monitor, Layers, X } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import NodeHealthCard from '@/components/NodeHealthCard';

// NEW IMPORTS
import { useIdleTimer } from '@/hooks/useIdleTimer';
import IdleOverlay from '@/components/IdleOverlay';

export default function GamingDashboard() {
  const [instances, setInstances] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [walletSeconds, setWalletSeconds] = useState<number>(0);
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  
  const [heroImage, setHeroImage] = useState("https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg");
  const [selectedGame, setSelectedGame] = useState<any>({ title: "Cyberpunk 2077", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg" });
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  // IDLE MANAGEMENT STATE
  const isIdle = useIdleTimer(15); // 15 Minute Timeout
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const router = useRouter();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };
  };

  const fetchInstances = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/proxmox/instances/${userId}`, { 
        headers: getAuthHeaders(),
        credentials: 'include' 
      });
      if (res.ok) setInstances(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchWallet = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/wallet/${userId}`, { 
        headers: getAuthHeaders(),
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setWalletSeconds(Math.floor((data.balance_hours || 0) * 3600));
        setIsWalletLoaded(true);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const authenticate = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders(), credentials: 'include' });
        if (!res.ok) { localStorage.removeItem('token'); router.push('/login'); return; }
        const activeUser = await res.json();
        setUser(activeUser);
        fetchInstances(activeUser.id);
        fetchWallet(activeUser.id);
      } catch (e) { router.push('/login'); }
    };
    authenticate();
    const interval = setInterval(() => { if (user?.id) fetchInstances(user.id); }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, router]);

  const activeGame = instances.find(i => i.status !== 'terminated' && i.status !== 'destroying');

  // TRIGGER IDLE OVERLAY
  useEffect(() => {
    if (isIdle && activeGame?.status === 'running') {
      setShowIdleWarning(true);
    } else {
      setShowIdleWarning(false);
    }
  }, [isIdle, activeGame]);

  const handleIdleShutdown = async () => {
    if (activeGame) {
      try {
        await fetch(`${API_BASE_URL}/proxmox/idle-shutdown/${activeGame.id}`, { 
          method: "POST", 
          headers: getAuthHeaders() 
        });
        fetchInstances(user.id);
      } catch (e) { console.error(e); }
    }
    setShowIdleWarning(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeGame?.status === 'running' && walletSeconds > 0) {
      interval = setInterval(() => setWalletSeconds((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame?.status, walletSeconds]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { h: h.toString().padStart(2, '0'), m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') };
  };

  const time = formatTime(walletSeconds);

  const handleLaunch = async (platform: string) => {
    setShowPlatformModal(false);
    setLaunchingGame(selectedGame.title);
    try {
      await fetch(`${API_BASE_URL}/proxmox/provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          node_name: `Cloud-${selectedGame.title.split(' ')[0]}-${Math.floor(Math.random() * 1000)}`,
          vram_allocation: 12,
          os_template: "WINDOWS_11_GAMER",
          user_id: user?.id,
          launcher: platform
        })
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setLaunchingGame(null), 1000); }
  };

  const handleKill = async (instanceId: number) => {
    try {
      await fetch(`${API_BASE_URL}/proxmox/kill/${instanceId}`, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" });
      if (user?.id) fetchInstances(user.id);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6 lg:px-8 relative animate-in fade-in duration-700">
      
      {/* IDLE SENTINEL OVERLAY */}
      {showIdleWarning && (
        <IdleOverlay 
            onAction={() => setShowIdleWarning(false)} 
            onShutdown={handleIdleShutdown} 
        />
      )}

      {/* Platform Launch Modal */}
      {showPlatformModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic text-white uppercase tracking-widest">Select Platform</h3>
              <button onClick={() => setShowPlatformModal(false)}><X className="text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="grid gap-3">
              {['Steam', 'Epic Games', 'Battle.net'].map(platform => (
                <button key={platform} onClick={() => handleLaunch(platform)} className="w-full py-4 bg-zinc-800/50 hover:bg-fuchsia-600 rounded-2xl font-bold uppercase tracking-widest transition-all text-xs border border-zinc-800 flex justify-between px-6 items-center">
                  {platform} <Zap size={14} className="text-white/40" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOP SECTION with NODE HEALTH CARD */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-center mt-12">
        <div className="xl:col-span-2 space-y-2">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase">
            WELCOME BACK <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400">{user?.username || 'PLAYER_ONE'}</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-[0.4em] uppercase text-xs">READY TO RE-ENTER THE MAINFRAME?</p>
        </div>
        <div className="xl:col-span-1">
          <NodeHealthCard />
        </div>
      </div>

      {/* WALLET & HERO SECTION */}
      <div className="flex flex-col gap-12">
        {/* Wallet Block */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 group shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 h-full">
            <div>
              <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-3 flex items-center">
                <Clock className={`w-3 h-3 mr-2 ${activeGame?.status === 'running' ? 'text-rose-500 animate-pulse' : 'text-fuchsia-400'}`} />
                System Balance
              </h3>
              <div className="flex items-baseline space-x-2 font-mono">
                <span className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                  {time.h}<span className={`${activeGame?.status === 'running' ? 'text-rose-500 animate-pulse' : 'text-zinc-600'}`}>:</span>{time.m}<span className="text-2xl ml-1 text-zinc-700">:{time.s}</span>
                </span>
                <span className="text-lg text-zinc-600 font-bold uppercase tracking-widest">Hrs</span>
              </div>
            </div>
            
            {/* UPDATED: Route to Pricing Page */}
            <button 
              onClick={() => router.push('/gaming/pricing')} 
              className="px-10 py-5 rounded-2xl bg-zinc-800 hover:bg-fuchsia-600 text-white font-black tracking-widest uppercase text-xs transition-all flex items-center group"
            >
              <Zap className="w-4 h-4 mr-2 text-rose-400 group-hover:text-white transition-colors" /> Add System Credits
            </button>

          </div>
        </div>

        {/* Hero Section */}
        <div className="relative h-[50vh] min-h-[400px] rounded-[3rem] overflow-hidden border border-zinc-800/80 shadow-2xl">
          <div className="absolute inset-0" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-12 z-20 w-full flex flex-col md:flex-row items-end justify-between">
            <div className="max-w-2xl">
              <h2 className="text-6xl font-black italic tracking-tighter text-white mb-2 uppercase drop-shadow-2xl">{activeGame ? activeGame.node_name.split('-')[1] : selectedGame?.title || 'System Ready'}</h2>
              <p className="text-zinc-300 font-bold tracking-widest text-xs uppercase border-l-2 border-fuchsia-500 pl-4">{activeGame?.status === 'running' ? 'Simulation active.' : 'Neural link ready.'}</p>
            </div>
            {activeGame ? (
              <button onClick={() => handleKill(activeGame.id)} className="px-12 py-6 rounded-2xl bg-rose-900/50 text-rose-500 font-black tracking-widest uppercase border-2 border-rose-500/50 hover:bg-rose-600 hover:text-white transition-all">KILL SESSION</button>
            ) : (
              <button disabled={!selectedGame || walletSeconds <= 0} onClick={() => setShowPlatformModal(true)} className="px-12 py-6 rounded-2xl bg-fuchsia-600 text-white font-black tracking-widest uppercase shadow-[0_0_40px_rgba(217,70,239,0.5)] hover:bg-fuchsia-500 transition-all disabled:opacity-30">LAUNCH</button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { title: "Cyberpunk 2077", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg" },
          { title: "Elden Ring", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co4jni.jpg" },
          { title: "Alan Wake II", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ebd.jpg" },
          { title: "Starfield", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ngy.jpg" },
          { title: "Red Dead 2", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co1q1f.jpg" }
        ].map((game, i) => (
          <div key={i} onMouseEnter={() => {setHeroImage(game.img); setSelectedGame(game);}} className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-zinc-800 transition-all hover:border-fuchsia-500/50 hover:-translate-y-2 shadow-xl">
            <img src={game.img} className="absolute inset-0 object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" alt={game.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
            <div className="absolute bottom-4 left-4"><p className="text-white font-black italic uppercase text-[10px] tracking-widest">{game.title}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}