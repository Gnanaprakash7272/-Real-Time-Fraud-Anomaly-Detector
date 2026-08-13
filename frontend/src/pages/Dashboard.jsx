import React from 'react';
import MetricsBar from '../components/MetricsBar';
import LiveCharts from '../components/LiveCharts';
import TransactionFeed from '../components/TransactionFeed';

export default function Dashboard({
  transactions = [],
  metrics = {},
  isDemoMode = false,
  selectedTxn,
  onSelectTxn,
  onSubmitDecision
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%'
      }}
    >
      {/* 1. Neomorphic KPI Cards */}
      <MetricsBar
        transactions={transactions}
        metrics={metrics}
        isDemoMode={isDemoMode}
      />

      {/* 2. Chart.js Real-time Throughput + Latency */}
      <LiveCharts
        currentTps={Number(metrics.throughputTps || 0)}
        currentLatency={Number(metrics.p99LatencyMs || 0)}
        p95Latency={Number(metrics.p95LatencyMs || 0)}
      />

      {/* 3. Full-Width Live Transaction Stream (Click opens Inspector Modal) */}
      <TransactionFeed
        transactions={transactions}
        selectedTxn={selectedTxn}
        onSelectTxn={onSelectTxn}
        onSubmitDecision={onSubmitDecision}
      />
    </div>
  );
}