import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import type { AgentNode, AgentEdge } from '@/types/mcp';

interface TopologyGraphProps {
  nodes: AgentNode[];
  edges: AgentEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: AgentNode) => void;
  selectedNodeId?: string | null;
  paused?: boolean;
  className?: string;
}

const nodeColors = {
  orchestrator: '#a855f7', // purple
  worker: '#06b6d4', // cyan
  gateway: '#f59e0b', // amber
  observer: '#10b981' // teal
};

const nodeSizes = {
  orchestrator: 20,
  worker: 15,
  gateway: 18,
  observer: 12
};

export function TopologyGraph({
  nodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
  selectedNodeId,
  paused = false,
  className
}: TopologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<AgentNode, undefined> | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [hoveredNode, setHoveredNode] = useState<AgentNode | null>(null);

  const handleNodeClick = useCallback((node: AgentNode) => {
    onNodeClick?.(node);
  }, [onNodeClick]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create container for zoom
    const container = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
        container.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Create links
    const linkElements = container
      .append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Create link labels for message count
    const linkLabels = container
      .append('g')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#71717a')
      .attr('text-anchor', 'middle')
      .text((d) => d.message_count > 10 ? `${d.message_count}` : '');

    // Create particle group for animated flow
    const particleGroup = container.append('g').attr('class', 'particles');

    // Create nodes
    const nodeGroup = container
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => handleNodeClick(d))
      .on('mouseenter', (_event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null))
      .call(
        d3.drag<SVGGElement, AgentNode>()
          .on('start', (event, d) => {
            if (!event.active && simulationRef.current) {
              simulationRef.current.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && simulationRef.current) {
              simulationRef.current.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    nodeGroup
      .append('circle')
      .attr('r', (d) => nodeSizes[(d as AgentNode).type])
      .attr('fill', (d) => nodeColors[(d as AgentNode).type])
      .attr('stroke', '#18181b')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.5))');

    // Status indicator
    nodeGroup
      .append('circle')
      .attr('r', 4)
      .attr('cx', (d) => nodeSizes[(d as AgentNode).type] * 0.7)
      .attr('cy', (d) => -nodeSizes[(d as AgentNode).type] * 0.7)
      .attr('fill', (d) => (d as AgentNode).status === 'online' ? '#10b981' : (d as AgentNode).status === 'busy' ? '#f59e0b' : '#71717a')
      .attr('stroke', '#18181b')
      .attr('stroke-width', 1);

    // Node labels
    nodeGroup
      .append('text')
      .text((d) => (d as AgentNode).name)
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#e4e4e7')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => nodeSizes[(d as AgentNode).type] + 16);

    // Selection highlight
    if (selectedNodeId) {
      nodeGroup
        .filter((d) => (d as AgentNode).id === selectedNodeId)
        .append('circle')
        .attr('r', (d) => nodeSizes[(d as AgentNode).type] + 8)
        .attr('fill', 'none')
        .attr('stroke', '#a855f7')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .style('animation', 'spin 10s linear infinite');
    }

    // Simulation
    const simulation = d3
      .forceSimulation<AgentNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<AgentNode, AgentEdge>(edges)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => nodeSizes[(d as AgentNode).type] + 20));

    simulationRef.current = simulation;

    // Animation particles
    const particles: Array<{
      id: string;
      edgeId: string;
      progress: number;
      speed: number;
    }> = [];

    edges.forEach((edge) => {
      for (let i = 0; i < 3; i++) {
        particles.push({
          id: `particle-${edge.id}-${i}`,
          edgeId: edge.id,
          progress: i / 3,
          speed: 0.005 + Math.random() * 0.005
        });
      }
    });

    // Update positions
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => (d as unknown as { source: AgentNode }).source.x!)
        .attr('y1', (d) => (d as unknown as { source: AgentNode }).source.y!)
        .attr('x2', (d) => (d as unknown as { target: AgentNode }).target.x!)
        .attr('y2', (d) => (d as unknown as { target: AgentNode }).target.y!);

      linkLabels
        .attr('x', (d) => {
          const source = (d as unknown as { source: AgentNode }).source;
          const target = (d as unknown as { target: AgentNode }).target;
          return (source.x! + target.x!) / 2;
        })
        .attr('y', (d) => {
          const source = (d as unknown as { source: AgentNode }).source;
          const target = (d as unknown as { target: AgentNode }).target;
          return (source.y! + target.y!) / 2;
        });

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);

      // Update particles
      if (!paused) {
        particles.forEach((particle) => {
          particle.progress += particle.speed;
          if (particle.progress > 1) particle.progress = 0;
        });

        const particleSelection = particleGroup
          .selectAll('circle')
          .data(particles, (d: unknown) => (d as typeof particles[0]).id);

        particleSelection
          .enter()
          .append('circle')
          .attr('r', 3)
          .attr('fill', '#a855f7')
          .attr('opacity', 0.8)
          .merge(particleSelection as unknown as d3.Selection<SVGCircleElement, typeof particles[0], SVGGElement, unknown>)
          .attr('cx', (d) => {
            const edge = edges.find((e) => e.id === d.edgeId);
            if (!edge) return 0;
            const source = (edge as unknown as { source: AgentNode }).source;
            const target = (edge as unknown as { target: AgentNode }).target;
            return source.x! + (target.x! - source.x!) * d.progress;
          })
          .attr('cy', (d) => {
            const edge = edges.find((e) => e.id === d.edgeId);
            if (!edge) return 0;
            const source = (edge as unknown as { source: AgentNode }).source;
            const target = (edge as unknown as { target: AgentNode }).target;
            return source.y! + (target.y! - source.y!) * d.progress;
          });

        particleSelection.exit().remove();
      }
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, handleNodeClick, selectedNodeId, paused]);

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-zinc-950 rounded-lg"
      />
      
      {/* Tooltip */}
      {hoveredNode && (
        <div 
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 shadow-lg"
          style={{
            left: (hoveredNode.x || 0) * transform.k + transform.x + 20,
            top: (hoveredNode.y || 0) * transform.k + transform.y - 10
          }}
        >
          <div className="text-sm font-medium text-zinc-100">{hoveredNode.name}</div>
          <div className="text-xs text-zinc-500 capitalize">{hoveredNode.type}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: hoveredNode.status === 'online' ? '#10b981' : 
                  hoveredNode.status === 'busy' ? '#f59e0b' : '#71717a' 
              }}
            />
            <span className="text-xs text-zinc-400 capitalize">{hoveredNode.status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
