"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/app/lib/api'; 

interface InstanceRecord {
  id: number;
  user_id: number;
  node_name: string;
  ip_address: string | null;
  proxmox_vmid: number | null;
  physical_node: string | null;
  status: string;
  os_template: string;
}

export default function AdminDashboard() {
  const [instances, setInstances] = useState<InstanceRecord[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(0);
  const router = useRouter();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };
  };

  const fetchInstances = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/proxmox/instances`, { 
          headers: getAuthHeaders(),
          credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
        
        const hourlyRate = data.filter((i: any) => i.status !== 'destroying' && i.status !== 'error')
          .reduce((sum: number, i: any) => sum + (i.vram_allocation * 0.15), 0);
        setRevenue(hourlyRate);
      } else {
         router.push("/login");
      }
    } catch (e) {
      console.error("Failed to fetch instance map", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/?skip=${userPage * 20}&limit=20`, { 
          headers: getAuthHeaders(),
          credentials: "include" 
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("Failed to fetch identities", e);
    }
  };

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsers();
    const userInterval = setInterval(fetchUsers, 10000);
    return () => clearInterval(userInterval);
  }, [userPage]);

  const handleKill = async (instanceId: number) => {
    try {
      await fetch(`${API_BASE_URL}/proxmox/kill/${instanceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      fetchInstances();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBanUser = async (id: number) => {
    if (!confirm("Are you sure you want to permanently suspend this identity and vaporize all of their streams?")) return;
    await fetch(`${API_BASE_URL}/users/${id}/ban`, { 
        method: "POST", 
        headers: getAuthHeaders(),
        credentials: "include" 
    });
    fetchUsers();
    fetchInstances(); 
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Warning: This removes the user from the visible system (Soft Delete). Proceed?")) return;
    await fetch(`${API_BASE_URL}/users/${id}`, { 
        method: "DELETE", 
        headers: getAuthHeaders(),
        credentials: "include" 
    });
    fetchUsers();
  };

  // --- Bulletproof Role Swapping ---
  const handleToggleRole = async (id: number, currentRole: string) => {
    const isB2B = currentRole === 'B2B' || currentRole === 'b2b_enterprise';
    const newRole = isB2B ? 'B2C' : 'B2B';
    
    await fetch(`${API_BASE_URL}/users/${id}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
        credentials: "include"
    });
    fetchUsers();
  };

  const handleAddWallet = async (id: number) => {
    const amountStr = prompt("Enter number of hours to add/deduct:");
    if (!amountStr || isNaN(Number(amountStr))) return;
    const reason = prompt("Enter audit reason for this accounting change:");
    if (!reason) return;

    await fetch(`${API_BASE_URL}/users/${id}/wallet`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ hours_added: parseFloat(amountStr), reason }),
        credentials: "include"
    });
    fetchUsers();
  };

  // --- NEW: Handle Admin Toggle ---
  const handleToggleAdmin = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? "REVOKE" : "GRANT";
    if (!confirm(`DANGER: Are you sure you want to ${action} OMEGA CLEARANCE (Admin) for this identity?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/admin`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ is_admin: !currentStatus }),
          credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Override Failed: ${errorData.detail}`);
      }
      
      fetchUsers();
    } catch (error) {
      console.error("Network failure during clearance override.", error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 pt-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-green-900/50 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">DATACENTER TELEMETRY</h1>
          <p className="text-xs text-green-600 mt-1 uppercase">Live Data // Proxmox VE Cluster 01</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="px-4 py-1.5 bg-red-950/80 border border-red-500 rounded text-red-500 text-[10px] font-bold animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer hover:bg-red-900 hover:text-white transition-colors">
            INITIATE CLUSTER HALT
          </div>
          <div className="px-3 py-1.5 border border-green-900/50 bg-[#020502]">
            <span className="text-xs text-green-600">UPTIME: </span>
            <span className="text-xs font-bold text-green-400">99.999%</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Active Provision Operations", value: instances.filter(i => i.status === 'provisioning' || i.status === 'pending').length.toString(), unit: "jobs", color: "text-green-400" },
          { label: "Avg API Latency", value: "14", unit: "ms", color: "text-green-400" },
          { label: "Current Hourly Revenue", value: `$${revenue.toFixed(2)}`, unit: "/hr", color: "text-green-400" },
          { label: "Active Error Flags", value: instances.filter(i => i.status === 'error').length.toString(), unit: "nodes", color: "text-red-500", boxClass: "border-red-900/50 bg-red-950/10", animated: true },
        ].map((stat, i) => (
          <div key={i} className={`border p-5 relative overflow-hidden group ${stat.boxClass || 'border-green-900/50 bg-[#020502]'}`}>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-green-900/20 to-transparent" />
            <p className={`text-[10px] uppercase mb-2 font-bold tracking-wider ${stat.boxClass ? 'text-red-500' : 'text-green-600'}`}>{stat.label}</p>
            <p className={`text-4xl ${stat.color} font-black tracking-tight ${stat.animated ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : ''}`}>
              {stat.value}<span className={`text-sm ml-1 ${stat.boxClass ? 'text-red-800' : 'text-green-700'}`}>{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Heatmap & Terminal Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 border border-green-900/50 bg-[#020502] p-6 relative">
          <div className="absolute top-0 right-0 p-2 opacity-30">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          
          <h3 className="text-sm text-green-400 uppercase tracking-widest mb-6 border-b border-green-900/30 pb-2 flex items-center">
            VRAM Capacity Heatmap <span className="text-green-700 text-[10px] ml-3">(960GB Total Matrix)</span>
          </h3>
          
          <div className="grid grid-cols-16 md:grid-cols-24 gap-1 sm:gap-1.5 relative z-10">
            {Array.from({length: 192}).map((_, i) => {
              const isActiveBlock = i < instances.filter(inst => inst.status === 'running').length * 2;
              const isErrorBlock = i === 191 && instances.some(inst => inst.status === 'error');
              
              const color = isErrorBlock ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse' : 
                            isActiveBlock ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                            'bg-[#0a150a] border border-green-900/30';
              return (
                <div 
                  key={i} 
                  className={`aspect-square w-full ${color} transition-all duration-500 hover:bg-white hover:scale-125 hover:z-20`}
                  title={`Block 0x${i.toString(16).padStart(4, '0')}`}
                />
              );
            })}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-green-900/30 text-[11px] uppercase tracking-wider">
            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-[#0a150a] border border-green-900 mr-2"></div> Void</div>
            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-500 mr-2 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></div> Active Allocation</div>
            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div> Critical Error</div>
          </div>
        </div>

        <div className="border border-green-900/50 bg-[#020502] p-0 flex flex-col">
          <div className="p-4 border-b border-green-900/30 bg-green-900/10 flex justify-between">
             <h3 className="text-sm text-green-400 uppercase tracking-widest font-bold">Terminal Output</h3>
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <div className="p-4 flex-1 h-64 overflow-hidden text-[11px] leading-relaxed text-green-600 font-mono">
            <p className="mb-2 text-green-400 opacity-50">$ tail -f /var/log/proxmox/celery.log</p>
            {instances.slice(-4).map((inst, idx) => (
              <div key={idx} className="mb-1">
                <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                {inst.status === 'provisioning' || inst.status === 'pending' ? (
                  <span className="text-yellow-400">Allocating new VM: {inst.node_name}...</span>
                ) : inst.status === 'running' ? (
                  <span className="text-green-400">VMID {inst.proxmox_vmid || '*'} booted on node {inst.physical_node || 'N/A'}.</span>
                ) : inst.status === 'destroying' ? (
                  <span className="text-red-400">Executing qm destroy on VMID {inst.proxmox_vmid || '*'}...</span>
                ) : inst.status === 'error' ? (
                  <span className="text-red-500 font-bold">CRITICAL: Task failed for {inst.node_name}.</span>
                ) : (
                  <span>Status Update: {inst.status.toUpperCase()} - {inst.node_name}</span>
                )}
              </div>
            ))}
            <p className="mt-2 text-green-500 animate-pulse">_</p>
          </div>
        </div>
      </div>

      {/* Live Client Sessions */}
      <div className="border border-green-900/50 bg-[#020502] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden mt-8">
        <h3 className="text-sm text-green-400 uppercase tracking-widest p-4 border-b border-green-900/30 bg-gradient-to-r from-green-900/20 to-transparent">Live Client Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-green-700 bg-[#0a150a] border-b border-green-900/30">
              <tr>
                <th className="p-4 font-bold tracking-wider">NODE_TARGET</th>
                <th className="p-4 font-bold tracking-wider">VM_ALLOC</th>
                <th className="p-4 font-bold tracking-wider">STATUS</th>
                <th className="p-4 font-bold tracking-wider">IP_ADDRESS</th>
                <th className="p-4 font-bold tracking-wider">PROTOCOL</th>
                <th className="p-4 font-bold tracking-wider text-right">OVERRIDE</th>
              </tr>
            </thead>
            <tbody className="text-green-500 font-mono">
              {instances.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-green-900 uppercase">No active instances in cluster.</td></tr>
              ) : instances.map((session, i) => (
                <tr key={i} className="border-b border-green-900/10 hover:bg-green-900/20 transition-colors group">
                  <td className="p-4 font-bold text-green-400 group-hover:text-green-300">{session.physical_node || 'Pending'}</td>
                  <td className="p-4">VMID {session.proxmox_vmid || 'WAIT'}</td>
                  <td className={`p-4 font-bold ${session.status === 'error' ? 'text-red-500 animate-pulse' : session.status === 'provisioning' || session.status === 'pending' ? 'text-yellow-500' : session.status === 'running' ? 'text-green-400' : 'text-orange-500'}`}>
                    [{session.status.toUpperCase()}]
                  </td>
                  <td className="p-4">{session.ip_address || '--.--.--.--'}</td>
                  <td className="p-4 text-green-600">{session.os_template.includes("GAMER") ? "Moonlight Protocol" : "SSH / NICE DCV"}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleKill(session.id)}
                      disabled={session.status === 'destroying'}
                      className="text-red-500 hover:bg-red-500 hover:text-black border border-red-900 hover:border-red-500 px-4 py-1.5 rounded-[3px] transition-all uppercase tracking-widest text-[10px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                      {session.status === 'destroying' || session.status === 'stopping' ? "TERMINATING..." : "KILL"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Identities & Access Control */}
      <div className="border border-green-900/50 bg-[#020502] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden mt-8">
        <div className="flex justify-between items-center p-4 border-b border-green-900/30 bg-gradient-to-r from-green-900/20 to-transparent">
          <h3 className="text-sm text-green-400 uppercase tracking-widest">Identities & Access Control</h3>
          <div className="flex gap-2">
             <button disabled={userPage === 0} onClick={() => setUserPage(userPage - 1)} className="px-3 py-1 bg-green-900/40 border border-green-900 hover:bg-green-800 disabled:opacity-30 text-xs font-bold uppercase text-green-400">Past</button>
             <button onClick={() => setUserPage(userPage + 1)} className="px-3 py-1 bg-green-900/40 border border-green-900 hover:bg-green-800 text-xs font-bold uppercase text-green-400">Next</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-green-700 bg-[#0a150a] border-b border-green-900/30">
              <tr>
                <th className="p-4 font-bold tracking-wider">ID</th>
                <th className="p-4 font-bold tracking-wider">EMAIL</th>
                <th className="p-4 font-bold tracking-wider">ROLE</th>
                <th className="p-4 font-bold tracking-wider">WALLET</th>
                <th className="p-4 font-bold tracking-wider">STATUS</th>
                <th className="p-4 font-bold tracking-wider text-right">ADMIN MODIFIERS</th>
              </tr>
            </thead>
            <tbody className="text-green-500 font-mono">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-green-900 uppercase">No registered identities found on page {userPage}.</td></tr>
              ) : users.map((u, i) => {
                const isB2B = u.role === 'B2B' || u.role === 'b2b_enterprise';
                return (
                <tr key={i} className="border-b border-green-900/10 hover:bg-green-900/20 transition-colors group">
                  <td className="p-4 opacity-50">#{u.id} {u.is_admin ? <span className="text-yellow-500 font-bold ml-1">(OMEGA)</span> : ''}</td>
                  <td className="p-4 font-bold text-green-400">{u.email} <span className="text-[10px] text-green-700 ml-2">[{u.sso_provider}]</span></td>
                  <td className={`p-4 font-bold uppercase ${isB2B ? 'text-blue-500' : 'text-purple-500'}`}>{u.role.replace('_', ' ')}</td>
                  <td className="p-4">{u.balance_hours.toFixed(2)} HRS</td>
                  <td className="p-4">
                     {u.is_banned ? <span className="text-red-500 font-black animate-pulse">[BANNED]</span> : u.is_active ? <span className="text-green-600">[ACTIVE]</span> : <span className="text-zinc-500">[PURGED]</span>}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* NEW: Admin Toggle */}
                    <button 
                      onClick={() => handleToggleAdmin(u.id, u.is_admin)} 
                      className={`px-3 py-1 border transition-all text-[10px] uppercase font-bold shadow-sm ${u.is_admin ? 'border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/30' : 'border-green-900 text-green-600 hover:text-white hover:bg-green-900'}`}
                    >
                      {u.is_admin ? 'Revoke Omega' : 'Grant Omega'}
                    </button>

                    <button onClick={() => handleToggleRole(u.id, u.role)} className="px-3 py-1 border border-green-900 text-green-600 hover:text-white hover:bg-green-900 transition-colors text-[10px] uppercase font-bold">Swap Role</button>
                    <button onClick={() => handleAddWallet(u.id)} className="px-3 py-1 border border-green-900 text-green-600 hover:text-white hover:bg-green-900 transition-colors text-[10px] uppercase font-bold">Ledger +/-</button>
                    
                    {!u.is_banned && (
                       <button onClick={() => handleBanUser(u.id)} className="px-3 py-1 border border-red-900 text-red-600 hover:text-white hover:bg-red-900 transition-all text-[10px] uppercase font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]">Ban</button>
                    )}
                    {u.is_active && (
                       <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 border border-red-900/50 text-red-900 hover:bg-black transition-colors text-[10px] uppercase font-bold opacity-50 hover:opacity-100">Purge</button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}