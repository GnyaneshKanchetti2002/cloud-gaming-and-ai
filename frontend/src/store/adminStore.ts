import { create } from 'zustand'

export interface HardwareNode {
  id: string;
  status: string;
  tier: string;
}

interface AdminState {
  nodes: HardwareNode[];
  vramAllocatedPct: number;
  revenue: number;
  isConnected: boolean;
  mfaAction: null | { type: string; payload: any; endpoint: string, method?: string };
  logs: string[];
  setTelemetry: (nodes: HardwareNode[], vramAllocatedPct: number, revenue: number) => void;
  setConnectionStatus: (status: boolean) => void;
  addLog: (log: string) => void;
  requestMfa: (action: string, payload: any, endpoint: string, method?: string) => void;
  clearMfa: () => void;
  killNodeOptimistic: (nodeId: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  nodes: [],
  vramAllocatedPct: 0,
  revenue: 0.0,
  isConnected: true, 
  mfaAction: null,
  logs: [],
  setTelemetry: (nodes, pct, rev) => set({ nodes, vramAllocatedPct: pct, revenue: rev }),
  setConnectionStatus: (status) => set({ isConnected: status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs.slice(-50), log] })),
  requestMfa: (action, payload, endpoint, method="POST") => set({ mfaAction: { type: action, payload, endpoint, method } }),
  clearMfa: () => set({ mfaAction: null }),
  killNodeOptimistic: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status: 'REBOOTING' } : n)
  }))
}));
