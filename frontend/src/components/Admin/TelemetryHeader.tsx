import React, { memo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useShallow } from 'zustand/react/shallow';

const TelemetryHeader = memo(() => {
  const nodes = useAdminStore(useShallow(state => state.nodes));
  const requestMfa = useAdminStore(state => state.requestMfa);
  const revenue = useAdminStore(state => state.revenue);

  const handleHaltClick = () => {
    // Requires MFA
    requestMfa("CLUSTER_HALT", null, "/admin/fleet/halt", "POST");
  };

  const provisionOps = nodes.filter(i => i.status === 'PROVISIONING' || i.status === 'PENDING').length;
  const errorFlags = nodes.filter(i => i.status === 'ERROR').length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-green-900/50 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">DATACENTER TELEMETRY</h1>
          <p className="text-xs text-green-600 mt-1 uppercase">Live Data // Proxmox VE Cluster 01</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button 
            onClick={handleHaltClick}
            className="px-4 py-1.5 bg-red-950/80 border border-red-500 rounded text-red-500 text-[10px] font-bold animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer hover:bg-red-900 hover:text-white transition-colors"
          >
            INITIATE CLUSTER HALT
          </button>
          <div className="px-3 py-1.5 border border-green-900/50 bg-[#020502]">
            <span className="text-xs text-green-600">UPTIME: </span>
            <span className="text-xs font-bold text-green-400">99.999%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Provision Operations", value: provisionOps.toString(), unit: "jobs", color: "text-green-400" },
          { label: "Avg API Latency", value: "14", unit: "ms", color: "text-green-400" },
          { label: "Current Hourly Revenue", value: `$${revenue.toFixed(2)}`, unit: "/hr", color: "text-green-400" },
          { label: "Active Error Flags", value: errorFlags.toString(), unit: "nodes", color: "text-red-500", boxClass: "border-red-900/50 bg-red-950/10", animated: true },
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
    </>
  );
});

export default TelemetryHeader;
