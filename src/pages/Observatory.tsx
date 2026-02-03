import { useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Filter,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopologyGraph } from '@/components/custom/TopologyGraph';
import { AnimatedGrid } from '@/components/custom/AnimatedGrid';
import { mockAgentNodes, mockAgentEdges, mockAgents, mockTenants } from '@/lib/mock-data';
import type { AgentNode } from '@/types/mcp';

const nodeTypeLabels: Record<string, string> = {
  orchestrator: 'Orchestrator',
  worker: 'Worker',
  gateway: 'Gateway',
  observer: 'Observer'
};

const nodeTypeColors: Record<string, string> = {
  orchestrator: 'bg-purple-500',
  worker: 'bg-cyan-500',
  gateway: 'bg-amber-500',
  observer: 'bg-teal-500'
};

export function Observatory() {
  const [paused, setPaused] = useState(false);
  const [, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [filteredTenant, setFilteredTenant] = useState<string | null>(null);

  // Filter nodes by tenant
  const filteredNodes = mockAgentNodes.filter((node) => {
    const agent = mockAgents.find((a) => a.id === node.id);
    if (!agent) return false;
    if (filteredTenant) {
      return agent.tenant_id === filteredTenant;
    }
    return true;
  });

  // Filter edges to only show connections between visible nodes
  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = mockAgentEdges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  const handleNodeClick = useCallback((node: AgentNode) => {
    setSelectedNode(node);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.5));

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Observatory</h1>
              <p className="text-sm text-zinc-500">
                Real-time visualization of agent message passing
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Tenant Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select
                  value={filteredTenant || ''}
                  onChange={(e) => setFilteredTenant(e.target.value || null)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2"
                >
                  <option value="">All Tenants</option>
                  {mockTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? (
                    <Play className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <Pause className="w-4 h-4 text-zinc-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="w-4 h-4 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Graph Area */}
        <div className="flex-1 relative">
          <AnimatedGrid className="opacity-30" dense />
          
          <div className="absolute inset-4">
            <TopologyGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              width={window.innerWidth - 400}
              height={window.innerHeight - 200}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
              paused={paused}
            />
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Agent Types</h3>
            <div className="space-y-2">
              {Object.entries(nodeTypeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-full', nodeTypeColors[type])} />
                  <span className="text-sm text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="absolute top-4 left-4 glass-panel rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-100">
                  {filteredNodes.length}
                </div>
                <div className="text-xs text-zinc-500">Agents</div>
              </div>
              <div className="w-px h-10 bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-100">
                  {filteredEdges.length}
                </div>
                <div className="text-xs text-zinc-500">Connections</div>
              </div>
              <div className="w-px h-10 bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {filteredEdges.reduce((sum, e) => sum + e.message_count, 0).toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">Messages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-xl overflow-y-auto">
          {selectedNode ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Agent Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedNode(null)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {(() => {
                const agent = mockAgents.find((a) => a.id === selectedNode.id);
                if (!agent) return null;

                return (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          nodeTypeColors[agent.type]
                        )}>
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-100">{agent.name}</h3>
                          <span className="text-xs text-zinc-500 capitalize">
                            {agent.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Status</span>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              agent.status === 'online' && 'bg-teal-500/10 text-teal-400',
                              agent.status === 'busy' && 'bg-amber-500/10 text-amber-400',
                              agent.status === 'offline' && 'bg-zinc-500/10 text-zinc-400'
                            )}
                          >
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Tenant</span>
                          <span className="text-zinc-300">{agent.tenant_id}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Last Seen</span>
                          <span className="text-zinc-300">
                            {new Date(agent.last_seen).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-300 mb-2">
                        Capabilities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-1 text-xs rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Connected Agents */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-300 mb-2">
                        Connections
                      </h3>
                      <div className="space-y-2">
                        {mockAgentEdges
                          .filter((e) => e.source === agent.id || e.target === agent.id)
                          .map((edge) => {
                            const otherId = edge.source === agent.id ? edge.target : edge.source;
                            const other = mockAgents.find((a) => a.id === otherId);
                            if (!other) return null;

                            return (
                              <div
                                key={edge.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                              >
                                <span className="text-sm text-zinc-300">{other.name}</span>
                                <span className="text-xs text-zinc-500">
                                  {edge.message_count} msgs
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-4">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Agents</h2>
              <div className="space-y-2">
                {filteredNodes.map((node) => {
                  const agent = mockAgents.find((a) => a.id === node.id);
                  if (!agent) return null;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg',
                        'bg-zinc-900 border border-zinc-800',
                        'hover:border-purple-500/50 transition-colors text-left'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full', nodeTypeColors[node.type])} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-300 truncate">
                          {node.name}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">
                          {node.type} • {node.status}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
