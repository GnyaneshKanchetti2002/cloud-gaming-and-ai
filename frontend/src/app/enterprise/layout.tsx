"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Database, LayoutDashboard, Settings, HardDrive, Network, Key, Menu, X } from 'lucide-react';

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#0b1120] text-slate-300 min-h-screen font-sans overflow-hidden">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center z-50 shadow-lg">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <h1 className="text-xl font-bold text-white tracking-widest"><span className="text-blue-500">LIQUID</span> COMPUTE</h1>
        </Link>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-300 hover:text-white transition-colors bg-slate-800 p-2 rounded-md">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed md:relative top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800/50 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 hidden md:block">
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-blue-500">LIQUID</span> COMPUTE
            </h1>
          </Link>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Proxmox Datacenter</p>
        </div>
        
        {/* Mobile Header (replaces desktop header spacing) */}
        <div className="p-6 md:hidden border-b border-slate-800/50 mb-2">
           <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Main Navigation</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1 mt-4 md:mt-0">
          <NavItem icon={<LayoutDashboard size={20} />} label="Cluster Nodes" active />
          <NavItem icon={<Database size={20} />} label="TrueNAS Storage" />
          <NavItem icon={<HardDrive size={20} />} label="Block Volumes" />
          <NavItem icon={<Network size={20} />} label="VPC Networks" />
          <NavItem icon={<Key size={20} />} label="SSH Keys & DCV" />
        </div>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <NavItem icon={<Settings size={20} />} label="Billing Defaults" />
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Org Quota</h4>
            <div className="w-full bg-slate-900 rounded-full h-1.5 focus:outline-none shadow-inner">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">45 / 100 vCores</p>
          </div>
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto min-w-0">
        {/* Adjust top padding on mobile to account for the fixed navbar */}
        <div className="p-4 md:p-8 lg:p-12 pt-24 md:pt-8 lg:pt-12 relative z-0">
          <header className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Enterprise Infrastructure</h2>
            <p className="text-sm border-l border-blue-500 pl-3 mt-2 text-slate-400">Manage hypervisor-level compute slices dedicated to B2B inference workloads.</p>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
      active 
      ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white font-normal'
    }`}>
      {icon}
      <span className="text-sm tracking-wide">{label}</span>
    </div>
  );
}
