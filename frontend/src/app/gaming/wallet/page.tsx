// frontend/src/app/gaming/wallet/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, History, PlusCircle, Server, Activity, Loader2, X } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        const user = await userRes.json();
        
        // Fetch specific Tiered Wallet
        const walletRes = await fetch(`${API_BASE_URL}/users/wallet/${user.id}`, { headers: getAuthHeaders() });
        if (walletRes.ok) {
          setWallet(await walletRes.json());
        }

        // Fetch Transaction History Ledger
        const histRes = await fetch(`${API_BASE_URL}/payments/history`, { headers: getAuthHeaders() });
        if (histRes.ok) {
            setHistory(await histRes.json());
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
      
      {/* HISTORY MODAL OVERLAY */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-950 pt-2 pb-4 border-b border-zinc-800">
              <h3 className="text-xl font-black italic text-white uppercase tracking-widest">Full Ledger</h3>
              <button onClick={() => setShowHistoryModal(false)}><X className="text-zinc-500 hover:text-white transition-colors" /></button>
            </div>
            
            <div className="space-y-4">
              {history.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-4 bg-zinc-900 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide">{tx.title}</h4>
                    <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest mt-1">
                        {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`${tx.hours > 0 ? 'text-emerald-400' : 'text-rose-400'} font-black tracking-wider`}>
                    {tx.hours > 0 ? '+' : ''}{tx.hours} Hrs
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                  <div className="text-center text-zinc-600 font-bold uppercase tracking-widest py-8">
                      No Data Logs Found.
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-12">
        <Wallet className="text-emerald-400" size={36} />
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">RESOURCE LEDGER</h1>
          <p className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase">Financial Matrix // Compute Credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Unified Balance Block */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-zinc-400 font-black text-xs uppercase tracking-[0.2em]">Total Unified Balance</span>
            <Wallet className="text-zinc-700" size={32} />
          </div>

          <div className="relative z-10 flex items-baseline gap-2 mt-8 mb-12">
            {loading ? (
              <Loader2 className="animate-spin text-emerald-500" size={48} />
            ) : (
              <span className="text-7xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-lg">
                {/* Aggregate the unified total across all tiers for the main display */}
                {wallet ? ((wallet.esports_hours || 0) + (wallet.aaa_hours || 0) + (wallet.ultra_hours || 0)).toFixed(1) : '0.0'}
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

        {/* Right Side: Dynamic Recent History List */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <History className="text-zinc-500" size={20} />
                <span className="text-zinc-400 font-black text-xs uppercase tracking-[0.2em]">Recent Activity</span>
            </div>
            {history.length > 3 && (
                <button 
                    onClick={() => setShowHistoryModal(true)} 
                    className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-widest transition-colors"
                >
                    Show All
                </button>
            )}
          </div>

          <div className="space-y-6 flex-1">
            {history.slice(0, 3).map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center pb-6 border-b border-zinc-800/50 last:border-0 last:pb-0">
                <div>
                    <h4 className="text-white font-bold text-sm tracking-wide">{tx.title}</h4>
                    <p className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest mt-1">
                        {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                </div>
                <span className={`${tx.hours > 0 ? 'text-emerald-400' : 'text-rose-400'} font-black tracking-wider`}>
                    {tx.hours > 0 ? '+' : ''}{tx.hours} Hrs
                </span>
                </div>
            ))}
            
            {!loading && history.length === 0 && (
                <div className="h-full flex items-center justify-center">
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest italic">No Data Logs Found.</p>
                </div>
            )}
            
            {loading && (
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-600" size={24} />
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}