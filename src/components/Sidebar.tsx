import React from 'react';
import {
  Activity,
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Network,
  Plus,
  Send,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';

export type PortalTab =
  | 'overview'
  | 'send-request'
  | 'emergency-requests'
  | 'patients'
  | 'audit-log'
  | 'hospital-network'
  | 'settings';

interface SidebarProps {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  pendingRequestCount: number;
  onSignOut: () => void;
  onNavigateHome: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingRequestCount,
  onSignOut,
  onNavigateHome,
}) => {
  const menuItems = [
    {
      id: 'overview' as PortalTab,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'send-request' as PortalTab,
      label: 'New Emergency Request',
      icon: Send,
    },
    {
      id: 'emergency-requests' as PortalTab,
      label: 'Emergency Requests',
      icon: ShieldAlert,
      badge: pendingRequestCount > 0 ? pendingRequestCount : null,
    },
    {
      id: 'patients' as PortalTab,
      label: 'Patients',
      icon: Users,
    },
    {
      id: 'audit-log' as PortalTab,
      label: 'Audit Log',
      icon: FileText,
    },
    {
      id: 'hospital-network' as PortalTab,
      label: 'Hospital Network',
      icon: Network,
    },
    {
      id: 'settings' as PortalTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div
          className="p-6 border-b border-slate-100 flex items-center gap-3 cursor-pointer"
          onClick={onNavigateHome}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Plus className="h-5 w-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-blue-950 block leading-tight">
              PULSEKEY
            </span>
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase block">
              Emergency Health Exchange
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sign Out Action at Bottom */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
