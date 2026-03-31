"use client";
import React from 'react';
import { Trophy, Star, Target, Timer, Award } from 'lucide-react';

export default function AchievementsPage() {
  const stats = [
    { label: 'Total Sync Time', value: '124.5', unit: 'Hrs', icon: <Timer className="text-fuchsia-500" /> },
    { label: 'Neural Links', value: '42', unit: 'Sessions', icon: <Target className="text-emerald-500" /> },
    { label: 'Platform Rank', value: 'Elite', unit: 'Tier', icon: <Star className="text-amber-500" /> },
  ];

  const badges = [
    { name: 'First Contact', desc: 'Initiate your first cloud simulation.', unlocked: true },
    { name: 'Overdrive', desc: 'Play for 10 hours in a single session.', unlocked: true },
    { name: 'Night City Legend', desc: 'Accumulate 50 hours in Cyberpunk 2077.', unlocked: false },
    { name: 'Neural Architect', desc: 'Customized your first VM configuration.', unlocked: true },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center">
          <Trophy className="mr-4 text-amber-500" size={32} />
          Identity Progress
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Neural Achievements // Ranking Matrix</p>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
               {React.cloneElement(stat.icon as React.ReactElement, { size: 100 })}
            </div>
            <div className="flex items-center space-x-3 mb-4">
              {stat.icon}
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <p className="text-4xl font-black text-white">{stat.value} <span className="text-xs text-zinc-700">{stat.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Badges Grid */}
      <section>
        <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-8 flex items-center">
          <Award className="mr-3 text-fuchsia-500" size={20} /> Unlockable Augments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${
                badge.unlocked 
                ? 'bg-zinc-900/40 border-fuchsia-500/20 shadow-[0_0_30px_rgba(217,70,239,0.1)]' 
                : 'bg-black/40 border-zinc-900 opacity-40 grayscale'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${badge.unlocked ? 'bg-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'bg-zinc-800'}`}>
                <Star size={24} className={badge.unlocked ? 'text-white' : 'text-zinc-600'} />
              </div>
              <h3 className="text-white font-black uppercase text-sm mb-2">{badge.name}</h3>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed">{badge.desc}</p>
              {!badge.unlocked && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                   <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Locked by System</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}