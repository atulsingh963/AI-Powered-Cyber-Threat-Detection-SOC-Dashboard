import React from 'react';
import { Severity } from '@/types';

interface Props {
  severity: Severity | string;
  className?: string;
}

export const SeverityBadge: React.FC<Props> = ({ severity, className = '' }) => {
  const sev = (severity || 'low').toLowerCase();

  const styles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    critical: { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-800/60', dot: 'bg-red-500' },
    high: { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-800/60', dot: 'bg-orange-500' },
    medium: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60', dot: 'bg-amber-500' },
    low: { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/60', dot: 'bg-blue-500' },
    informational: { bg: 'bg-slate-900/60', text: 'text-slate-400', border: 'border-slate-800/60', dot: 'bg-slate-500' },
  };

  const current = styles[sev] || styles.informational;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {sev}
    </span>
  );
};
