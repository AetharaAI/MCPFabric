import { cn } from '@/lib/utils';

interface AnimatedGridProps {
  className?: string;
  dense?: boolean;
  animated?: boolean;
}

export function AnimatedGrid({ 
  className, 
  dense = false,
  animated = true 
}: AnimatedGridProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        dense ? 'grid-bg-dense' : 'grid-bg',
        animated && 'animate-grid-drift',
        className
      )}
      style={{
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
      }}
    />
  );
}
