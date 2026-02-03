import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'pending' | 'streaming' | 'completed' | 'error';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusColors = {
  online: 'bg-teal-400',
  offline: 'bg-zinc-500',
  busy: 'bg-amber-400',
  pending: 'bg-amber-400',
  streaming: 'bg-cyan-400',
  completed: 'bg-teal-400',
  error: 'bg-red-400'
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  pulse = true,
  className 
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status],
        sizeClasses[size],
        pulse && (status === 'pending' || status === 'streaming' || status === 'busy') && 'animate-status-pulse',
        className
      )}
    />
  );
}
