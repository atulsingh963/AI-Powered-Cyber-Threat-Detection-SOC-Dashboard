'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import { SecurityEvent } from '@/types';
import { Search, Filter, FileText, Database, RefreshCw } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents({
        limit: 100,
        search: search || undefined,
        severity: severity || undefined,
      });
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [severity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-400" />
                <span>Security Event Explorer</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Inspect raw and normalized security event logs across Linux auth, Nginx web, app logs, and synthetic events.
              </p>
            </div>

            <button
              onClick={loadEvents}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log Stream</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw logs, IP, username, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </form>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-mono">Severity:</span>
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
            </div>
          </div>

          {/* Events Log Table */}
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Source IP</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Message / Raw Log</th>
                    <th className="py-3 px-4">Source Adapter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Querying log store...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No security events found matching query.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-sky-400">
                          {evt.event_type}
                        </td>
                        <td className="py-3 px-4">
                          <SeverityBadge severity={evt.severity} />
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {evt.source_ip || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {evt.username || '-'}
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <div className="text-slate-200 font-mono text-[11px] truncate">
                            {evt.message || evt.raw_log}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 uppercase text-[10px]">
                          {evt.source}
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
