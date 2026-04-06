import React, { memo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useShallow } from 'zustand/react/shallow';
import { API_BASE_URL } from '@/app/lib/api';

const ActiveSessionsTable = memo(() => {
  const nodes = useAdminStore(useShallow(state => state.nodes));
  const killOptimistic = useAdminStore(state => state.killNodeOptimistic);

  const handleKill = async (nodeId: string) => {
    // Optimistic UI Updates via Zustand
    killOptimistic(nodeId);
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/internal/kill-node/${nodeId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="border border-green-900/50 bg-[#020502] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden mt-8">
      <h3 className="text-sm text-green-400 uppercase tracking-widest p-4 border-b border-green-900/30 bg-gradient-to-r from-green-900/20 to-transparent">Live Client Sessions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-green-700 bg-[#0a150a] border-b border-green-900/30">
            <tr>
              <th className="p-4 font-bold tracking-wider">PHYSICAL_NODE</th>
              <th className="p-4 font-bold tracking-wider">HARDWARE_STATUS</th>
              <th className="p-4 font-bold tracking-wider">COMPUTE_TIER</th>
              <th className="p-4 font-bold tracking-wider text-right">OVERRIDE</th>
            </tr>
          </thead>
          <tbody className="text-green-500 font-mono">
            {nodes.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-green-900 uppercase">No active hardware mapped to fleet.</td></tr>
            ) : nodes.map((session, i) => (
              <tr key={session.id} className="border-b border-green-900/10 hover:bg-green-900/20 transition-colors group">
                <td className="p-4 font-bold text-green-400 group-hover:text-green-300">{session.id}</td>
                <td className={`p-4 font-bold ${session.status === 'ERROR' ? 'text-red-500 animate-pulse' : session.status === 'IN_USE' ? 'text-green-400' : 'text-orange-500'}`}>
                  [{session.status}]
                </td>
                <td className="p-4 text-green-600">{session.tier}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleKill(session.id)}
                    disabled={session.status === 'REBOOTING' || session.status === 'OFFLINE' || session.status === 'AVAILABLE'}
                    className="text-red-500 hover:bg-red-500 hover:text-black border border-red-900 hover:border-red-500 px-4 py-1.5 rounded-[3px] transition-all uppercase tracking-widest text-[10px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                    {session.status === 'REBOOTING' || session.status === 'OFFLINE' ? "TERMINATING..." : "KILL"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ActiveSessionsTable;
