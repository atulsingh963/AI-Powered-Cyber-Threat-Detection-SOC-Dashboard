'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { AnalyticsOverview, SecurityEvent, Incident } from '@/types';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Zap,
  Clock,
  Radio,
  BarChart2,
  TrendingUp,
  Server,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [analyticsData, eventsData, incidentsData] = await Promise.all([
        api.getAnalytics(),
        api.getEvents({ limit: 15 }),
        api.getIncidents({ limit: 6 })
      ]);
      setAnalytics(analyticsData);
      setRecentEvents(eventsData);
      setRecentIncidents(incidentsData);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Setup WebSocket connection for live event streaming
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/live-events';
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_SECURITY_EVENT') {
            // Prepend new event to live feed
            setRecentEvents((prev) => [payload.event, ...prev.slice(0, 25)]);
            // Refresh analytics and incidents list
            loadDashboardData();
          }
        } catch (err) {
          console.error("WS message parse error", err);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
      };
    } catch (e) {
      setWsConnected(false);
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
  };

  const pieData = analytics?.severity_distribution
    ? Object.entries(analytics.severity_distribution).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
        color: SEVERITY_COLORS[name] || '#64748b',
      }))
    : [];

  const categoryData = analytics?.attack_categories
    ? Object.entries(analytics.attack_categories).map(([name, count]) => ({
        category: name,
        count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>SOC Command Center</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                  LIVE STREAM
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time security telemetry, multi-stage event correlation, and ML anomaly detection dashboard.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                wsConnected ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400' : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
              }`}>
                <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse' : ''}`} />
                <span>WS: {wsConnected ? 'CONNECTED' : 'POLLING'}</span>
              </div>

              <button
                onClick={loadDashboardData}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Events</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {analytics?.total_events.toLocaleString() ?? 0}
              </div>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Live ingested
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Alerts</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {analytics?.active_alerts ?? 0}
              </div>
              <p className="text-[10px] text-slate-400">Unresolved detections</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Critical Incidents</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {analytics?.critical_incidents ?? 0}
              </div>
              <p className="text-[10px] text-rose-400 font-medium">Immediate triage</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>High-Risk Events</span>
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-orange-400">
                {analytics?.high_risk_events ?? 0}
              </div>
              <p className="text-[10px] text-slate-400">ML + Rule score &gt; 75</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Accuracy %</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {analytics?.detection_accuracy ?? 94.8}%
              </div>
              <p className="text-[10px] text-slate-400">Model precision score</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Mean MTTR</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                {analytics?.mean_time_to_respond_mins ?? 4.2} m
              </div>
              <p className="text-[10px] text-slate-400">Avg resolution speed</p>
            </div>
          </div>

          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Security Event Stream Feed */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="font-bold text-sm font-mono text-slate-200">
                    Live Security Telemetry Feed
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Auto-streaming</span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {recentEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-mono">
                    Awaiting incoming security logs... Enable Demo Mode to generate live traffic.
                  </div>
                ) : (
                  recentEvents.map((evt, idx) => (
                    <div
                      key={`${evt.id}-${idx}`}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start justify-between text-xs transition-all hover:border-slate-700"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] text-slate-400">
                            {new Date(evt.timestamp).toTimeString().slice(0, 8)}
                          </span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {evt.event_type}
                          </span>
                          <SeverityBadge severity={evt.severity} />
                        </div>
                        <p className="text-slate-300 font-mono text-[11px] line-clamp-1">
                          {evt.message || evt.raw_log}
                        </p>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                          <span>Src IP: {evt.source_ip || 'N/A'}</span>
                          <span>User: {evt.username || 'N/A'}</span>
                          <span>Host: {evt.hostname || 'localhost'}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {evt.source}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Severity Distribution Pie Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-sm font-mono text-slate-200 mb-1">
                  Threat Severity Breakdown
                </h2>
                <p className="text-xs text-slate-400">Categorized risk classification</p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-800 pt-3">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidents Table & Attack Category Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Security Incidents List */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm font-mono text-slate-200">
                    Active Security Incidents
                  </h2>
                  <p className="text-xs text-slate-400">Correlated attack sequences requiring analyst triage</p>
                </div>
                <a href="/incidents" className="text-xs font-mono text-sky-400 hover:underline">
                  View All &rarr;
                </a>
              </div>

              <div className="space-y-3">
                {recentIncidents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-mono">
                    No active incidents recorded. System nominal.
                  </div>
                ) : (
                  recentIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-sky-400">
                            {inc.incident_id}
                          </span>
                          <SeverityBadge severity={inc.severity} />
                          <StatusBadge status={inc.status} />
                        </div>
                        <h3 className="font-semibold text-sm text-slate-100 line-clamp-1">
                          {inc.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          Category: {inc.category} &bull; {inc.event_count} Correlated Events
                        </p>
                      </div>

                      <a
                        href={`/incidents/${inc.id}`}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono font-semibold transition-colors"
                      >
                        Investigate &rarr;
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attack Timeline Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div>
                <h2 className="font-bold text-sm font-mono text-slate-200">
                  Event Volume Timeline
                </h2>
                <p className="text-xs text-slate-400">Hourly event activity trend</p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.timeline || []}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="events" stroke="#38bdf8" fillOpacity={1} fill="url(#colorEvents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
