'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { HealthStatus } from '@/types';
import { HeartPulse, CheckCircle2, AlertCircle, RefreshCw, Cpu, Database, Server, Bot, Play } from 'lucide-react';

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-emerald-400" />
                <span>System Health & Service Diagnostics</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Monitor database connectivity, ML model availability, LLM status, and background event simulation tasks.
              </p>
            </div>

            <button
              onClick={loadHealth}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Health</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>FastAPI Application Engine</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-800">
                  {health?.api || 'ONLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">High-performance async REST & WebSocket server.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Database Layer</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-800">
                  {health?.database || 'ONLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">PostgreSQL / SQLite relational event log storage.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  <span>Isolation Forest ML Engine</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-800">
                  {health?.ml_service || 'ONLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Scikit-learn real-time anomaly detection inference model.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>Ollama AI Security Analyst</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 text-xs font-mono font-bold border border-sky-800">
                  {health?.ollama || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">LLM service with automatic deterministic fallback engine.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-rose-400" />
                  <span>Attack Simulator</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-800">
                  {health?.simulator || 'READY'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Background synthetic security scenario generator.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
