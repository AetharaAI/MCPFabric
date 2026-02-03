import { create } from 'zustand';
import type { Agent, Tenant, EventEnvelope, AsyncOperation } from '@/types/mcp';

interface AppState {
  // Tenant
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  
  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agent: Agent) => void;
  
  // Events
  events: EventEnvelope[];
  addEvent: (event: EventEnvelope) => void;
  clearEvents: () => void;
  
  // Operations
  operations: AsyncOperation[];
  addOperation: (operation: AsyncOperation) => void;
  updateOperation: (operation: AsyncOperation) => void;
  removeOperation: (id: string) => void;
  
  // UI State
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  
  // Console
  consoleFilter: 'all' | 'info' | 'warn' | 'error' | 'debug';
  setConsoleFilter: (filter: 'all' | 'info' | 'warn' | 'error' | 'debug') => void;
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
  
  // Observatory
  observatoryPaused: boolean;
  setObservatoryPaused: (paused: boolean) => void;
  observatoryZoom: number;
  setObservatoryZoom: (zoom: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Tenant
  currentTenant: null,
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  
  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgent: (agent) => set((state) => ({
    agents: state.agents.map((a) => (a.id === agent.id ? agent : a))
  })),
  
  // Events
  events: [],
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 1000) // Keep last 1000
  })),
  clearEvents: () => set({ events: [] }),
  
  // Operations
  operations: [],
  addOperation: (operation) => set((state) => ({
    operations: [operation, ...state.operations]
  })),
  updateOperation: (operation) => set((state) => ({
    operations: state.operations.map((o) => (o.id === operation.id ? operation : o))
  })),
  removeOperation: (id) => set((state) => ({
    operations: state.operations.filter((o) => o.id !== id)
  })),
  
  // UI State
  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  
  // Console
  consoleFilter: 'all',
  setConsoleFilter: (filter) => set({ consoleFilter: filter }),
  autoScroll: true,
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  
  // Observatory
  observatoryPaused: false,
  setObservatoryPaused: (paused) => set({ observatoryPaused: paused }),
  observatoryZoom: 1,
  setObservatoryZoom: (zoom) => set({ observatoryZoom: zoom })
}));
