'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  Users,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export type ViewType = 'dashboard' | 'calls' | 'appointments' | 'patients' | 'settings' | 'analytics' | 'voice-demo';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'voice-demo', label: 'Voice Demo', icon: Mic },
  { id: 'calls', label: 'Call History', icon: Phone },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Agent Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-100', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Phone className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">DentalVoice AI</h1>
            <p className="text-[10px] text-slate-400 font-medium">Front Desk Agent</p>
          </div>
        )}
      </div>

      {/* Agent Status */}
      <div className={cn('px-4 py-3', collapsed && 'px-2')}>
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100',
          collapsed && 'justify-center px-2'
        )}>
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-700">Agent Online</p>
              <p className="text-[10px] text-emerald-600">Ready for calls</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (collapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'flex items-center justify-center w-full h-10 rounded-lg transition-all duration-150',
                      isActive
                        ? 'bg-teal-50 text-teal-700 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive && 'text-teal-600')} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-teal-600')} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('p-3 border-t border-slate-100', collapsed && 'p-2')}>
        {!collapsed && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold px-2 py-0.5">
                <Activity className="w-3 h-3 mr-1" />
                Production Mode
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-slate-500 font-medium">HIPAA Compliant</span>
            </div>
          </div>
        )}
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'w-full h-8 text-slate-400 hover:text-slate-600',
            collapsed ? 'justify-center px-0' : 'justify-start'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 mr-2" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
