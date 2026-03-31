"use client";
import React from 'react';
import { Wallet, History, CreditCard, ArrowUpRight, X } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center">
          <Wallet className="mr-4 text-emerald-500" size={32} />
          Resource Ledger
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Financial Matrix // Compute Credits</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80} /></div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">Available Compute Time</p>
          <h2 className="text-6xl font-black text-white mb-8">42.5 <span className="text-xl text-zinc-700 uppercase">Hrs</span></h2>
          <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex items-center justify-center">
            <CreditCard className="mr-2" size={18} /> TOP UP BALANCE
          </button>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl">
          <h3 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center">
            <History className="mr-2 text-zinc-500" size={18} /> Session History
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Cyberpunk 2077 Session', cost: '-2.5 Hrs', date: '2 hours ago' },
              { label: 'Credit Top-up', cost: '+10.0 Hrs', date: 'Yesterday' },
            ].map((tx, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                <div>
                  <p className="text-sm font-bold text-zinc-300">{tx.label}</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-black">{tx.date}</p>
                </div>
                <span className={`font-mono font-bold ${tx.cost.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {tx.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}