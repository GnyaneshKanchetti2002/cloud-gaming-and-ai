"use client";
import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { API_BASE_URL } from '@/app/lib/api';
import { createPortal } from 'react-dom';

export default function MFAModal() {
  const mfaAction = useAdminStore((s) => s.mfaAction);
  const clearMfa = useAdminStore((s) => s.clearMfa);
  const [code, setCode] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mfaAction || !mounted) return null;

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}${mfaAction.endpoint}`, {
        method: mfaAction.method || "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: mfaAction.payload ? JSON.stringify({ ...mfaAction.payload, totp: code }) : undefined
      });
      if (res.ok) {
        clearMfa();
      } else {
        alert("Authorization failed. Invalid TOTP or Network Error.");
      }
    } catch(e) {
      console.error(e);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center">
      <div className="bg-red-950/80 p-8 border border-red-500 text-center shadow-[0_0_40px_rgba(239,68,68,0.3)]">
        <h2 className="text-red-500 text-2xl font-black italic uppercase">CRITICAL CLEARANCE REQUIRED</h2>
        <p className="text-red-400 text-xs tracking-widest mt-2 uppercase">Provide Time-Based Authenticator Code</p>
        <input 
           autoFocus
           type="text" 
           maxLength={6} 
           value={code} 
           onChange={e => setCode(e.target.value)} 
           className="mt-6 w-full p-4 bg-black text-white text-center text-3xl font-mono tracking-[0.5em] focus:outline-none border border-red-900 focus:border-red-500"
           placeholder="000000"
        />
        <div className="flex gap-4 mt-8 justify-center">
           <button onClick={clearMfa} className="px-6 py-2 border border-red-900 text-red-700 uppercase font-bold text-xs hover:text-red-500 hover:border-red-500 transition-colors">Abort Sequence</button>
           <button onClick={handleSubmit} className="px-8 py-2 bg-red-600 text-black uppercase font-black tracking-widest text-sm hover:bg-white transition-colors cursor-pointer">Execute</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
