// frontend/src/app/gaming/discover/page.tsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Zap, Loader2, Search, X, Play, Monitor, Globe } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function DiscoverPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // FIX 2: Includes 'upcoming' and maps perfectly to backend routes
  const [activeTab, setActiveTab] = useState<'trending' | 'top-rated' | 'new' | 'upcoming'>('trending');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState(""); 
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [launching, setLaunching] = useState(false);

  const router = useRouter();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  };

  useEffect(() => {
    const authenticate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        if (res.ok) setUser(await res.json());
      } catch (e) { console.error("Auth failed on discover page"); }
    };
    authenticate();
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastGameElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + 20);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchGamesData = async (currentOffset: number, query: string, tab: string, isReset: boolean) => {
    if (isReset) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `${API_BASE_URL}/games/trending?offset=${currentOffset}&limit=20`; 
      
      if (query) {
        url = `${API_BASE_URL}/games/search?q=${query}&offset=${currentOffset}&limit=20`;
      } else {
        url = `${API_BASE_URL}/games/${tab}?offset=${currentOffset}&limit=20`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          setHasMore(false);
        } else {
          // GLITCH FIX: Filter out duplicates automatically via Set checking
          setGames(prev => {
            if (isReset) return data;
            const newGames = data.filter((newGame: any) => !prev.some((oldGame: any) => oldGame.id === newGame.id));
            return [...prev, ...newGames];
          });
          if (data.length < 20) setHasMore(false);
        }
      }
    } catch (e) {
      console.error("Fetch failed", e);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchGamesData(0, activeQuery, activeTab, true);
  }, [activeQuery, activeTab]);

  useEffect(() => {
    if (offset > 0) {
      fetchGamesData(offset, activeQuery, activeTab, false);
    }
  }, [offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setHasMore(true);
    setActiveQuery(searchQuery);
  };

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    setOffset(0);
    setHasMore(true);
    setSearchQuery("");
    setActiveQuery("");
  };

  const openLaunchModal = (game: any) => {
    setSelectedGame(game);
    setShowPlatformModal(true);
  };

  const handleSmartLaunch = async (platform: string) => {
    if (!user) { router.push('/login'); return; }
    setLaunching(true);
    try {
      const cleanName = selectedGame.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const nodeName = `Cloud-${cleanName}-${Math.floor(Math.random() * 1000)}`;

      await fetch(`${API_BASE_URL}/proxmox/provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          node_name: nodeName,
          vram_allocation: 12, // For discover page quick launch
          os_template: "WINDOWS_11_GAMER",
          user_id: user.id,
          launcher: platform
        })
      });
      router.push('/gaming');
    } catch (error) {
      console.error("Failed to launch node:", error);
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 relative animate-in fade-in duration-700">
      {showPlatformModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-[2rem] w-full max-w-xl animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 blur-3xl scale-150 pointer-events-none" style={{ backgroundImage: `url(${selectedGame?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg line-clamp-1">{selectedGame?.name}</h3>
                    <p className="text-zinc-400 font-bold tracking-widest text-xs mt-1">SELECT INJECTION VECTOR</p>
                </div>
                <button disabled={launching} onClick={() => setShowPlatformModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"><X className="text-zinc-400 hover:text-white" /></button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                <button onClick={() => handleSmartLaunch('Steam')} disabled={launching} className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-blue-500/50 disabled:opacity-50"><span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-blue-400">{launching ? <Loader2 className="animate-spin" size={18} /> : <Monitor size={18} />} STEAM</span></button>
                <button onClick={() => handleSmartLaunch('Epic Games')} disabled={launching} className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-zinc-300/50 disabled:opacity-50"><span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-white">{launching ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />} EPIC GAMES</span></button>
                <button onClick={() => handleSmartLaunch('GOG')} disabled={launching} className="relative group w-full py-5 bg-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-fuchsia-500/50 disabled:opacity-50"><span className="relative z-10 flex items-center justify-center gap-3 text-zinc-300 group-hover:text-fuchsia-400">{launching ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} GOG GALAXY</span></button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase flex items-center"><Compass className="mr-4 text-fuchsia-500" size={36} />DISCOVERY MATRIX</h1>
          <p className="text-zinc-400 font-bold tracking-[0.2em] text-xs mt-2 uppercase">Live IGDB Feed // Global Node Activity</p>
        </div>
        <form onSubmit={handleSearch} className="w-full md:w-96 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-zinc-500" /></div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all shadow-inner" placeholder="Search the infinite catalog..." />
        </form>
      </div>

      {/* TABS WITH UPCOMING */}
      <div className="flex gap-6 border-b border-zinc-800/50 pb-px mb-8 overflow-x-auto scrollbar-hide">
        {[
          { id: 'trending', label: 'Top Trending' },
          { id: 'top-rated', label: 'Top Rated' },
          { id: 'new', label: 'New Releases' },
          { id: 'upcoming', label: 'Upcoming' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => handleTabClick(tab.id)}
            className={`font-black uppercase tracking-[0.15em] text-xs pb-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-fuchsia-500 text-white' 
                : 'border-transparent text-zinc-600 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4"><Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" /><span className="text-zinc-600 font-black uppercase tracking-widest text-sm">Syncing with Twitch Datastore...</span></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {games.map((game, i) => {
              const isLastElement = games.length === i + 1;
              return (
                <div key={`${game.id}-${i}`} ref={isLastElement ? lastGameElementRef : null} onClick={() => openLaunchModal(game)} className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border border-zinc-800/80 transition-all duration-500 hover:border-fuchsia-500 hover:-translate-y-2 shadow-lg">
                  {game.cover_url ? (<img src={game.cover_url} alt={game.name} className="absolute inset-0 object-cover w-full h-full transform group-hover:scale-110 transition-all duration-700 ease-out" />) : (<div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-700 font-black">NO SIGNAL</div>)}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90" />
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <h3 className="text-white font-black italic uppercase text-sm tracking-widest line-clamp-2">{game.name}</h3>
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-3">
                        <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded border border-fuchsia-500/20">{game.rating ? `${Math.round(game.rating)} CRITIC` : 'UNRATED'}</span>
                        <span className="text-white text-[10px] font-black tracking-widest flex items-center gap-1">STREAM <Play size={10} className="fill-white" /></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {loadingMore && (<div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" /></div>)}
        </>
      )}
    </div>
  );
}