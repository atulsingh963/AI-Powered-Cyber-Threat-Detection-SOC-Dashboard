'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { Incident } from '@/types';
import { Search, Filter, AlertTriangle, ShieldCheck, User, RefreshCw } from 'lucide-react';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({
        search: search || undefined,
        severity: severity || undefined,
        status: status || undefined,
      });
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [severity, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIncidents();
  };

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await api.updateIncidentStatus(incidentId, { status: newStatus });
      loadIncidents();
    } catch (e) {
      alert('Failed to update incident status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <span>Security Incidents Matrix</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage, investigate, assign, and resolve correlated security incidents.
              </p>
            </div>

            <button
              onClick={loadIncidents}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Matrix</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, Title, or Description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </form>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Severity Filter */}
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
              </select>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Title / Description</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Loading incident telemetry...
                      </td>
                    </tr>
                  ) : incidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No incidents match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-sky-400">
                          <Link href={`/incidents/${inc.id}`} className="hover:underline">
                            {inc.incident_id}
                          </Link>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-slate-100 line-clamp-1">{inc.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{inc.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <SeverityBadge severity={inc.severity} />
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {inc.category}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={inc.status}
                            onChange={(e) => handleStatusChange(inc.incident_id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-sky-500 font-mono"
                          >
                            <option value="NEW">NEW</option>
                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                            <option value="INVESTIGATING">INVESTIGATING</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {inc.event_count}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {Math.round((inc.confidence || 0.85) * 100)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="px-3 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-semibold transition-colors"
                          >
                            Investigate &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
