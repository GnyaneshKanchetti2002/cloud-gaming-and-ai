import React, { memo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useShallow } from 'zustand/react/shallow';

const LiveTerminal = memo(() => {
  const logs = useAdminStore(useShallow(state => state.logs));

  return (
    <div className="border border-green-900/50 bg-[#020502] p-0 flex flex-col">
      <div className="p-4 border-b border-green-900/30 bg-green-900/10 flex justify-between items-center">
         <h3 className="text-sm text-green-400 uppercase tracking-widest font-bold">Terminal Output</h3>
         <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
      </div>
      <div className="p-4 flex-1 h-64 overflow-hidden text-[11px] leading-relaxed text-green-600 font-mono flex flex-col-reverse justify-start">
        <div>
          <p className="mb-2 text-green-400 opacity-50">$ stream wss://api.nexusgp.com/ws/admin/logs</p>
          {logs.map((log, idx) => (
             <div key={idx} className="mb-1">{log}</div>
          ))}
          <p className="mt-2 text-green-500 animate-pulse">_</p>
        </div>
      </div>
    </div>
  );
});

export default LiveTerminal;
