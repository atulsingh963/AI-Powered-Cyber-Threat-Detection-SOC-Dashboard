import React from 'react';
import { IncidentStatus } from '@/types';

interface Props {
  status: IncidentStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const st = (status || 'NEW').toUpperCase();

  const styles: Record<string, string> = {
    NEW: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    ACKNOWLEDGED: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    INVESTIGATING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    FALSE_POSITIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const currentStyle = styles[st] || styles.NEW;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${currentStyle} ${className}`}
    >
      {st}
    </span>
  );
};
