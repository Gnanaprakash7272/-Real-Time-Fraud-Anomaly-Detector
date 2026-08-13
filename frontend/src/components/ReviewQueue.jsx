import React, { useState } from 'react';
import Swal from 'sweetalert2';
import RiskBadge from './RiskBadge';
import { formatINR } from '../utils/currency';
import { ANALYST_ID } from '../config/analyst';
import { ShieldAlert, CheckCircle, Search, UserCheck, MessageSquare, AlertOctagon, HelpCircle, Calendar, Filter } from 'lucide-react';

export default function ReviewQueue({ transactions = [], onSubmitDecision, onSelectTxn, onOpenInspector }) {
  const [analystNotes, setAnalystNotes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompletedDays, setShowCompletedDays] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter queue items:
  // By default (no search & showCompletedDays = false), hide completed/past days' transactions.
  // When searched (searchQuery !== '') or showCompletedDays = true, include completed days' transactions.
  const queue = transactions.filter(t => {
    const isFlagged = (t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH' || t.status === 'FLAGGED');
    if (!isFlagged) return false;

    const txnDateStr = t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : todayStr;
    const isPastCompletedDay = txnDateStr < todayStr || t.status === 'BLOCKED' || t.status === 'APPROVED' || t.reviewDecision;

    const hasSearchQuery = searchQuery.trim().length > 0;

    // Daily report / completed day rule:
    // If the day is completed (isPastCompletedDay), hide from analyst review page UNLESS explicitly searched or toggled
    if (isPastCompletedDay) {
      if (!hasSearchQuery && !showCompletedDays) {
        return false;
      }
    }

    // Match search query against transactionId, customer, amount, type, or date
    if (hasSearchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = t.transactionId?.toLowerCase().includes(q);
      const matchCustomer = (t.nameOrig || t.sender || '')?.toLowerCase().includes(q);
      const matchType = t.type?.toLowerCase().includes(q);
      const matchDate = txnDateStr.includes(q);
      const matchAmount = String(t.amount || '').includes(q);
      return matchId || matchCustomer || matchType || matchDate || matchAmount;
    }

    return true;
  });

  const handleAction = (txn, decision) => {
    const notes = analystNotes[txn.transactionId] || '';
    const isFraud = decision === 'CONFIRMED_FRAUD';

    Swal.fire({
      title: isFraud ? 'Confirm & Block Fraud?' : 'Approve Transaction?',
      text: isFraud
        ? `Are you sure you want to block transaction ${txn.transactionId} and confirm it as fraud?`
        : `Are you sure you want to approve transaction ${txn.transactionId} as legitimate?`,
      icon: isFraud ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: isFraud ? '#dc2626' : '#4f46e5',
      confirmButtonText: isFraud ? 'Yes, Block Fraud' : 'Yes, Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        if (onSubmitDecision) {
          onSubmitDecision({
            alertId: txn.alertId || txn.id,
            transactionId: txn.transactionId,
            analystId: ANALYST_ID,
            decision,
            notes
          });
        }
        setAnalystNotes(prev => ({ ...prev, [txn.transactionId]: '' }));

        Swal.fire({
          title: isFraud ? 'Fraud Blocked' : 'Approved',
          text: `Action logged successfully for ${txn.transactionId}.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%'
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={24} color="var(--accent-indigo)" /> ANALYST REVIEW & TRIAGE QUEUE
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Investigate active today's flagged anomalies. Past completed days are hidden by default and accessible via search.
          </p>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.4rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-indigo)' }}>
          {queue.length} Active Triage Case{queue.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* SEARCH BAR & COMPLETED DAY TOGGLE */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search past completed days or active transaction ID / date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 2.4rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showCompletedDays}
            onChange={(e) => setShowCompletedDays(e.target.checked)}
            style={{ accentColor: 'var(--accent-indigo)' }}
          />
          <Calendar size={14} color="var(--accent-indigo)" /> Include Completed Days in View
        </label>
      </div>

      {/* QUEUE CARDS */}
      {queue.length === 0 ? (
        <div
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle size={30} color="#059669" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {searchQuery ? 'No Matching Search Results' : 'No Active Pending Triage Cases Today'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '480px', margin: '0.25rem auto 0' }}>
            {searchQuery
              ? `No transactions matched "${searchQuery}". Try searching by date (e.g. YYYY-MM-DD) or transaction ID.`
              : 'Completed days are hidden by default. Use the search bar above or check "Include Completed Days" to search past daily reports.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {queue.map(txn => (
            <div
              key={txn.transactionId}
              className="spatial-card"
              style={{
                padding: '1.35rem',
                background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                border: '1px solid var(--border-color)',
                borderLeft: `5px solid ${txn.riskLevel === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)'}`,
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* TOP ROW */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {txn.transactionId}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-indigo)' }}>
                    {txn.type}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formatINR(txn.amount || 0)}
                  </span>
                  {txn.timestamp && (
                    <>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        {new Date(txn.timestamp).toLocaleDateString()} {new Date(txn.timestamp).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <RiskBadge level={txn.riskLevel} score={txn.riskScore} />
                  <button
                    onClick={() => {
                      onSelectTxn(txn);
                      if (onOpenInspector) onOpenInspector(txn);
                    }}
                    style={{
                      background: 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid var(--accent-indigo)',
                      color: 'var(--accent-indigo)',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Search size={14} /> Inspect SHAP
                  </button>
                </div>
              </div>

              {/* MIDDLE SHAP EXPLANATION */}
              <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertOctagon size={15} color="var(--risk-high)" /> Primary AI Risk Factors:
                </div>
                <div>{(txn.topReasons && txn.topReasons[0]) || txn.reason || 'No explainability data available for this transaction.'}</div>
              </div>

              {/* ANALYST ACTION FORM */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter analyst resolution notes..."
                  value={analystNotes[txn.transactionId] || ''}
                  onChange={(e) => setAnalystNotes({ ...analystNotes, [txn.transactionId]: e.target.value })}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />

                <button
                  onClick={() => handleAction(txn, 'CONFIRMED_FRAUD')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--risk-critical)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ShieldAlert size={14} /> CONFIRM FRAUD & BLOCK
                </button>

                <button
                  onClick={() => handleAction(txn, 'APPROVE')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--risk-low)',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CheckCircle size={14} /> APPROVE TRANSACTION
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
