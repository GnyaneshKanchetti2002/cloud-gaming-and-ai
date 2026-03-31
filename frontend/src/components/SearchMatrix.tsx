"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap, Cpu } from 'lucide-react';

export default function SearchMatrix({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState("");

  const results = [
    { name: "Cyberpunk 2077", type: "Simulation", latency: "12ms" },
    { name: "Elden Ring", type: "Simulation", latency: "15ms" },
    { name: "Assetto Corsa", type: "Compute", latency: "9ms" }
  ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-2xl bg-zinc-950/80"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
          >
            <div className="p-6 flex items-center border-b border-zinc-800">
              <Search className="w-6 h-6 text-fuchsia-500 mr-4" />
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="FIND YOUR NEXT SESSION..."
                className="flex-1 bg-transparent text-2xl font-black italic uppercase outline-none text-white placeholder:text-zinc-800"
              />
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-black text-zinc-600 tracking-[0.4em] mb-4 uppercase px-4">Available Matrix Entries</p>
              {results.map((game, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-fuchsia-500/10 group cursor-pointer transition-all border border-transparent hover:border-fuchsia-500/20 mb-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-fuchsia-500/20 transition-colors">
                      <Cpu size={20} className="text-zinc-600 group-hover:text-fuchsia-400" />
                    </div>
                    <div>
                      <span className="font-black text-lg text-zinc-400 group-hover:text-white uppercase italic block">{game.name}</span>
                      <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{game.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-mono text-zinc-700">{game.latency}</span>
                    <Zap className="w-4 h-4 text-zinc-800 group-hover:text-fuchsia-500 transition-colors" />
                  </div>
                </div>
              ))}
              {results.length === 0 && <p className="p-8 text-center text-zinc-700 font-bold uppercase tracking-widest">No matching sessions found</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}