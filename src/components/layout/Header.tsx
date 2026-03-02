import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Activity, 
  Box, 
  Telescope, 
  Terminal, 
  Play,
  Cpu,
  BookOpen,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenantSwitcher } from '@/components/custom/TenantSwitcher';
import { ShredderBadge } from '@/components/custom/ShredderBadge';
import { StatusIndicator } from '@/components/custom/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { mockTenants, mockShredderStatus } from '@/lib/mock-data';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', label: 'Home', icon: Box },
  { path: '/registry', label: 'Registry', icon: Box },
  { path: '/observatory', label: 'Observatory', icon: Telescope },
  { path: '/console', label: 'Console', icon: Terminal },
  { path: '/playground', label: 'Playground', icon: Play },
  { path: '/api-keys', label: 'API Keys', icon: KeyRound },
  { path: '/docs', label: 'Docs', icon: BookOpen },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentTenant, setCurrentTenant } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50" />
      
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Cpu className="w-7 h-7 text-purple-400 transition-all duration-300 group-hover:text-purple-300" />
              <div className="absolute inset-0 blur-lg bg-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-semibold text-zinc-100">
              MCP<span className="text-purple-400">Fabric</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-colors',
                    'text-zinc-400 hover:text-zinc-100',
                    isActive && 'text-zinc-100'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            <TenantSwitcher 
              tenants={mockTenants}
              currentTenant={currentTenant || mockTenants[0]}
              onChange={setCurrentTenant}
            />
            
            <div className="h-6 w-px bg-zinc-800" />
            
            <ShredderBadge status={mockShredderStatus} />
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
              <StatusIndicator status="online" size="sm" pulse={false} />
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-400">Live</span>
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-72 bg-zinc-950 border-zinc-800"
            >
              <div className="flex flex-col gap-6 mt-8">
                <TenantSwitcher 
                  tenants={mockTenants}
                  currentTenant={currentTenant || mockTenants[0]}
                  onChange={(tenant) => {
                    setCurrentTenant(tenant);
                    setMobileOpen(false);
                  }}
                  className="w-full justify-start"
                />
                
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg',
                          'text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
                          isActive && 'text-zinc-100 bg-white/5'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="pt-4 border-t border-zinc-800">
                  <ShredderBadge status={mockShredderStatus} className="w-full justify-center" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
