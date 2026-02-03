import { useState } from 'react';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tenant } from '@/types/mcp';

interface TenantSwitcherProps {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  onChange: (tenant: Tenant) => void;
  className?: string;
}

export function TenantSwitcher({ 
  tenants, 
  currentTenant, 
  onChange,
  className 
}: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 px-3 py-2 h-9',
            'hover:bg-white/5',
            className
          )}
        >
          <Building2 className="w-4 h-4 text-zinc-400" />
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentTenant?.color || '#71717a' }}
          />
          <span className="text-sm text-zinc-200">
            {currentTenant?.name || 'Select Tenant'}
          </span>
          <ChevronDown className={cn(
            'w-4 h-4 text-zinc-400 transition-transform',
            open && 'rotate-180'
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-zinc-900 border-zinc-800"
      >
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => {
              onChange(tenant);
              setOpen(false);
            }}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              'hover:bg-white/5 focus:bg-white/5'
            )}
          >
            <span 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tenant.color }}
            />
            <span className="flex-1 text-zinc-200">{tenant.name}</span>
            {currentTenant?.id === tenant.id && (
              <Check className="w-4 h-4 text-purple-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
