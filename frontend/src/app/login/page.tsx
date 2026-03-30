"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../lib/api'; // <-- 1. Import our centralized URL

// 1. Move the logic and UI into a separate component
function LoginTerminal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // CATCH THE TOKEN: After login, Render redirects back here with ?token=...
    const token = searchParams.get('token');

    if (token) {
      // SAVE THE TOKEN: Store it so the Landing Page knows we are logged in
      localStorage.setItem('token', token);
      
      // REDIRECT: Send the user to the gaming dashboard
      router.push('/gaming');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black overflow-hidden font-sans">
        
        {/* ---------------- B2B ENTERPRISE ---------------- */}
        <div className="w-full md:w-1/2 bg-[#0b1120] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-center items-center p-12 relative group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight text-center"><span className="text-blue-500">LIQUID</span> COMPUTE</h2>
              <p className="text-slate-400 mb-10 max-w-sm text-center">B2B Enterprise Portal for Zero-Latency AI and Cloud Rendering.</p>
              
              {/* <-- 2. FIX: Removed the extra /api from the URL */}
              <a href={`${API_BASE_URL}/auth/login/azure`} className="flex items-center space-x-3 bg-slate-100 hover:bg-white text-black font-semibold px-6 py-3.5 rounded-lg transition-transform hover:-translate-y-1 w-full max-w-sm justify-center shadow-lg hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><rect width="9" height="9" fill="#F25022"/><rect x="11" width="9" height="9" fill="#7FBA00"/><rect y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
                <span>Log in with Microsoft Entra</span>
              </a>
              <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold">CTO & DEVOPS AUTHORIZATION REQUIRED</p>
            </div>
        </div>

        {/* ---------------- B2C GAMING ---------------- */}
        <div className="w-full md:w-1/2 bg-zinc-950 flex flex-col justify-center items-center p-12 relative group">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(217,70,239,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_20s_linear_infinite] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-rose-400 mb-2 tracking-widest text-center">ARCADE<span className="text-white">_01</span></h2>
              <p className="text-zinc-400 mb-10 max-w-sm text-center">Zero-touch provisioning. Drop straight into your games on a dedicated RTX node.</p>
              
              {/* <-- 3. FIX: Removed the extra /api from the URL */}
              <a href={`${API_BASE_URL}/auth/login/discord`} className="flex items-center space-x-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-3.5 rounded-lg transition-transform hover:-translate-y-1 w-full max-w-sm justify-center shadow-[0_10px_30px_rgba(88,101,242,0.3)] border border-[#5865F2]/50">
                <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.69 56.6.43 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a67.55 67.55 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-48.47-19.34-72.15zM42.45 65.69c-6.2 0-11.32-5.74-11.32-12.82s5-12.82 11.32-12.82c6.35 0 11.41 5.82 11.32 12.82 0 7.08-5.06 12.82-11.32 12.82zm42.24 0c-6.2 0-11.32-5.74-11.32-12.82s5-12.82 11.32-12.82c6.35 0 11.41 5.82 11.32 12.82 0 7.08-5 12.82-11.32 12.82z"/></svg>
                <span>Log in with Discord</span>
              </a>
              <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-widest font-black">GAMING ACCESS ONLY</p>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slide {
            0% { background-position: 0 0; }
            100% { background-position: -250px 250px; }
          }
        `}} />
    </div>
  );
}

// 2. Wrap the component in Suspense for the default export
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-black flex items-center justify-center text-zinc-500 font-mono tracking-widest animate-pulse">
        INITIALIZING SECURE TERMINAL...
      </div>
    }>
      <LoginTerminal />
    </Suspense>
  );
}