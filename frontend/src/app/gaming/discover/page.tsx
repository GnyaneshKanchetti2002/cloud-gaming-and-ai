"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Zap, Loader2, Search, X, Play, Monitor, Globe } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function DiscoverPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState(""); // Tracks the currently active search
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [user, setUser] = useState<any>(null);
  
  // Platform Modal States
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [launching, setLaunching] = useState(false);

  const router = useRouter();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };
  };

  useEffect(() => {
    // Authenticate user so we can pass their ID to the provision endpoint
    const authenticate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        if (res.ok) setUser(await res.json());
      } catch (e) { console.error("Auth failed on discover page"); }
    };
    authenticate();
  }, []);

  // --- INFINITE SCROLL OBSERVER ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastGameElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // When the last element intersects the viewport, load the next page
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + 20);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // --- DATA FETCHING LOGIC ---
  const fetchGamesData = async (currentOffset: number, query: string, isReset: boolean) => {
    if (isReset) setLoading(true);
    else setLoadingMore(true);

    try {
      const url = query
        ? `${API_BASE_URL}/games/search?q=${query}&offset=${currentOffset}&limit=20`
        : `${API_BASE_URL}/games/trending?offset=${currentOffset}&limit=20`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // If Twitch returns nothing, we've hit the end of the catalog
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setGames(prev => isReset ? data : [...prev, ...data]);
          if (data.length < 20) setHasMore(false); // Less than 20 means it's the last page
        }
      }
    } catch (e) {
      console.error("Fetch failed", e);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  // Trigger when a new search is initiated (resets grid)
  useEffect(() => {
    fetchGamesData(0, activeQuery, true);
  }, [activeQuery]);

  // Trigger when scrolling hits the bottom (appends to grid)
  useEffect(() => {
    if (offset > 0) {
      fetchGamesData(offset, activeQuery, false);
    }
  }, [offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setHasMore(true);
    setActiveQuery(searchQuery); // Lock in the new search term
  };

  const openLaunchModal = (game: any) => {
    setSelectedGame(game);
    setShowPlatformModal(true);
  };

  const handleSmartLaunch = async (platform: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setLaunching(true);
    
    try {
      // 1. Clean the game name to create a valid Proxmox Node Name (no spaces/special chars)
      const cleanName = selectedGame.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const nodeName = `Cloud-${cleanName}-${Math.floor(Math.random() * 1000)}`;

      // 2. Fire the Provision Request to Phase 2 Backend
      await fetch(`${API_BASE_URL}/proxmox/provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          node_name: nodeName,
          vram_allocation: 12,
          os_template: "WINDOWS_11_GAMER",
          user_id: user.id,
          launcher: platform // Passing the smart launch platform!
        })
      });

      // 3. Redirect back to the library to watch the VM boot
      router.push('/gaming');
      
    } catch (error) {
      console.error("Failed to launch node:", error);
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 relative animate-in fade-in duration-700">
      
      {/* GLOWING PLATFORM MODAL */}
      {showPlatformModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-[2rem] w-full max-w-xl animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
            {/* Modal Background Glow based on game cover */}
            <div 
                className="absolute inset-0 opacity-20 blur-3xl scale-150 pointer-events-none"
                style={{ backgroundImage: `url(${selectedGame?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg line-clamp-1">
                        {selectedGame?.name}
                    </h3>
                    <p className="text-zinc-400 font-bold tracking-widest text-xs mt-1">SELECT INJECTION VECTOR</p>
                </div>
                <button disabled={launching} onClick={() => setShowPlatformModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50">
                    <X className="text-zinc-400 hover:text-white" />
                </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                {/* STEAM (Blue Glow) */}
                <button 
                    onClick={() => handleSmartLaunch('Steam')}
                    disabled={launching}
                    className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all overflow-hidden border border-zinc-800 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-[inset_0_0_50px_rgba(59,130,246,0.2)]" />
                    <span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                        {launching ? <Loader2 className="animate-spin" size={18} /> : <Monitor size={18} />} STEAM
                    </span>
                </button>

                {/* EPIC GAMES (White Glow) */}
                <button 
                    onClick={() => handleSmartLaunch('Epic Games')}
                    disabled={launching}
                    className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all overflow-hidden border border-zinc-800 hover:border-zinc-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-[inset_0_0_50px_rgba(255,255,255,0.1)]" />
                    <span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                        {launching ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />} EPIC GAMES
                    </span>
                </button>

                {/* GOG (Purple Glow) */}
                <button 
                    onClick={() => handleSmartLaunch('GOG')}
                    disabled={launching}
                    className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all overflow-hidden border border-zinc-800 hover:border-fuchsia-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-fuchsia-500/0 group-hover:bg-fuchsia-500/10 transition-colors" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-[inset_0_0_50px_rgba(217,70,239,0.2)]" />
                    <span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-fuchsia-400 group-hover:drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">
                        {launching ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} GOG GALAXY
                    </span>
                </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg flex items-center">
            <Compass className="mr-4 text-fuchsia-500" size={36} />
            DISCOVERY MATRIX
          </h1>
          <p className="text-zinc-400 font-bold tracking-[0.2em] text-xs mt-2 uppercase">Live IGDB Feed // Global Node Activity</p>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-96 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-fuchsia-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all font-medium tracking-wide shadow-inner"
            placeholder="Search the infinite catalog..."
          />
        </form>
      </div>

      {/* Grid Rendering */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" />
          <span className="text-zinc-600 font-black uppercase tracking-widest text-sm">Syncing with Twitch Datastore...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {games.map((game, i) => {
              // Identify the very last element in the array to attach the tripwire
              const isLastElement = games.length === i + 1;
              
              return (
                <div 
                  key={`${game.id}-${i}`} 
                  ref={isLastElement ? lastGameElementRef : null}
                  onClick={() => openLaunchModal(game)}
                  className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border border-zinc-800/80 transition-all duration-500 hover:border-fuchsia-500 hover:-translate-y-2 shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(217,70,239,0.3)]"
                >
                  {game.cover_url ? (
                      <img src={game.cover_url} alt={game.name} className="absolute inset-0 object-cover w-full h-full transform group-hover:scale-110 grayscale group-hover:grayscale-0 transition-all duration-700 ease-out" />
                  ) : (
                      <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-700 font-black">NO SIGNAL</div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute bottom-0 left-0 p-5 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-black italic uppercase text-sm tracking-widest leading-tight line-clamp-2 drop-shadow-md">
                        {game.name}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 mt-3">
                        <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded border border-fuchsia-500/20">
                            {game.rating ? `${Math.round(game.rating)} CRITIC` : 'UNRATED'}
                        </span>
                        <span className="text-white text-[10px] font-black tracking-widest flex items-center gap-1">
                            STREAM <Play size={10} className="fill-white" />
                        </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Loading Indicator for Pagination */}
          {loadingMore && (
            <div className="flex justify-center items-center py-12">
               <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}