'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Play, Square, Activity, Cpu, Bell, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export const Navbar: React.FC = () => {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const checkSim = async () => {
      try {
        const data = await api.getSimulatorStatus();
        setIsDemoRunning(data.demo_mode);
      } catch (e) {
        // quiet fallback
      }
    };
    checkSim();

    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDemoMode = async () => {
    setIsToggling(true);
    try {
      if (isDemoRunning) {
        await api.stopSimulator();
        setIsDemoRunning(false);
      } else {
        await api.startSimulator();
        setIsDemoRunning(true);
      }
    } catch (e) {
      alert('Failed to toggle Demo Mode');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors shadow-lg shadow-sky-500/5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight font-mono">
                CyberSentinel<span className="text-sky-400">.AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                SOC v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Detect. Investigate. Defend.</p>
          </div>
        </Link>
      </div>

      {/* Center Controls & Demo Mode Button */}
      <div className="flex items-center space-x-4">
        {/* Demo Mode Toggle */}
        <button
          onClick={toggleDemoMode}
          disabled={isToggling}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all duration-200 shadow-md ${
            isDemoRunning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
          }`}
        >
          {isDemoRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current animate-pulse text-rose-400" />
              <span>STOP DEMO MODE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>START DEMO MODE</span>
            </>
          )}
        </button>

        {/* Live Simulator Status Badge */}
        {isDemoRunning && (
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/60 text-[11px] font-mono text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>SYNTHETIC ATTACKS ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right System Info & User */}
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>SYSTEM: ONLINE</span>
        </div>

        <div className="hidden sm:block text-xs font-mono text-slate-400 bg-slate-900/50 px-2.5 py-1 rounded border border-slate-800/80">
          {currentTime || '00:00:00 UTC'}
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
          SOC
        </div>
      </div>
    </header>
  );
};
