'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Activity,
  Cpu,
  Zap,
  Lock,
  Layers,
  ArrowRight,
  Bot,
  Terminal,
  CheckCircle,
  Database,
  Radio
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Header Bar */}
      <nav className="h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl font-mono text-slate-100">
              CyberSentinel<span className="text-sky-400">.AI</span>
            </span>
            <p className="text-xs text-slate-400">Detect. Investigate. Defend.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-sky-500/20 flex items-center space-x-2"
          >
            <span>Open SOC Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-400 text-xs font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>PRODUCTION-GRADE MINI SOC PLATFORM</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          AI-Powered Cyber Threat Detection & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-blue-500">SOC Dashboard</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Detect suspicious behavior, correlate security events, investigate incidents, and accelerate defensive response with real-time ML anomaly detection and AI-assisted threat analytics.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-base transition-all duration-200 shadow-xl shadow-sky-500/25 flex items-center space-x-3"
          >
            <span>Launch SOC Command Center</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/rules"
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-base transition-all duration-200 flex items-center space-x-2"
          >
            <Zap className="w-5 h-5 text-sky-400" />
            <span>Explore Detection Engine</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Dual Detection Engine</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Combines deterministic MITRE ATT&CK rule evaluation with scikit-learn Isolation Forest ML anomaly scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Multi-Stage Correlation</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Aggregates raw log alerts into high-confidence Security Incidents with automated 0–100 hybrid risk scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">AI Analyst + Fallback</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Integrates Ollama LLMs for evidence-grounded threat explanation with deterministic offline fallback safety.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section className="py-16 px-6 md:px-12 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-mono">SOC Data Architecture</h2>
            <p className="text-sm text-slate-400 mt-2">End-to-end data pipeline from heterogeneous logs to real-time incident resolution.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Database className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <div className="font-bold text-slate-200">1. Heterogeneous Logs</div>
              <p className="text-[11px] text-slate-400 mt-1">Linux Auth, Nginx, App, Synthetic</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Activity className="w-6 h-6 text-teal-400 mx-auto mb-2" />
              <div className="font-bold text-slate-200">2. Normalizer & Detection</div>
              <p className="text-[11px] text-slate-400 mt-1">Rule Engine + Isolation Forest</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Layers className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="font-bold text-slate-200">3. Correlator & Risk</div>
              <p className="text-[11px] text-slate-400 mt-1">Incident Lifecycle & Scoring</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Radio className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="font-bold text-slate-200">4. Live WebSocket SOC</div>
              <p className="text-[11px] text-slate-400 mt-1">Next.js UI & AI Analyst</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
        CyberSentinel AI © 2026 — Defensive Security Operations & Threat Analytics Platform
      </footer>
    </div>
  );
}
