import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';

const glowButtonVariants = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: [
          'bg-purple-600 hover:bg-purple-500',
          'text-white',
          'hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]'
        ],
        outline: [
          'bg-transparent border border-purple-500/50',
          'text-purple-400 hover:text-purple-300',
          'hover:border-purple-400',
          'hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]'
        ],
        cyan: [
          'bg-cyan-600 hover:bg-cyan-500',
          'text-white',
          'hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'
        ],
        ghost: [
          'bg-transparent hover:bg-white/5',
          'text-zinc-300 hover:text-white'
        ]
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 px-4 text-sm',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButtonVariants> {
  asChild?: boolean;
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Button
        className={cn(glowButtonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

GlowButton.displayName = 'GlowButton';

export { GlowButton, glowButtonVariants };
