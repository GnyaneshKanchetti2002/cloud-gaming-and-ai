"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InstanceRecord {
  id: number;
  node_name: string;
  vram_allocation: number;
  ip_address: string | null;
  proxmox_vmid: number | null;
  physical_node: string | null;
  vlan_id: number | null;
  status: string;
}

export default function EnterpriseDashboard() {
  const [instances, setInstances] = useState<InstanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // --- Helper to grab the token for all API requests ---
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };
  };

  const fetchInstances = async (userId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com/api";
      const res = await fetch(`${baseUrl}/proxmox/instances/${userId}`, { 
        headers: getAuthHeaders(),
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (e) {
      console.error("Failed to fetch instances", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const authenticate = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com/api";
      const token = localStorage.getItem('token');
      
      if (!token) {
          router.push('/login');
          return;
      }

      try {
        const res = await fetch(`${baseUrl}/auth/me`, { 
          headers: getAuthHeaders(),
          credentials: 'include' 
        });
        
        if (!res.ok) {
          // Token is invalid or expired. Destroy it and kick them out.
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        const activeUser = await res.json();
        setUser(activeUser);
        fetchInstances(activeUser.id);
      } catch (e) {
        router.push('/login');
      }
    };
    authenticate();
    
    // Poll hypervisor instances every 5 seconds
    const interval = setInterval(() => {
      if (user?.id) fetchInstances(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, router]);

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com/api";
      await fetch(`${baseUrl}/proxmox/provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          node_name: `AI-Accel-Node-${Math.floor(Math.random() * 1000)}`,
          vram_allocation: 12, // 12GB Slice
          os_template: "UBUNTU_22_AI_ACCEL",
          user_id: user?.id
        })
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleKill = async (instanceId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://cloud-gaming-backend.onrender.com/api";
      await fetch(`${baseUrl}/proxmox/kill/${instanceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (user?.id) fetchInstances(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic values calculated directly from fetched state
  const activeCount = instances.filter(i => i.status === 'running').length;
  const totalVram = instances.reduce((acc, curr) => acc + curr.vram_allocation, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-12">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition-colors">
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Active Instances</p>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-white tracking-tight">{activeCount}</span>
            <span className="text-slate-500 text-sm font-medium">/ 10 Limit</span>
          </div>
          <div className="mt-5 w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
            <div className="bg-blue-500 h-2 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(activeCount / 10) * 100}%` }}></div>
          </div>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition-colors">
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Total vRAM Usage</p>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-white tracking-tight">{totalVram} GB</span>
            <span className="text-slate-500 text-sm font-medium">/ 120 GB</span>
          </div>
          <div className="mt-5 w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
            <div className="bg-indigo-500 h-2 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(totalVram / 120) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] group-hover:bg-emerald-500/20 transition-all duration-500" />
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase relative z-10">Current Hourly Burn</p>
          <div className="mt-3 flex items-baseline space-x-2 relative z-10">
            <span className="text-4xl font-bold text-emerald-400 tracking-tight">${(totalVram * 0.15).toFixed(2)}</span>
            <span className="text-slate-500 text-sm font-medium">/ hr</span>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs font-medium text-slate-500 relative z-10">
            <span>Est. monthly</span>
            <span className="text-slate-300">${(totalVram * 0.15 * 730).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Node List */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-px overflow-hidden shadow-2xl relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="bg-slate-950/80 p-8 rounded-[11px] relative z-10 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-200 tracking-tight">Provisioned Nodes</h3>
              <p className="text-sm text-slate-500 mt-1">Manage your active compute slices and connection keys.</p>
            </div>
            <button 
              onClick={handleProvision}
              disabled={isProvisioning}
              className={`py-2.5 px-5 ${isProvisioning ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white font-medium rounded-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex items-center justify-center space-x-2`}
            >
              <svg className={`w-5 h-5 ${isProvisioning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{isProvisioning ? "Building..." : "Provision Node"}</span>
            </button>
          </div>
          
          <div className="space-y-3 pt-2">
            {isLoading ? (
              <p className="text-slate-500 text-sm text-center py-4">Syncing Hypervisor Data...</p>
            ) : instances.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No active instances. Provision a node to get started.</p>
            ) : instances.map((instance) => (
              <div key={instance.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-900 border border-slate-800/80 hover:border-blue-500/50 transition-all rounded-xl cursor-pointer">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    {instance.status === 'running' && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      </>
                    )}
                    {(instance.status === 'provisioning' || instance.status === 'pending') && (
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></div>
                    )}
                    {instance.status === 'stopping' || instance.status === 'destroying' ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce"></div>
                    ) : null}
                    {instance.status === 'error' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,1)]"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-200 mb-1">{instance.node_name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{instance.vram_allocation}GB vRAM</span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-xs font-medium text-slate-400">Status: {instance.status}</span>
                      {instance.proxmox_vmid && (
                        <>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-xs font-medium text-blue-400 hover:underline">VMID: {instance.proxmox_vmid}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {instance.ip_address ? (
                    <div className="hidden sm:block px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950">
                      <p className="text-[11px] font-mono text-slate-400">{instance.ip_address}</p>
                    </div>
                  ) : (
                    <div className="hidden sm:block px-3 py-1.5 rounded-md border border-dashed border-slate-700">
                      <p className="text-[11px] font-mono text-slate-600">IP Pending...</p>
                    </div>
                  )}
                  
                  <button 
                    disabled={instance.status !== 'running'}
                    className={`text-xs font-semibold px-4 py-2 rounded-md transition-all shadow-sm border ${instance.status === 'running' ? 'text-slate-300 hover:text-white bg-slate-800 border-slate-700 hover:bg-blue-600 hover:border-blue-500' : 'text-slate-600 bg-slate-900 border-slate-800 cursor-not-allowed'}`}
                  >
                    SSH
                  </button>
                  <button 
                    disabled={instance.status !== 'running'}
                    className={`text-xs font-semibold px-4 py-2 rounded-md transition-all shadow-sm border ${instance.status === 'running' ? 'text-slate-300 hover:text-white bg-slate-800 border-slate-700 hover:bg-indigo-600 hover:border-indigo-500' : 'text-slate-600 bg-slate-900 border-slate-800 cursor-not-allowed'}`}
                  >
                    DCV
                  </button>
                  <button 
                    onClick={() => handleKill(instance.id)}
                    className="text-xs font-semibold text-red-500 hover:text-white bg-slate-800 hover:bg-red-600 px-3 py-2 rounded-md transition-all border border-slate-700 hover:border-red-500 flex items-center"
                    title="Stop Instance"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}