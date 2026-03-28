"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  // The Gatekeeper Function
  const handleProtectedNavigation = (path: string) => {
    // We check if a 'token' exists in the browser's storage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      // If logged in, go to the requested page
      router.push(path);
    } else {
      // If not logged in, force them to the login page
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 overflow-hidden">
      
      {/* B2B Enterprise Section - Converted to a div with onClick */}
      <div 
        onClick={() => handleProtectedNavigation('/enterprise')} 
        className="group relative w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center items-center text-center p-8 md:p-12 overflow-hidden bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 transition-all duration-700 hover:w-full md:hover:w-[60%] cursor-pointer z-10"
      >
        {/* Background Grid & Particles */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] group-hover:bg-blue-500/30 transition-all duration-700" />

        <div className="relative z-10 space-y-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex justify-center">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-sm group-hover:border-blue-500/50 transition-colors">
              <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-400 group-hover:text-blue-300" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3 md:mb-4">B2B Enterprise</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              Secure, multi-tenant VDI and AI inference endpoints. Manage your TrueNAS SAN allocations and micro-segmented compute slices.
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 pt-4 hidden md:block">
             <span className="inline-flex items-center text-blue-400 font-semibold">
               Access Corporate Portal <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
             </span>
          </div>
        </div>
      </div>

      {/* B2C Gaming Section - Converted to a div with onClick */}
      <div 
        onClick={() => handleProtectedNavigation('/gaming')} 
        className="group relative w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center items-center text-center p-8 md:p-12 overflow-hidden bg-zinc-950 transition-all duration-700 hover:w-full md:hover:w-[60%] cursor-pointer z-10"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(217,70,239,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_20s_linear_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] group-hover:bg-fuchsia-600/30 transition-all duration-700 mix-blend-screen" />

        <div className="relative z-10 space-y-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex justify-center">
            <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 backdrop-blur-sm group-hover:border-fuchsia-500/50 transition-colors group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)]">
              <Zap className="w-10 h-10 md:w-12 md:h-12 text-rose-500 fill-rose-500/20 group-hover:text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 mb-3 md:mb-4 group-hover:from-white group-hover:to-fuchsia-200">B2C GAMERS</h2>
            <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base font-medium tracking-wide">
              Instantly launch RTX Overdrive sessions via Moonlight. Zero-touch PIN injection and fully pre-loaded storage pools.
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 pt-4 hidden md:block">
             <span className="inline-flex items-center text-fuchsia-400 font-bold tracking-widest uppercase text-sm">
               Open Console <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
             </span>
          </div>
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