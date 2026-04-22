'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar, type ViewType } from '@/components/sidebar';
import { DashboardView } from '@/components/views/dashboard-view';
import { CallsView } from '@/components/views/calls-view';
import { AppointmentsView } from '@/components/views/appointments-view';
import { PatientsView } from '@/components/views/patients-view';
import { AnalyticsView } from '@/components/views/analytics-view';
import { SettingsView } from '@/components/views/settings-view';
import { VoiceDemoView } from '@/components/views/voice-demo-view';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'calls':
        return <CallsView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'patients':
        return <PatientsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case 'voice-demo':
        return <VoiceDemoView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!isMobile && (
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">DentalVoice AI</h1>
                <p className="text-[10px] text-slate-400">Front Desk Agent</p>
              </div>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          {/* Mobile Nav Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {(['dashboard', 'voice-demo', 'calls', 'appointments', 'patients', 'analytics', 'settings'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeView === view
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {view === 'voice-demo' ? 'Voice Demo' : view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? 'pt-2' : collapsed ? 'ml-[68px]' : 'ml-[260px]'
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
