'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { Incident } from '@/types';
import {
  ArrowLeft,
  Bot,
  ShieldCheck,
  FileText,
  Clock,
  User,
  Plus,
  Send,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Zap
} from 'lucide-react';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    try {
      const data = await api.getIncidentDetail(id);
      setIncident(data);
    } catch (e) {
      console.error('Failed to load incident detail', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleRequestAiAnalysis = async () => {
    if (!incident) return;
    setAnalyzing(true);
    try {
      await api.analyzeIncident(incident.incident_id);
      await loadDetail();
    } catch (e) {
      alert('AI Analysis request failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !incident) return;
    setAddingNote(true);
    try {
      await api.addIncidentNote(incident.incident_id, newNote.trim());
      setNewNote('');
      await loadDetail();
    } catch (e) {
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center text-slate-500 font-mono text-xs">
            Loading security incident workspace...
          </main>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center text-slate-400 font-mono text-sm space-y-4">
            <p>Incident not found or invalid ID.</p>
            <button
              onClick={() => router.push('/incidents')}
              className="px-4 py-2 rounded bg-sky-500 text-slate-950 font-bold text-xs"
            >
              Back to Incidents Matrix
            </button>
          </main>
        </div>
      </div>
    );
  }

  const latestAi = incident.ai_analyses && incident.ai_analyses.length > 0
    ? incident.ai_analyses[incident.ai_analyses.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Back button & Title bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/incidents')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {incident.incident_id}
                  </span>
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                </div>
                <h1 className="text-xl font-bold text-slate-100 mt-1">
                  {incident.title}
                </h1>
              </div>
            </div>

            <button
              onClick={handleRequestAiAnalysis}
              disabled={analyzing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzing ? 'ANALYZING INCIDENT...' : 'RUN AI THREAT ANALYST'}</span>
            </button>
          </div>

          {/* Overview Metrics Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Category</span>
              <p className="font-bold text-slate-200 text-sm mt-1">{incident.category}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Confidence Score</span>
              <p className="font-bold text-emerald-400 text-sm mt-1">
                {Math.round((incident.confidence || 0.85) * 100)}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Assigned Analyst</span>
              <p className="font-bold text-slate-200 text-sm mt-1">
                {incident.assigned_to || 'SOC Queue'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Correlated Events</span>
              <p className="font-bold text-sky-400 text-sm mt-1">
                {incident.events?.length || incident.event_count} Events
              </p>
            </div>
          </div>

          {/* AI Security Analyst Section */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm font-mono text-slate-100 flex items-center gap-2">
                    <span>AI Security Analyst Threat Assessment</span>
                    {latestAi && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                        latestAi.is_fallback ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      }`}>
                        {latestAi.is_fallback ? 'DETERMINISTIC FALLBACK ANALYSIS' : `OLLAMA (${latestAi.model})`}
                      </span>
                    )}
                  </h2>
                </div>
              </div>
            </div>

            {!latestAi ? (
              <div className="py-6 text-center text-xs font-mono text-slate-400 space-y-2">
                <p>No AI analysis generated yet for this incident.</p>
                <button
                  onClick={handleRequestAiAnalysis}
                  className="px-3 py-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold"
                >
                  Generate Initial AI Threat Explanation
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div>
                  <h3 className="text-slate-400 uppercase text-[10px] font-bold">Summary</h3>
                  <p className="mt-1 text-slate-200 leading-relaxed font-sans">{latestAi.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Likely Attack Vector</span>
                    <p className="font-bold text-sky-400">{latestAi.attack_type}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Confidence Score</span>
                    <p className="font-bold text-emerald-400">{Math.round(latestAi.confidence * 100)}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-400 uppercase text-[10px] font-bold">Evidence & Reasoning</h3>
                  <p className="mt-1 text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {latestAi.reasoning}
                  </p>
                </div>

                <div>
                  <h3 className="text-slate-400 uppercase text-[10px] font-bold">Recommended Defensive Actions</h3>
                  <ul className="mt-2 space-y-1.5 font-sans">
                    {latestAi.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2 text-slate-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Logs & Chronological Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline of Correlated Security Events */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm font-mono text-slate-200 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Correlated Security Events Timeline</span>
              </h2>

              <div className="space-y-3">
                {incident.events?.map((evt, idx) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sky-400 font-bold">#{idx + 1}</span>
                        <span className="text-slate-400">{new Date(evt.timestamp).toLocaleString()}</span>
                        <SeverityBadge severity={evt.severity} />
                      </div>
                      <span className="text-slate-400 font-bold">{evt.event_type}</span>
                    </div>

                    <p className="text-slate-200 font-sans text-xs bg-slate-900/50 p-2 rounded border border-slate-800/50">
                      {evt.message || evt.raw_log}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Source IP: {evt.source_ip || 'N/A'}</span>
                      <span>Target User: {evt.username || 'N/A'}</span>
                      <span>Host: {evt.hostname || 'localhost'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Investigation Notes */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-sm font-mono text-slate-200 flex items-center space-x-2 mb-3">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Investigation Notes</span>
                </h2>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(!incident.notes || incident.notes.length === 0) ? (
                    <p className="text-xs font-mono text-slate-500 py-4 text-center">
                      No analyst notes added yet.
                    </p>
                  ) : (
                    incident.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="font-bold text-purple-400">{note.author_name}</span>
                          <span>{new Date(note.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200 font-sans leading-relaxed">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-3 border-t border-slate-800">
                <textarea
                  rows={3}
                  placeholder="Add analyst investigation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono resize-none"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>POST NOTE</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
