"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, Zap, Loader2, StopCircle, LogOut, Wifi, Monitor, Layers, X } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function GamingDashboard() {
  const [instances, setInstances] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [walletSeconds, setWalletSeconds] = useState<number>(0);
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  
  // Feature 2: UI States
  const [heroImage, setHeroImage] = useState("https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPlatformModal, setShowPlatformModal] = useState(false);

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
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
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
        const totalSeconds = Math.floor((data.balance_hours || 0) * 3600);
        setWalletSeconds(totalSeconds);
        setIsWalletLoaded(true);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const authenticate = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { 
          headers: getAuthHeaders(),
          credentials: 'include' 
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        const activeUser = await res.json();
        setUser(activeUser);
        fetchInstances(activeUser.id);
        fetchWallet(activeUser.id);
      } catch (e) { router.push('/login'); }
    };
    authenticate();
    const interval = setInterval(() => {
      if (user?.id) fetchInstances(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, router]);

  const activeGame = instances.find(i => i.status !== 'terminated' && i.status !== 'destroying');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeGame?.status === 'running' && walletSeconds > 0) {
      interval = setInterval(() => {
        setWalletSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame?.status, walletSeconds]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const time = formatTime(walletSeconds);

  const initiateLaunch = (game: any) => {
    setSelectedGame(game);
    setShowPlatformModal(true);
  };

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
          launcher: platform // NEW: Passing selected platform to backend
        })
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setLaunchingGame(null), 1000); }
  };

  const handleKill = async (instanceId: number) => {
    try {
      await fetch(`${API_BASE_URL}/proxmox/kill/${instanceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Platform Selection Modal */}
      {showPlatformModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic text-white uppercase tracking-widest">Select Platform</h3>
              <button onClick={() => setShowPlatformModal(false)}><X className="text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="grid gap-3">
              {['Steam', 'Epic Games', 'Battle.net'].map(platform => (
                <button 
                  key={platform} 
                  onClick={() => handleLaunch(platform)}
                  className="w-full py-4 bg-zinc-800/50 hover:bg-fuchsia-600 rounded-2xl font-bold uppercase tracking-widest transition-all text-xs border border-zinc-800 hover:border-white/20 group flex justify-between px-6 items-center"
                >
                  {platform}
                  <Zap size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Section */}
      <div className="flex flex-col xl:flex-row gap-8 items-start mt-12">
        <div className="flex-1 space-y-2 w-full">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-wide text-white uppercase">
            WELCOME BACK <span className="text-fuchsia-400">{user?.username || 'PLAYER_ONE'}</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">READY TO RE-ENTER THE MAINFRAME?</p>
        </div>

        {/* WALLET UI */}
        <div className="w-full xl:w-auto relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/5 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-8 h-full">
            <div>
              <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-2 flex items-center">
                <Clock className={`w-3 h-3 mr-2 ${activeGame?.status === 'running' ? 'text-rose-500 animate-pulse' : 'text-fuchsia-400'}`} />
                {activeGame?.status === 'running' ? 'Draining System Credits' : 'Wallet Time Remaining'}
              </h3>
              <div className="flex items-baseline space-x-2 font-mono">
                {isWalletLoaded ? (
                  <span className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                    {time.hours}<span className={`mx-1 ${activeGame?.status === 'running' ? 'text-rose-500 animate-pulse' : 'text-zinc-600'}`}>:</span>
                    {time.minutes}<span className="text-2xl ml-1 text-zinc-700">:{time.seconds}</span>
                  </span>
                ) : <Loader2 className="animate-spin text-zinc-600" />}
                {isWalletLoaded && <span className="text-lg text-zinc-600 font-bold uppercase tracking-widest">Hrs</span>}
              </div>
            </div>
            <button className="px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold tracking-wider uppercase text-sm border border-zinc-700 transition-all flex items-center">
              <Zap className="w-4 h-4 mr-2 text-rose-400 fill-rose-400" /> Add Time
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Hero Section */}
      <div className="relative h-[55vh] min-h-[450px] rounded-[3rem] overflow-hidden group border border-zinc-800/80 shadow-2xl">
        <div 
          className="absolute inset-0 transition-all duration-1000 ease-in-out scale-105 group-hover:scale-100" 
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Live Telemetry Overlay */}
        <div className="absolute top-8 right-8 flex items-center space-x-4 bg-black/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-zinc-800/50 z-30">
          <div className="flex items-center space-x-2 border-r border-zinc-800 pr-4">
            <Wifi size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">14ms Latency</span>
          </div>
          <div className="flex items-center space-x-2">
            <Monitor size={14} className="text-fuchsia-400" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">4K Ultra // 120 FPS</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 p-12 z-20 w-full flex flex-col md:flex-row items-end justify-between">
          <div className="max-w-2xl">
            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-4 drop-shadow-2xl uppercase">
              {activeGame ? activeGame.node_name.split('-')[1] : selectedGame?.title || 'System Ready'}
            </h2>
            <p className="text-zinc-300 text-lg font-medium tracking-wide border-l-2 border-fuchsia-500 pl-4 max-w-md">
               {activeGame?.status === 'running' ? 'Matrix Stabilized. Simulation active.' : 'Select a simulation to initiate neural link.'}
            </p>
          </div>
          
          {activeGame ? (
            <button onClick={() => handleKill(activeGame.id)} className="px-12 py-6 rounded-2xl bg-rose-900/50 text-rose-500 font-black text-xl tracking-widest uppercase border-2 border-rose-500/50 hover:bg-rose-600 hover:text-white transition-all">
              KILL SESSION
            </button>
          ) : (
            <button 
              disabled={!selectedGame || walletSeconds <= 0}
              onClick={() => initiateLaunch(selectedGame)}
              className="px-12 py-6 rounded-2xl bg-fuchsia-600 text-white font-black text-xl tracking-widest uppercase shadow-[0_0_40px_rgba(217,70,239,0.5)] hover:bg-fuchsia-500 transition-all disabled:opacity-50"
            >
              LAUNCH
            </button>
          )}
        </div>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { title: "Cyberpunk 2077", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg" },
          { title: "Elden Ring", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co4jni.jpg" },
          { title: "Alan Wake II", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ebd.jpg" },
          { title: "Starfield", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ngy.jpg" },
          { title: "Red Dead 2", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co1q1f.jpg" }
        ].map((game, i) => (
          <div key={i} 
            onMouseEnter={() => {setHeroImage(game.img); setSelectedGame(game);}}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-zinc-800 transition-all hover:border-fuchsia-500/50 hover:-translate-y-2 shadow-xl"
          >
            <img src={game.img} className="absolute inset-0 object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-white font-black italic uppercase text-[10px] tracking-widest">{game.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}