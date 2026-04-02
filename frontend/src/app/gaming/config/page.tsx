// frontend/src/app/gaming/config/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { UserCircle, Monitor, Shield, Save, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function ConfigPage() {
  const [res, setRes] = useState("1080p");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        if (response.ok) {
          const user = await response.json();
          setRes(user.target_resolution || "1080p");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSync = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/users/config`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ target_resolution: res })
      });
      // Added a slight delay for better UX feel
      setTimeout(() => setSaving(false), 600);
    } catch (e) { 
      console.error(e); 
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={48} /></div>;
  }

  return (
    <div className="max-w-2xl space-y-12 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center">
          <UserCircle className="mr-4 text-fuchsia-500" size={32} />
          Neural Link Config
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Hardware Abstraction // Streaming Prefs</p>
      </div>

      <div className="space-y-8 bg-zinc-900/20 border border-zinc-800 p-8 rounded-3xl">
        <section className="space-y-4">
          <div className="flex items-center text-white font-bold uppercase tracking-widest text-xs">
            <Monitor className="mr-2 text-zinc-500" size={16} /> Target Resolution
          </div>
          <div className="flex gap-4">
            {['1080p', '1440p', '4K'].map((r) => (
              <button 
                key={r} 
                onClick={() => setRes(r)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border ${res === r ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center text-white font-bold uppercase tracking-widest text-xs">
            <Shield className="mr-2 text-zinc-500" size={16} /> Moonlight PIN
          </div>
          <input 
            type="password" 
            placeholder="****"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-6 text-white font-mono focus:outline-none focus:border-fuchsia-500 transition-all"
          />
        </section>

        <button 
          onClick={handleSync}
          disabled={saving}
          className="w-full py-4 bg-zinc-800 hover:bg-white hover:text-black text-white font-black rounded-xl transition-all flex items-center justify-center uppercase tracking-[0.2em] disabled:opacity-50"
        >
          {saving ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
          {saving ? "Syncing..." : "Sync to Mainframe"}
        </button>
      </div>
    </div>
  );
}