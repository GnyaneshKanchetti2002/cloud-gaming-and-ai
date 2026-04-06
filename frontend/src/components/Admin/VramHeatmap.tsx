import React, { memo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useShallow } from 'zustand/react/shallow';

const VramHeatmap = memo(() => {
  const nodes = useAdminStore(useShallow(state => state.nodes));
  const pct = useAdminStore(state => state.vramAllocatedPct);

  return (
    <div className="xl:col-span-2 border border-green-900/50 bg-[#020502] p-6 relative">
      <div className="absolute top-0 right-0 p-2 opacity-30">
        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s-8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>
      
      <h3 className="text-sm text-green-400 uppercase tracking-widest mb-6 border-b border-green-900/30 pb-2 flex items-center">
        VRAM Capacity Heatmap <span className="text-green-700 text-[10px] ml-3">({pct.toFixed(1)}% Allocated)</span>
      </h3>
      
      <div className="grid grid-cols-16 md:grid-cols-24 gap-1 sm:gap-1.5 relative z-10">
        {Array.from({length: 192}).map((_, i) => {
          const isActiveBlock = i < Math.floor(192 * (pct / 100));
          const isErrorBlock = i === 191 && nodes.some(inst => inst.status === 'ERROR');
          
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
  );
});

export default VramHeatmap;
