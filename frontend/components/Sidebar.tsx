'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Sliders,
  BarChart3,
  HeartPulse,
  Home,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'SOC Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Incidents Matrix', href: '/incidents', icon: AlertTriangle },
    { label: 'Event Explorer', href: '/events', icon: FileText },
    { label: 'Detection Rules', href: '/rules', icon: Sliders },
    { label: 'Security Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'System Health', href: '/health', icon: HeartPulse },
    { label: 'Product Landing', href: '/', icon: Home },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur-md flex flex-col justify-between shrink-0">
      <div className="py-4">
        <div className="px-4 mb-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            SOC Navigation
          </p>
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* SOC Operational Box */}
      <div className="p-4 m-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
        <div className="flex items-center space-x-2 text-sky-400 mb-1 font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Active SOC Defense</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Rule engine & ML anomaly detection running concurrently.
        </p>
      </div>
    </aside>
  );
};
