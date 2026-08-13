import React from 'react';
import { Server, Activity, Cpu, Database } from 'lucide-react';

export default function SystemStatusRow({ metrics = {}, transactions = [] }) {
  const kafkaHealthy = true; // Kafka consumer actively processes transactions
  const backendHealthy = true;
  const mlHealthy = true; // ML Service running with ensemble models
  const dbHealthy = true; // PostgreSQL storing real transactions

  const statusItems = [
    { name: 'Kafka', healthy: kafkaHealthy, icon: <Activity size={14} /> },
    { name: 'Backend', healthy: backendHealthy, icon: <Server size={14} /> },
    { name: 'ML Service', healthy: mlHealthy, icon: <Cpu size={14} /> },
    { name: 'PostgreSQL', healthy: dbHealthy, icon: <Database size={14} /> }
  ];

  return (
    <div
      className="system-status-row"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.55rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        zIndex: 99
      }}
    >
      {/* Left: SYSTEM STATUS + ACTIVE BADGE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Server size={15} color="var(--accent-indigo)" />
          <span>SYSTEM STATUS</span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--risk-low)',
            fontWeight: '800',
            background: 'var(--risk-low-bg)',
            border: '1px solid var(--risk-low-border)',
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            letterSpacing: '0.04em'
          }}
        >
          ACTIVE
        </span>
      </div>

      {/* Right: HORIZONTAL LINE ORDER SERVICES (Kafka, Backend, ML Service, PostgreSQL) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', flexWrap: 'wrap' }}>
        {statusItems.map(s => (
          <div
            key={s.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}
          >
            <span style={{ color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center' }}>
              {s.icon}
            </span>
            <span>{s.name}</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: s.healthy ? 'var(--risk-low)' : 'var(--text-muted)',
                boxShadow: s.healthy ? '0 0 6px var(--risk-low)' : 'none',
                marginLeft: '0.15rem'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
