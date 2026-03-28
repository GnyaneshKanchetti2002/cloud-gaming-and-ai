"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, Zap, Loader2, StopCircle } from 'lucide-react';

interface InstanceRecord {
  id: number;
  node_name: string;
  status: string;
  os_template: string;
}

export default function GamingDashboard() {
  const [instances, setInstances] = useState<InstanceRecord[]>([]);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // --- THE FIX: Helper to grab the token for all API requests ---
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // This proves to FastAPI who you are
    };
  };

  const fetchInstances = async (userId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com";
      const res = await fetch(`${baseUrl}/api/proxmox/instances/${userId}`, { 
        headers: getAuthHeaders(), // <-- Applied here
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (e) {
      console.error("Failed to fetch instances", e);
    }
  };

  useEffect(() => {
    const authenticate = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com";
      const token = localStorage.getItem('token');
      
      // If there is no token in storage, kick them out immediately
      if (!token) {
          router.push('/login');
          return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/auth/me`, { 
          headers: getAuthHeaders(), // <-- Applied here
          credentials: 'include' 
        });
        
        if (!res.ok) {
          // Token is invalid or expired. Destroy it and kick them out.
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        const activeUser = await res.json();
        setUser(activeUser);
        fetchInstances(activeUser.id);
      } catch (e) {
        router.push('/login');
      }
    };
    
    authenticate();

    const interval = setInterval(() => {
      if (user?.id) fetchInstances(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, router]);

  const handleLaunch = async (gameTitle: string) => {
    setLaunchingGame(gameTitle);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com";
      await fetch(`${baseUrl}/api/proxmox/provision`, {
        method: "POST",
        headers: getAuthHeaders(), // <-- Applied here
        credentials: "include",
        body: JSON.stringify({
          node_name: `Gamer-Node-${Math.floor(Math.random() * 1000)}`,
          vram_allocation: 12,
          os_template: "WINDOWS_11_GAMER",
          user_id: user?.id
        })
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLaunchingGame(null), 1000);
    }
  };

  const handleKill = async (instanceId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com";
      await fetch(`${baseUrl}/api/proxmox/kill/${instanceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(), // <-- Applied here
        credentials: "include"
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  const activeGame = instances.find(i => i.status !== 'terminated' && i.status !== 'destroying');

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      
      {/* Top Welcome & Digital Wallet */}
      <div className="flex flex-col xl:flex-row gap-8 items-start mt-12">
        <div className="flex-1 space-y-2">
          <h1 className="text-4xl font-black italic tracking-wide text-white drop-shadow-md">
            WELCOME BACK <span className="text-fuchsia-400">PLAYER_ONE</span>
          </h1>
          <p className="text-zinc-400 font-medium tracking-wide">Ready to re-enter the mainframe?</p>
        </div>

        <div className="w-full xl:w-auto relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/5 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-8 h-full">
            <div>
              <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-2 flex items-center">
                <Clock className="w-3 h-3 mr-2 text-fuchsia-400" />
                Wallet Time Remaining
              </h3>
              <div className="flex items-baseline space-x-3 font-mono">
                <span className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                  42<span className="text-3xl text-zinc-600 mx-1 animate-pulse">:</span>18
                </span>
                <span className="text-lg md:text-xl text-zinc-600 font-bold uppercase tracking-widest">Hrs</span>
              </div>
            </div>
            
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold tracking-wider uppercase text-sm shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] border border-zinc-700 hover:border-fuchsia-500/50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 mr-2 text-rose-400 fill-rose-400" />
              Add Time
            </button>
          </div>
        </div>
      </div>

      {/* Hero Game (Active Session Tracker) */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[550px] rounded-[2rem] overflow-hidden group cursor-pointer border border-zinc-800/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
        
        <div className="absolute inset-0 bg-zinc-950">
          <div className="w-full h-full bg-[linear-gradient(45deg,#000_25%,transparent_25%),linear-gradient(-45deg,#000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#000_75%),linear-gradient(-45deg,transparent_75%,#000_75%)] bg-[size:3px_3px] opacity-20 pointer-events-none mix-blend-overlay z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          
          <div className={`absolute inset-0 bg-gradient-to-br from-yellow-600/30 via-rose-600/20 to-indigo-600/30 object-cover scale-105 transition-transform duration-1000 ${activeGame ? 'animate-pulse' : 'group-hover:scale-100'}`} />
          <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-yellow-500/10 blur-[120px] rounded-full mix-blend-screen mix-blend-color-dodge transition-all duration-1000 group-hover:bg-yellow-400/20" />
        </div>

        <div className="absolute bottom-0 left-0 p-8 md:p-14 z-20 w-full flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="max-w-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            {activeGame ? (
             <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur border border-emerald-500/30 text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
                ACTIVE PROXMOX SESSION [{activeGame.status.toUpperCase()}]
              </div>
            ) : (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-yellow-500/10 backdrop-blur border border-yellow-500/30 text-yellow-500 text-[10px] font-black tracking-[0.3em] uppercase mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)]"></span>
                  Last Played
                </div>
            )}
            <h2 className="text-6xl md:text-8xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300 mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] filter">
              {activeGame ? activeGame.node_name.replace('Cloud-', '').replace('-Save', '') : 'NIGHT CITY EDGE'}
            </h2>
            <p className="text-zinc-300 text-lg/relaxed max-w-lg font-medium tracking-wide drop-shadow-md border-l-2 border-yellow-500 pl-4">
               {activeGame?.status === 'provisioning' || activeGame?.status === 'pending' ? 'Booting Windows 11 Image. Injecting Moonlight Config...' 
                : activeGame?.status === 'running' ? 'Server Connected. RTX Overdrive engaged. 0ms Latency pending...'
                : 'Overdrive termination in progress. Syncing save blobs...'}
            </p>
          </div>
          
          {activeGame ? (
             <button 
             onClick={() => handleKill(activeGame.id)}
             className="w-full md:w-auto px-12 py-6 rounded-2xl bg-red-900/50 text-red-500 font-black text-xl tracking-widest uppercase shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] border-2 border-red-500/50 hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center justify-center shrink-0">
               <StopCircle className="w-8 h-8 mr-3" />
               KILL SESSION
             </button>
          ) : (
            <button 
              onClick={() => handleLaunch("NIGHT CITY EDGE")}
              disabled={launchingGame !== null}
              className="w-full md:w-auto px-12 py-6 rounded-2xl bg-yellow-500 text-black font-black text-xl tracking-widest uppercase shadow-[0_0_40px_-10px_rgba(234,179,8,0.8)] border-2 border-yellow-400 group-hover:border-white transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center justify-center shrink-0 hover:bg-yellow-400 relative overflow-hidden group/btn">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-out"></div>
              {launchingGame === "NIGHT CITY EDGE" ? <Loader2 className="w-8 h-8 mr-3 animate-spin stroke-black" /> : <Play className="w-8 h-8 mr-3 fill-black" />}
              {launchingGame === "NIGHT CITY EDGE" ? "Connecting..." : "Launch"}
            </button>
          )}
        </div>
      </div>

      {/* Library Grid Area */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-black italic tracking-widest text-white flex items-center uppercase">
            <span className="w-1.5 h-8 bg-gradient-to-b from-fuchsia-500 to-rose-500 mr-4 shadow-[0_0_10px_rgba(217,70,239,0.8)] skew-x-[-15deg]"></span>
            Ready to Play
          </h2>
          <button className="text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors py-2 px-4 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800">Browse Full Catalog</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
          {[
            { title: "Elden Ring", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co4jni.jpg" },
            { title: "Cyberpunk 2077", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co2mvt.jpg" },
            { title: "Alan Wake II", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ebd.jpg" },
            { title: "Red Dead Redemption 2", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co1q1f.jpg" },
            { title: "Starfield", img: "https://images.igdb.com/igdb/image/upload/t_1080p/co6ngy.jpg" }
          ].map((game, i) => (
            <div key={i} className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-400 transition-all duration-500 shadow-xl hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.8)] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10 opacity-90 group-hover:opacity-70 transition-opacity" />
              
              <div 
                className={`absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out z-0`}
                style={{ backgroundImage: `url(${game.img})` }} 
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${i%2 === 0 ? 'from-fuchsia-600/20 to-blue-600/10' : 'from-rose-600/20 to-orange-600/10'} mix-blend-overlay z-0`} />
              
              <div className="absolute bottom-0 left-0 p-5 z-20 w-full transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <h3 className="text-xl font-bold text-white leading-tight mb-2 tracking-wide border-l-2 border-fuchsia-500 pl-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {game.title}
                </h3>
                <button 
                  disabled={activeGame !== undefined}
                  onClick={() => handleLaunch(game.title)}
                  className={`flex items-center text-xs font-black text-fuchsia-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 bg-fuchsia-500/10 px-3 py-2 rounded-lg border border-fuchsia-500/30 backdrop-blur w-full justify-center mt-3 hover:bg-fuchsia-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(0,0,0,0.5)]`}
                >
                  {launchingGame === game.title ? <Loader2 className="w-3 h-3 mr-2 animate-spin stroke-current" /> : <Play className="w-3 h-3 mr-2 fill-current" />} Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}