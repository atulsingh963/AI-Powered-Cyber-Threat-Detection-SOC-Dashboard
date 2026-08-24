'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import { DetectionRule } from '@/types';
import { Sliders, Zap, Shield, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function RulesPage() {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (e) {
      console.error('Failed to load detection rules', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const toggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await api.updateRule(ruleId, { enabled: !currentEnabled });
      setRules((prev) =>
        prev.map((r) => (r.rule_id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
    } catch (e) {
      alert('Failed to update rule');
    }
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
                <Sliders className="w-6 h-6 text-sky-400" />
                <span>Detection Rules Manager</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Configure deterministic security rules mapped to MITRE ATT&CK techniques.
              </p>
            </div>

            <button
              onClick={loadRules}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Rules</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 py-12 text-center text-xs font-mono text-slate-500">
                Loading detection rules...
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl bg-slate-900/80 border transition-all space-y-3 ${
                    rule.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-sky-400">{rule.rule_id}</span>
                        <SeverityBadge severity={rule.severity} />
                        {rule.mitre_technique && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
                            MITRE {rule.mitre_technique}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-slate-100 mt-1">{rule.name}</h3>
                    </div>

                    <button
                      onClick={() => toggleRule(rule.rule_id, rule.enabled)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-colors flex items-center space-x-1.5 ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rule.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{rule.enabled ? 'ENABLED' : 'DISABLED'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{rule.description}</p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Category: {rule.category}</span>
                    {rule.configuration && (
                      <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Config: {JSON.stringify(rule.configuration)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
