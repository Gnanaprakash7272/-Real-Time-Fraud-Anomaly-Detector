import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppBar from './components/AppBar';
import NavigationRail from './components/NavigationRail';
import SystemStatusRow from './components/SystemStatusRow';

import Dashboard from './pages/Dashboard';
import AnalystReview from './pages/AnalystReview';
import ReportsPage from './pages/ReportsPage';
import VaultLogin from './pages/VaultLogin';
import { useAuth } from './auth/AuthContext';

import {
  fetchTransactions,
  fetchRiskScores,
  fetchMetrics,
  fetchAlerts,
  submitAnalystFeedback,
  isUsingMockData
} from './api/client';

// ─── Stable JSON comparison to skip unnecessary re-renders ───
function hasChanged(prev, next) {
  if (!prev || !next) return true;
  if (prev.length !== next.length) return true;
  // Compare IDs + riskLevel only for performance
  for (let i = 0; i < next.length; i++) {
    if (prev[i]?.id !== next[i]?.id || prev[i]?.riskLevel !== next[i]?.riskLevel) return true;
  }
  return false;
}

export default function App() {
  const { isAuthenticated, isInitializing } = useAuth();

  // ── Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Data
  const [transactions, setTransactions] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  // ── Metrics state (stable initial shape)
  const [metrics, setMetrics] = useState({
    sampleCount: 0,
    latestLatencyMs: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    throughputTps: 0,
    transactionCount: 0,
    throughputWindowSeconds: 10,
    modelMetricsAvailable: false,
    modelPrecision: 0,
    modelRecall: 0,
    modelF1Score: 0,
    modelPrecisionPercent: 0,
    modelRecallPercent: 0,
    modelF1ScorePercent: 0,
    modelTestSamples: 0,
    modelFraudSamples: 0,
    modelLegitimateSamples: 0,
    modelTruePositives: 0,
    modelTrueNegatives: 0,
    modelFalsePositives: 0,
    modelFalseNegatives: 0
  });

  // ── Health check: require N consecutive failures before showing degraded
  const healthFailuresRef = useRef(0);
  const HEALTH_THRESHOLD = 3;

  // ─────────────────────────────────────────────────────────────
  // DATA LOADING — staggered, cached, resilient
  // ─────────────────────────────────────────────────────────────
  const loadLiveData = useCallback(async () => {
    try {
      // Step 1: Transactions + Metrics in parallel (fastest path)
      const [txns, metricsData] = await Promise.all([
        fetchTransactions(),
        fetchMetrics()
      ]);

      // Step 2: Update metrics immediately (no join needed)
      if (metricsData) {
        setMetrics(prev => {
          // Only update if values actually changed
          if (JSON.stringify(prev) === JSON.stringify(metricsData)) return prev;
          return metricsData;
        });
      }

      // Step 3: Fetch risk scores and open alerts (alerts needed for analyst feedback)
      const [riskScores, alerts] = await Promise.all([
        fetchRiskScores(),
        fetchAlerts()
      ]);

      const alertMap = {};
      if (Array.isArray(alerts)) {
        alerts.forEach(alert => {
          if (alert.transactionId != null) {
            alertMap[String(alert.transactionId)] = alert;
          }
        });
      }

      // Step 4: Join risk scores into transactions
      if (Array.isArray(txns) && txns.length > 0) {
        const riskMap = {};
        if (Array.isArray(riskScores)) {
          riskScores.forEach(rs => {
            if (rs.transactionId != null) riskMap[String(rs.transactionId)] = rs;
          });
        }

        const enriched = txns.map(txn => {
          const rs = riskMap[String(txn.id)];
          const alert = alertMap[String(txn.id)];

          let parsedTopReasons = txn.topReasons || [];
          let parsedShapValues = txn.shapValues || {};

          try { parsedTopReasons = rs.topReasons ? JSON.parse(rs.topReasons) : parsedTopReasons; } catch {}
          try { parsedShapValues = rs.shapValues ? JSON.parse(rs.shapValues) : parsedShapValues; } catch {}

          return {
            ...txn,
            alertId: alert?.id ?? txn.alertId,
            riskScore: rs?.finalScore != null ? Number(rs.finalScore) : txn.riskScore,
            riskLevel: rs?.riskLevel || txn.riskLevel,
            gradientBoostProbability: rs?.gradientBoostScore != null ? Number(rs.gradientBoostScore) : txn.gradientBoostProbability,
            isolationForestScore: rs?.isolationForestScore != null ? Number(rs.isolationForestScore) : txn.isolationForestScore,
            autoencoderMse: rs?.autoencoderMse != null ? Number(rs.autoencoderMse) : txn.autoencoderMse,
            autoencoderStatus: rs?.autoencoderStatus || txn.autoencoderStatus,
            isAnomaly: rs?.isAnomaly != null ? rs.isAnomaly : txn.isAnomaly,
            topReasons: parsedTopReasons,
            shapValues: parsedShapValues
          };
        });

        // Skip re-render if data didn't meaningfully change
        setTransactions(prev => hasChanged(prev, enriched) ? enriched : prev);
      } else if (Array.isArray(txns)) {
        // Empty array from backend is valid (no txns today yet)
        setTransactions(prev => prev.length === 0 ? prev : []);
      }

      // Mark backend healthy
      healthFailuresRef.current = 0;
      setBackendHealthy(true);
      setIsDemoMode(isUsingMockData());

    } catch (err) {
      healthFailuresRef.current++;
      console.warn(`[Poll] Failure #${healthFailuresRef.current}:`, err?.message);
      if (healthFailuresRef.current >= HEALTH_THRESHOLD) {
        setBackendHealthy(false);
        setIsDemoMode(true);
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // POLLING — 5s interval (was 3s), only when tab is visible
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let intervalId = null;

    const safeLoad = async () => {
      if (isMounted) await loadLiveData();
    };

    // Initial load immediately
    safeLoad();

    // Poll every 5s (reduced from 3s — less pressure, same freshness feel)
    intervalId = setInterval(safeLoad, 5000);

    // Pause polling when tab is not visible (saves resources)
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        safeLoad(); // Immediate refresh when tab becomes visible
        intervalId = setInterval(safeLoad, 5000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, loadLiveData]);

  // ─────────────────────────────────────────────────────────────
  // ANALYST FEEDBACK
  // ─────────────────────────────────────────────────────────────
  const handleSubmitDecision = useCallback(async (feedbackData) => {
    try {
      const result = await submitAnalystFeedback(feedbackData);
      const isFraud = feedbackData.decision === 'CONFIRMED_FRAUD' || feedbackData.decision === 'FRAUD';
      const newStatus = isFraud ? 'FLAGGED' : 'APPROVED';
      const txnDbId = feedbackData.alertId;
      const txnBusinessId = feedbackData.transactionId;

      setTransactions(prev =>
        prev.map(t =>
          t.id === txnDbId || t.transactionId === txnBusinessId
            ? { ...t, status: newStatus, analystDecision: feedbackData.decision, reviewDecision: feedbackData.decision }
            : t
        )
      );
      if (selectedTxn && (selectedTxn.id === txnDbId || selectedTxn.transactionId === txnBusinessId)) {
        setSelectedTxn(prev => prev ? { ...prev, status: newStatus, analystDecision: feedbackData.decision } : prev);
      }
      return result;
    } catch (error) {
      console.error('Failed to submit analyst decision:', error);
      throw error;
    }
  }, [selectedTxn]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 1rem',
            border: '3px solid rgba(79,70,229,0.2)',
            borderTop: '3px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: 'rgba(240,230,210,0.7)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.06em' }}>
            INITIALIZING VAULT...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <VaultLogin />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* AppBar with hamburger toggle */}
      <AppBar
        isHealthy={backendHealthy}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* System Status Row */}
      <SystemStatusRow metrics={metrics} transactions={transactions} />

      {/* Main body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Overlay Sidebar */}
        <NavigationRail
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          transactions={transactions}
        />

        {/* Page Content */}
        <main
          className="main-content"
          style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto', minWidth: 0 }}
        >
          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              metrics={metrics}
              isDemoMode={isDemoMode}
              selectedTxn={selectedTxn}
              onSelectTxn={setSelectedTxn}
              onSubmitDecision={handleSubmitDecision}
            />
          )}

          {activeTab === 'analyst' && (
            <AnalystReview
              transactions={transactions}
              onSubmitDecision={handleSubmitDecision}
              selectedTxn={selectedTxn}
              onSelectTxn={setSelectedTxn}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage
              transactions={transactions}
              metrics={metrics}
            />
          )}
        </main>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}