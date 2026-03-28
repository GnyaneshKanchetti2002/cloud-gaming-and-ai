"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Compass, Wallet, Trophy, UserCircle, Menu, X } from 'lucide-react';

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-zinc-950 text-zinc-300 min-h-screen font-sans selection:bg-fuchsia-500/30 overflow-hidden">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50 p-4 flex justify-between items-center z-50">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <h1 className="text-xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-rose-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
            ARCADE<span className="text-white">_01</span>
          </h1>
        </Link>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white transition-colors bg-zinc-900 p-2 rounded border border-zinc-800">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-30 backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed md:relative top-0 left-0 h-screen w-64 md:w-20 lg:w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center lg:items-stretch py-8 lg:py-8 lg:px-4 z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="mb-12 px-6 lg:px-2 pt-16 md:pt-0 hidden md:block">
          <Link href="/">
             <div className="w-12 h-12 lg:hidden bg-gradient-to-br from-fuchsia-600 to-rose-600 rounded-xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:scale-105 transition-transform cursor-pointer">
               <Gamepad2 className="text-white w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-rose-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] hidden lg:block hover:opacity-80 transition-opacity cursor-pointer">
                NEXUS<span className="text-white text-xl">_GP</span>
             </h1>
          </Link>
        </div>

        {/* Mobile Header (replaces desktop header spacing) */}
        <div className="w-full px-6 md:hidden border-b border-zinc-900 pb-6 mb-6">
           <p className="text-xs text-zinc-500 font-black tracking-[0.2em] uppercase">Navigation Matrix</p>
        </div>

        <div className="flex-1 w-full flex flex-col space-y-4 lg:space-y-2 px-4 lg:px-0">
          <NavIcon icon={<Gamepad2 size={24} />} label="Library" active />
          <NavIcon icon={<Compass size={24} />} label="Discover" />
          <NavIcon icon={<Trophy size={24} />} label="Achievements" />
          <NavIcon icon={<Wallet size={24} />} label="Digital Wallet" />
        </div>

        <div className="mt-auto w-full px-4 lg:px-0 pt-6 border-t border-zinc-900 border-dashed">
          <NavIcon icon={<UserCircle size={24} />} label="Profile Config" />
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
        <div className="p-4 md:p-8 lg:p-12 xl:px-20 pt-24 md:pt-8 lg:pt-12 relative z-0">
          {children}
        </div>
      </main>

    </div>
  );
}

function NavIcon({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`group flex items-center lg:items-center justify-start lg:justify-start lg:px-4 py-3 lg:space-x-4 rounded-xl cursor-pointer transition-all duration-300 w-full ${
      active 
      ? 'bg-zinc-900 text-fuchsia-400 border border-fuchsia-500/20 shadow-[inset_4px_0_0_rgba(217,70,239,1)]' 
      : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white border border-transparent hover:border-zinc-800'
    }`}>
      <div className={`shrink-0 ${active ? 'drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]' : ''}`}>
         {icon}
      </div>
      <span className="text-sm font-bold tracking-wider uppercase lg:block ml-4 lg:ml-0 md:hidden">{label}</span>
      
      {/* Tooltip for medium screens (sidebar collapsed) */}
      <span className="fixed hidden md:group-hover:block lg:hidden translate-x-12 ml-4 px-3 py-1.5 bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest rounded-lg border border-zinc-700 whitespace-nowrap z-50">
        {label}
      </span>
    </div>
  );
}
