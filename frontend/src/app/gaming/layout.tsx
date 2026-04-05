"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, Compass, Wallet, Trophy, UserCircle, Menu, X, Search, Power } from 'lucide-react';
import SearchMatrix from '@/components/SearchMatrix';

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we are currently in the active game portal
  const isPlayPage = pathname === '/gaming/play';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  // If we are on the stream page, render ONLY the game (No Sidebar, No Padding)
  if (isPlayPage) {
    return (
      <div className="bg-black min-h-screen w-full overflow-hidden font-sans">
        {children}
      </div>
    );
  }

  // Otherwise, render the standard dashboard layout
  return (
    <div className="flex bg-zinc-950 text-zinc-300 min-h-screen font-sans selection:bg-fuchsia-500/30 overflow-hidden">
      <SearchMatrix isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      <nav className={`fixed md:relative top-0 left-0 h-screen w-64 md:w-20 lg:w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col py-8 z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-12 px-6 lg:px-8">
           <Link href="/gaming">
             <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-rose-400 hidden lg:block">NEXUS_GP</h1>
             <Gamepad2 className="lg:hidden mx-auto text-fuchsia-500" size={28} />
           </Link>
        </div>

        <div className="flex-1 w-full space-y-2 px-4">
          <NavItem href="/gaming" icon={<Gamepad2 size={22} />} label="Library" active={pathname === '/gaming'} />
          <NavItem href="/gaming/discover" icon={<Compass size={22} />} label="Discover" active={pathname === '/gaming/discover'} />
          <NavItem href="/gaming/achievements" icon={<Trophy size={22} />} label="Achievements" active={pathname === '/gaming/achievements'} />
          <NavItem href="/gaming/wallet" icon={<Wallet size={22} />} label="Digital Wallet" active={pathname === '/gaming/wallet'} />
        </div>

        <div className="mt-auto px-4 space-y-4">
          <div onClick={() => setIsSearchOpen(true)} className="hidden lg:flex items-center space-x-4 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-fuchsia-500/50 transition-all group">
            <Search size={18} className="group-hover:text-fuchsia-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Search (⌘K)</span>
          </div>
          
          <NavItem href="/gaming/config" icon={<UserCircle size={22} />} label="Profile Config" active={pathname === '/gaming/config'} />
          
          <button 
            onClick={handleDisconnect}
            className="flex items-center w-full lg:px-4 py-3 lg:space-x-4 rounded-xl transition-all duration-300 text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500 group"
          >
            <div className="shrink-0 mx-auto lg:mx-0">
              <Power size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] font-black tracking-[0.2em] uppercase lg:block hidden">Disconnect</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto bg-zinc-950">
        <div className="p-4 md:p-8 lg:p-12 xl:px-20 pt-24 md:pt-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link href={href} className={`flex items-center lg:px-4 py-3 lg:space-x-4 rounded-xl transition-all duration-300 ${active ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[inset_3px_0_0_rgba(217,70,239,1)]' : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'}`}>
      <div className="shrink-0 mx-auto lg:mx-0">{icon}</div>
      <span className="text-[11px] font-black tracking-[0.2em] uppercase lg:block hidden">{label}</span>
    </Link>
  );
}