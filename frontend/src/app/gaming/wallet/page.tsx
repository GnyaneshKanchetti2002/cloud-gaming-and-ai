"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, History, PlusCircle, Server, Activity, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function WalletPage() {
  const [balanceHours, setBalanceHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };
  };

  useEffect(() => {
    const fetchLedger = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        // 1. Get current user
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        const user = await userRes.json();
        
        // 2. Get wallet balance
        const walletRes = await fetch(`${API_BASE_URL}/users/wallet/${user.id}`, { headers: getAuthHeaders() });
        if (walletRes.ok) {
          const data = await walletRes.json();
          setBalanceHours(data.balance_hours);
        }
      } catch (error) {
        console.error("Failed to load ledger", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      <div className="flex items-center gap-4 mb-12">
        <Wallet className="text-emerald-400" size={36} />
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">RESOURCE LEDGER</h1>
          <p className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase">Financial Matrix // Compute Credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Active Balance */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-zinc-400 font-black text-xs uppercase tracking-[0.2em]">Available Compute Time</span>
            <Wallet className="text-zinc-700" size={32} />
          </div>

          <div className="relative z-10 flex items-baseline gap-2 mt-8 mb-12">
            {loading ? (
              <Loader2 className="animate-spin text-emerald-500" size={48} />
            ) : (
              <span className="text-7xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-lg">
                {balanceHours !== null ? balanceHours.toFixed(1) : '0.0'}
              </span>
            )}
            {!loading && <span className="text-xl font-bold text-zinc-500 uppercase tracking-widest">Hrs</span>}
          </div>

          <button 
            onClick={() => router.push('/gaming/pricing')}
            className="relative z-10 w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <PlusCircle size={16} /> Top Up Balance
          </button>
        </div>

        {/* Right Side: Session History (Static Mockup based on image) */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <History className="text-zinc-500" size={20} />
            <span className="text-zinc-400 font-black text-xs uppercase tracking-[0.2em]">Session History</span>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex justify-between items-center pb-6 border-b border-zinc-800/50">
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide">Cyberpunk 2077 Session</h4>
                <p className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest mt-1">2 Hours Ago</p>
              </div>
              <span className="text-rose-400 font-black tracking-wider">-2.5 Hrs</span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide">Credit Top-up</h4>
                <p className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest mt-1">Yesterday</p>
              </div>
              <span className="text-emerald-400 font-black tracking-wider">+10.0 Hrs</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}