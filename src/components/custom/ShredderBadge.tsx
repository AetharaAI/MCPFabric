import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ShredderStatus } from '@/types/mcp';

interface ShredderBadgeProps {
  status: ShredderStatus;
  className?: string;
}

export function ShredderBadge({ status, className }: ShredderBadgeProps) {
  const getIcon = () => {
    if (!status.enabled) return <AlertTriangle className="w-4 h-4" />;
    if (status.pending_deletions > 0) return <Trash2 className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!status.enabled) return 'Shredder Disabled';
    if (status.pending_deletions > 0) return `${status.pending_deletions} pending deletion`;
    return 'Compliant';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              'border transition-all duration-300 cursor-pointer',
              !status.enabled && 'border-amber-500/50 bg-amber-500/10 text-amber-400',
              status.enabled && status.pending_deletions > 0 && 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse',
              status.enabled && status.pending_deletions === 0 && 'border-teal-500/50 bg-teal-500/10 text-teal-400',
              className
            )}
          >
            {getIcon()}
            <span className="hidden sm:inline">{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="bg-zinc-900 border-zinc-800 text-zinc-200"
        >
          <div className="space-y-1">
            <p className="font-medium">Shredder Status</p>
            <p className="text-xs text-zinc-400">
              Retention: {status.retention_days} days
            </p>
            <p className="text-xs text-zinc-400">
              Last run: {new Date(status.last_run).toLocaleString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
