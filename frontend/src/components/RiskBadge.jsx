import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

export default function RiskBadge({ level = 'LOW', score }) {
  const normalizedLevel = String(level).toUpperCase();

  const percentage = score !== undefined && score !== null
    ? `${Math.round(Number(score) * 100)}%`
    : null;

  const configs = {
    LOW: {
      bg: 'rgba(5, 150, 105, 0.1)',
      color: '#059669',
      border: 'rgba(5, 150, 105, 0.3)',
      label: 'LOW RISK',
      icon: <ShieldCheck size={13} color="#059669" />
    },
    MEDIUM: {
      bg: 'rgba(217, 119, 6, 0.1)',
      color: '#d97706',
      border: 'rgba(217, 119, 6, 0.3)',
      label: 'MEDIUM RISK',
      icon: <AlertTriangle size={13} color="#d97706" />
    },
    HIGH: {
      bg: 'rgba(234, 88, 12, 0.1)',
      color: '#ea580c',
      border: 'rgba(234, 88, 12, 0.3)',
      label: 'HIGH RISK',
      icon: <AlertTriangle size={13} color="#ea580c" />
    },
    CRITICAL: {
      bg: 'rgba(220, 38, 38, 0.12)',
      color: '#dc2626',
      border: 'rgba(220, 38, 38, 0.35)',
      label: 'CRITICAL ANOMALY',
      icon: <ShieldAlert size={13} color="#dc2626" />
    },
    UNKNOWN: {
      bg: 'rgba(148, 163, 184, 0.1)',
      color: '#64748b',
      border: 'rgba(148, 163, 184, 0.3)',
      label: 'UNSCORED',
      icon: <Zap size={13} color="#64748b" />
    }
  };

  const current = configs[normalizedLevel] || configs.LOW;

  return (
    <span
      className={normalizedLevel === 'CRITICAL' ? 'pulse-critical' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.7rem',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: '700',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        letterSpacing: '0.03em',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: current.color,
          boxShadow: `0 0 6px ${current.color}`
        }}
      />
      {current.icon}
      <span>
        {current.label} {percentage ? `(${percentage})` : ''}
      </span>
    </span>
  );
}
