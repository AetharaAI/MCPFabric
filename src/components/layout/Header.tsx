import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Activity, 
  Box, 
  Telescope, 
  Terminal, 
  Play,
  BookOpen,
  KeyRound,
  LogIn,
  LogOut,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FabricTelemetryBadge } from '@/components/custom/FabricTelemetryBadge';
import { StatusIndicator } from '@/components/custom/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/auth/AuthContext';
import brandSymbol from '../../../logos/logo/mcp-symbol-256.png';
import brandHeader from '../../../logos/header/mcp-header-800.png';

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
  const { session, isAuthenticated, login, logout } = useAuth();

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
              <img
                src={brandSymbol}
                alt="MCP Fabric symbol"
                className="w-8 h-8 object-contain transition-all duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 blur-lg bg-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <img
              src={brandHeader}
              alt="MCP Fabric"
              className="h-7 w-auto object-contain"
            />
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
            <FabricTelemetryBadge />
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
              <StatusIndicator status="online" size="sm" pulse={false} />
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-400">Live</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <UserCircle2 className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm">
                    {session?.user.preferred_username || session?.user.email || session?.user.name || 'Signed In'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => void logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void login()}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
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
                <FabricTelemetryBadge className="w-full justify-center" />

                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-200">
                      <UserCircle2 className="w-5 h-5 text-cyan-300" />
                      <span>{session?.user.preferred_username || session?.user.email || session?.user.name || 'Signed In'}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false);
                        void logout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      void login();
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
                
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
