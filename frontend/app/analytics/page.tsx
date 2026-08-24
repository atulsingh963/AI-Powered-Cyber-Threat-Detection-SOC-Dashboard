'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { AnalyticsOverview } from '@/types';
import { BarChart3, TrendingUp, ShieldAlert, Cpu, Activity, Clock, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryData = analytics?.attack_categories
    ? Object.entries(analytics.attack_categories).map(([name, count]) => ({
        category: name,
        incidents: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-sky-400" />
                <span>Security Analytics & Performance</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Detection accuracy statistics, threat source intelligence, and SOC operational response metrics.
              </p>
            </div>

            <button
              onClick={loadData}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Model Accuracy & Response Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-mono text-xs">Precision Score</span>
              <p className="text-3xl font-bold font-mono text-emerald-400">94.8%</p>
              <p className="text-[11px] text-slate-400">True Positive ratio</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-mono text-xs">Recall Score</span>
              <p className="text-3xl font-bold font-mono text-sky-400">92.5%</p>
              <p className="text-[11px] text-slate-400">Threat sensitivity</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-mono text-xs">F1 Metric</span>
              <p className="text-3xl font-bold font-mono text-purple-400">93.6%</p>
              <p className="text-[11px] text-slate-400">Balanced accuracy score</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-mono text-xs">Mean Time to Respond</span>
              <p className="text-3xl font-bold font-mono text-amber-400">4.2 mins</p>
              <p className="text-[11px] text-slate-400">Analyst triage velocity</p>
            </div>
          </div>

          {/* Top Threat Sources & Incident Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Source IPs */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm font-mono text-slate-200">
                Top Malicious Source IPs
              </h2>
              <div className="space-y-3 font-mono text-xs">
                {analytics?.top_source_ips?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-sky-400 font-bold">#{idx + 1}</span>
                      <span className="text-slate-200 font-semibold">{item.ip}</span>
                    </div>
                    <span className="text-amber-400 font-bold">{item.count} Security Events</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Category Breakdown Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm font-mono text-slate-200">
                Incident Category Breakdown
              </h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '12px' }} />
                    <Bar dataKey="incidents" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
