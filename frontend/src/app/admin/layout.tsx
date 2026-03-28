"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, Terminal, ShieldAlert, Cpu, Database, Network, Server, Settings, Unlock, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#020502] text-green-500 min-h-screen font-mono selection:bg-green-500/30 overflow-hidden">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 w-full bg-[#020502]/95 backdrop-blur-md border-b border-green-900/50 p-4 flex justify-between items-center z-50">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <h1 className="text-xl font-bold tracking-widest text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            GOD<span className="text-white">_MODE</span>
          </h1>
        </Link>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-green-500 hover:text-white transition-colors bg-[#0a150a] p-2 rounded border border-green-900">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed md:relative top-0 left-0 w-64 h-screen bg-[#050a05] border-r border-green-900/50 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 border-b border-green-900/50 hidden md:block">
          <Link href="/">
             <h1 className="text-2xl font-black tracking-widest text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] cursor-pointer hover:text-white transition-colors">
                SYS<span className="text-white">_ADMIN</span>
             </h1>
          </Link>
          <p className="text-[10px] text-green-600 mt-2 uppercase tracking-[0.2em] font-bold animate-pulse">
             Access Level: Omega
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 md:py-6 space-y-2 pb-24 mt-16 md:mt-0">
          {/* Main Module */}
          <div className="mb-8">
            <h3 className="text-[10px] text-green-700 uppercase tracking-widest font-bold mb-3 border-l-2 border-green-900 pl-2">Core Telemetry</h3>
            <NavItem icon={<Activity size={18} />} label="Live Dashboard" active />
            <NavItem icon={<Terminal size={18} />} label="Celery Logs" />
            <NavItem icon={<Server size={18} />} label="Hardware Nodes" />
            <NavItem icon={<Cpu size={18} />} label="VRAM Heatmap" />
          </div>

          <div className="mb-8">
            <h3 className="text-[10px] text-green-700 uppercase tracking-widest font-bold mb-3 border-l-2 border-green-900 pl-2">Infrastructure</h3>
            <NavItem icon={<Database size={18} />} label="Postgres SQL" />
            <NavItem icon={<Network size={18} />} label="VLAN Mapping" />
          </div>

          <div>
             <h3 className="text-[10px] text-red-700 uppercase tracking-widest font-bold mb-3 border-l-2 border-red-900 pl-2">Danger Zone</h3>
             <NavItem icon={<ShieldAlert size={18} />} label="Cluster Halts" danger />
             <NavItem icon={<Unlock size={18} />} label="God-Mode Overrides" danger />
          </div>
        </div>

        <div className="p-4 border-t border-green-900/50 bg-[#020502]">
          <NavItem icon={<Settings size={18} />} label="Daemon Settings" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="p-4 md:p-8 pt-24 md:pt-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-950/10 via-[#020502] to-[#020502] min-h-full">
           {/* Terminal Scanline Effect Overlay */}
           <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50 mix-blend-overlay opacity-30"></div>
           <div className="relative z-10 w-full overflow-hidden">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, danger = false }: { icon: React.ReactNode, label: string, active?: boolean, danger?: boolean }) {
  const baseClasses = "flex items-center space-x-3 px-3 py-2.5 rounded cursor-pointer transition-all duration-300 border mb-1 uppercase text-xs font-bold tracking-wider";
  
  if (danger) {
    return (
      <div className={`${baseClasses} border-red-900/30 text-red-500 hover:bg-red-950/40 hover:border-red-500 hover:text-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]`}>
        {icon}
        <span>{label}</span>
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} ${
      active 
      ? 'bg-green-950/50 text-green-400 border-green-500/50 shadow-[inset_2px_0_0_rgba(34,197,94,1)]' 
      : 'border-transparent text-green-700 hover:bg-[#0a150a] hover:text-green-500 border hover:border-green-900/50'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
