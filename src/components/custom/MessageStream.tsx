import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusIndicator } from './StatusIndicator';
import type { EventEnvelope } from '@/types/mcp';

interface MessageStreamProps {
  messages: EventEnvelope[];
  selectedId?: string | null;
  onSelect?: (message: EventEnvelope) => void;
  autoScroll?: boolean;
  className?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  streaming: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  completed: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30'
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

function truncateId(id: string): string {
  return id.slice(0, 8);
}

export function MessageStream({
  messages,
  selectedId,
  onSelect,
  autoScroll = true,
  className
}: MessageStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Event Stream</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-500">
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            messages.length > 0 ? 'bg-teal-400 animate-pulse' : 'bg-zinc-600'
          )} />
          <span className="text-xs text-zinc-500">Live</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2 space-y-1">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.trace_id + index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelect?.(message)}
                className={cn(
                  'group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer',
                  'hover:bg-zinc-900 transition-colors',
                  selectedId === message.trace_id && 'bg-zinc-900 border border-zinc-700'
                )}
              >
                {/* Timestamp */}
                <span className="text-xs font-mono text-zinc-600 w-16 flex-shrink-0">
                  {formatTimestamp(message.timestamp)}
                </span>

                {/* Status */}
                <StatusIndicator 
                  status={message.status} 
                  size="sm" 
                  pulse={message.status === 'pending' || message.status === 'streaming'}
                />

                {/* Agent ID */}
                <span className="text-xs font-mono text-zinc-500 w-20 flex-shrink-0 truncate">
                  {truncateId(message.agent_id)}
                </span>

                {/* Event Type */}
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded border',
                  statusColors[message.status]
                )}>
                  {message.event_type}
                </span>

                {/* Operation ID */}
                <span className="text-xs font-mono text-zinc-600 truncate flex-1">
                  {truncateId(message.operation_id)}
                </span>

                {/* Tenant */}
                <span className="text-xs text-zinc-600 hidden sm:inline">
                  {message.tenant_id.split('-')[1]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
