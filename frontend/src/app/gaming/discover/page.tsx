"use client";
import React, { useEffect, useState } from 'react';
import { Compass, Zap, Flame, Loader2, X } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function DiscoverPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/games/trending`);
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        }
      } catch (e) {
        console.error("IGDB Link Failed", e);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center">
          <Compass className="mr-4 text-fuchsia-500" size={32} />
          Discovery Matrix
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Live IGDB Feed // Global Node Activity</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-500" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Global Top Rated</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center space-x-4 py-20 text-zinc-700 font-black uppercase tracking-widest italic">
            <Loader2 className="animate-spin text-fuchsia-500" /> 
            <span>Syncing with Twitch Datastore...</span>
          </div>
        ) : (
          <div className="flex space-x-6 overflow-x-auto pb-12 custom-scrollbar">
            {games.map((game) => (
              <div key={game.id} className="min-w-[280px] group relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 hover:border-fuchsia-500/50 transition-all cursor-pointer hover:-translate-y-2 duration-500">
                <img 
                  src={game.cover_url} 
                  alt={game.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-black italic uppercase text-sm leading-tight mb-2">{game.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase">
                      Score: {Math.round(game.total_rating)}
                    </span>
                    <Zap size={14} className="text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}