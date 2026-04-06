"use client";
import React, { useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { API_BASE_URL } from '@/app/lib/api';
import TelemetryHeader from '@/components/Admin/TelemetryHeader';
import VramHeatmap from '@/components/Admin/VramHeatmap';
import LiveTerminal from '@/components/Admin/LiveTerminal';
import ActiveSessionsTable from '@/components/Admin/ActiveSessionsTable';
import IdentityControlTable from '@/components/Admin/IdentityControlTable';
import MFAModal from '@/components/Admin/MFAModal';

const WS_BASE_URL = API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://");

export default function AdminDashboard() {
  const isConnected = useAdminStore(state => state.isConnected);
  const setConnectionStatus = useAdminStore(state => state.setConnectionStatus);
  const setTelemetry = useAdminStore(state => state.setTelemetry);
  const addLog = useAdminStore(state => state.addLog);

  useEffect(() => {
    let wsTelemetry: WebSocket;
    let wsLogs: WebSocket;
    const token = localStorage.getItem('token');
    
    if (!token) return;

    const connectSockets = () => {
      wsTelemetry = new WebSocket(`${WS_BASE_URL}/ws/admin/telemetry?token=${token}`);
      wsTelemetry.onopen = () => setConnectionStatus(true);
      wsTelemetry.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data.nodes, data.vram_allocated_pct, data.revenue);
        } catch(e) {}
      };
      wsTelemetry.onclose = () => {
        setConnectionStatus(false);
        setTimeout(connectSockets, 5000); // 5 sec reconnect cycle
      };

      wsLogs = new WebSocket(`${WS_BASE_URL}/ws/admin/logs?token=${token}`);
      wsLogs.onmessage = (event) => addLog(event.data);
    };

    connectSockets();

    return () => {
      if(wsTelemetry) wsTelemetry.close();
      if(wsLogs) wsLogs.close();
    }
  }, []);

  return (
    <>
      <MFAModal />
      
      {/* 
        The React Architecture Shell
        Prop drilling has been eliminated. Sub-components are bound securely to Zustand 
      */}
      <div className={`space-y-6 max-w-7xl mx-auto pb-12 pt-8 transition-all duration-300 ${!isConnected ? 'blur-[10px] pointer-events-none' : ''}`}>
        <TelemetryHeader />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <VramHeatmap />
          <LiveTerminal />
        </div>

        <ActiveSessionsTable />
        <IdentityControlTable />
      </div>

      {/* The Blind Admin Failsafe */}
      {!isConnected && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/20 pointer-events-auto shadow-[inset_0_0_150px_rgba(239,68,68,0.5)]">
           <h1 className="text-red-500 font-black italic text-6xl md:text-8xl w-full text-center uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(239,68,68,1)]">CONNECTION LOST</h1>
           <p className="text-zinc-400 font-bold tracking-widest mt-4 uppercase">Attempting WebSocket Re-Initialization sequence...</p>
           <div className="mt-8 px-6 py-2 border border-red-500 bg-black text-red-500 text-xs font-bold uppercase animate-pulse w-fit">
              Stale Data Protection Active
           </div>
        </div>
      )}
    </>
  );
}