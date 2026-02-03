import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AsyncOperation } from '@/types/mcp';

interface AsyncQueueProps {
  operations: AsyncOperation[];
  onCancel?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Pending'
  },
  streaming: {
    icon: Loader2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    label: 'Streaming'
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    label: 'Completed'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Error'
  }
};

function OperationCard({ 
  operation, 
  onCancel 
}: { 
  operation: AsyncOperation; 
  onCancel?: (id: string) => void;
}) {
  const config = statusConfig[operation.status];
  const StatusIcon = config.icon;
  const isActive = operation.status === 'pending' || operation.status === 'streaming';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'p-4 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', config.color, operation.status === 'streaming' && 'animate-spin')} />
          <span className={cn('text-sm font-medium', config.color)}>
            {config.label}
          </span>
        </div>
        
        {isActive && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-red-400"
            onClick={() => onCancel(operation.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Operation Info */}
      <div className="mb-3">
        <div className="text-sm font-mono text-zinc-300 truncate">
          {operation.type}
        </div>
        <div className="text-xs text-zinc-500">
          {operation.agent_id} • {operation.tenant_id}
        </div>
      </div>

      {/* Progress */}
      {operation.status !== 'completed' && operation.status !== 'error' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Progress</span>
            <span className={config.color}>{operation.progress}%</span>
          </div>
          <Progress 
            value={operation.progress} 
            className="h-1.5 bg-zinc-800"
          />
        </div>
      )}

      {/* Error Message */}
      {operation.error && (
        <div className="mt-3 p-2 rounded bg-red-950/50 border border-red-900/50">
          <p className="text-xs text-red-400">{operation.error}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-600">
        <span>Created: {new Date(operation.created_at).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

export function AsyncQueue({
  operations,
  onCancel,
  className
}: AsyncQueueProps) {
  const [filter, setFilter] = useState<'all' | AsyncOperation['status']>('all');

  const filteredOperations = operations.filter(
    (op) => filter === 'all' || op.status === filter
  );

  const activeCount = operations.filter(
    (op) => op.status === 'pending' || op.status === 'streaming'
  ).length;

  return (
    <div className={cn(
      'flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Async Queue</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {activeCount} active
            </span>
          )}
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {(['all', 'pending', 'streaming', 'completed', 'error'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                filter === f 
                  ? 'bg-zinc-800 text-zinc-200' 
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Operations List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredOperations.map((operation) => (
              <OperationCard
                key={operation.id}
                operation={operation}
                onCancel={onCancel}
              />
            ))}
          </AnimatePresence>
          
          {filteredOperations.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No operations</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
