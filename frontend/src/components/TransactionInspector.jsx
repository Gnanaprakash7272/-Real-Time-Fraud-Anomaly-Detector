import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import RiskBadge from './RiskBadge';
import { formatINR } from '../utils/currency';
import { ANALYST_ID } from '../config/analyst';
import { X, Activity, TrendingUp, User, ShieldAlert, Cpu, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TransactionInspector({ transaction, isOpen, onClose, onSubmitDecision }) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  // ---------------------------------------------------------
  // SHAP entries & normalization
  // ---------------------------------------------------------
  const shapEntries = transaction.shapValues && typeof transaction.shapValues === 'object'
    ? Object.entries(transaction.shapValues).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)
    : [];

  const maxAbsShap = shapEntries.length > 0
    ? Math.max(...shapEntries.map(([, value]) => Math.abs(Number(value))), 0.0001)
    : 1;

  // ---------------------------------------------------------
  // Model values
  // ---------------------------------------------------------
  const {
    gradientBoostProbability: gbProbRaw,
    isolationForestScore: ifScoreRaw,
    autoencoderMse,
    autoencoderStatus,
    riskLevel: riskLevelRaw,
    riskScore: riskScoreRaw,
    isAnomaly
  } = transaction;

  const gradientBoostProbability = gbProbRaw !== null && gbProbRaw !== undefined
    ? Number(gbProbRaw)
    : riskScoreRaw !== null && riskScoreRaw !== undefined
      ? Number(riskScoreRaw)
      : null;

  const isolationForestScore = ifScoreRaw !== undefined && ifScoreRaw !== null
    ? Number(ifScoreRaw)
    : null;

  const riskLevel = transaction.riskLevel || 'UNKNOWN';
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  // Analyst actions with SweetAlert2
  const handleConfirmFraud = () => {
    Swal.fire({
      title: 'Confirm Fraudulent Transaction?',
      text: `Action will mark transaction ${transaction.transactionId} as CONFIRMED FRAUD and block related triggers.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Confirm & Block Fraud',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        if (onSubmitDecision) {
          onSubmitDecision({
            alertId: transaction.alertId || transaction.id,
            transactionId: transaction.transactionId,
            analystId: ANALYST_ID,
            decision: 'CONFIRMED_FRAUD',
            notes: 'Confirmed fraudulent anomaly by analyst review.'
          });
        }
        Swal.fire({
          title: 'Fraud Confirmed!',
          text: `Transaction ${transaction.transactionId} has been confirmed as fraud.`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
        onClose();
      }
    });
  };

  const handleMarkFalsePositive = () => {
    Swal.fire({
      title: 'Mark as False Positive?',
      text: `Action will approve transaction ${transaction.transactionId} and clear risk triggers.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Approve & Mark Legitimate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        if (onSubmitDecision) {
          onSubmitDecision({
            alertId: transaction.alertId || transaction.id,
            transactionId: transaction.transactionId,
            analystId: ANALYST_ID,
            decision: 'FALSE_POSITIVE',
            notes: 'Marked as legitimate / false positive.'
          });
        }
        Swal.fire({
          title: 'Marked Legitimate',
          text: `Transaction ${transaction.transactionId} marked as False Positive.`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
        onClose();
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      {/* Modal Dialog container */}
      <div
        className="spatial-modal"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'inspectorSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isHighRisk ? 'var(--risk-critical-bg)' : 'rgba(79, 70, 229, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isHighRisk ? <ShieldAlert size={22} color="var(--risk-critical)" /> : <Cpu size={22} color="var(--accent-indigo)" />}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                TRANSACTION INSPECTOR & AI EXPLAINABILITY
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>
                {transaction.transactionId}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <RiskBadge level={riskLevel} score={transaction.riskScore} />
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SUMMARY CARDS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Amount</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {formatINR(transaction.amount || 0)}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Type</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {transaction.type || 'N/A'}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>User ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {transaction.userId || 'N/A'}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Merchant / Location</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {transaction.merchant || 'General'} ({transaction.location || 'Online'})
              </div>
            </div>
          </div>

          {/* ENSEMBLE MODEL SCORES */}
          <div>
            <h3 style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={16} /> ENSEMBLE MODEL SCORES
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              
              {/* Gradient Boosting */}
              <div style={{ border: '1px solid var(--border-color)', borderTop: '4px solid var(--accent-indigo)', borderRadius: '12px', padding: '1rem', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Gradient Boosting Probability</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-indigo)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  {gradientBoostProbability !== null ? `${(gradientBoostProbability * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', marginTop: '0.5rem', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: gradientBoostProbability !== null ? `${gradientBoostProbability * 100}%` : '0%', height: '100%', background: 'var(--accent-indigo)', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Isolation Forest */}
              <div style={{ border: '1px solid var(--border-color)', borderTop: `4px solid ${isAnomaly ? 'var(--risk-critical)' : 'var(--risk-low)'}`, borderRadius: '12px', padding: '1rem', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Isolation Forest Anomaly Score</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: isAnomaly ? 'var(--risk-critical)' : 'var(--risk-low)', marginTop: '0.3rem', letterSpacing: '0.02em' }}>
                  {isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL PATTERN'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  Score: {isolationForestScore !== null ? isolationForestScore.toFixed(3) : 'N/A'}
                </div>
              </div>

              {/* Autoencoder */}
              <div style={{ border: '1px solid var(--border-color)', borderTop: '4px solid var(--accent-teal)', borderRadius: '12px', padding: '1rem', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Autoencoder Reconstruction MSE</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--accent-teal)', marginTop: '0.3rem' }}>
                  {autoencoderStatus || 'NORMAL'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  MSE Error: {autoencoderMse !== null ? Number(autoencoderMse).toFixed(4) : 'N/A'}
                </div>
              </div>

            </div>
          </div>

          {/* REASONS AND SHAP ATTR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Why Flagged */}
            <div style={{ padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: isHighRisk ? 'var(--risk-critical-bg)' : '#f8fafc' }}>
              <h3 style={{ fontSize: '0.78rem', color: isHighRisk ? 'var(--risk-critical)' : 'var(--accent-indigo)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> WHY FLAGGED?
              </h3>
              {transaction.topReasons && transaction.topReasons.length > 0 ? (
                <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {transaction.topReasons.map((reason, idx) => (
                    <li key={idx} style={{ lineHeight: '1.4' }}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No explainability information available.
                </div>
              )}
            </div>

            {/* SHAP Feature Contribution */}
            <div style={{ padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
              <h3 style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart3 size={16} /> SHAP FEATURE CONTRIBUTION
              </h3>

              {shapEntries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {shapEntries.map(([feat, valRaw]) => {
                    const val = Number(valRaw);
                    const isPos = val >= 0;
                    const widthPct = Math.min((Math.abs(val) / maxAbsShap) * 100, 100);

                    return (
                      <div key={feat} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{ width: '130px', fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={feat}>
                          {feat}
                        </div>

                        <div style={{ flex: 1, position: 'relative', height: '16px', display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '4px', padding: '0 2px' }}>
                          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: '#cbd5e1', zIndex: 1 }} />

                          {/* Negative side */}
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '1px' }}>
                            {!isPos && (
                              <div style={{ width: `${widthPct}%`, height: '8px', background: 'var(--accent-indigo)', borderRadius: '3px 0 0 3px' }} />
                            )}
                          </div>

                          {/* Positive side */}
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '1px' }}>
                            {isPos && (
                              <div style={{ width: `${widthPct}%`, height: '8px', background: 'var(--risk-critical)', borderRadius: '0 3px 3px 0' }} />
                            )}
                          </div>
                        </div>

                        <div style={{ width: '45px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isPos ? 'var(--risk-critical)' : 'var(--accent-indigo)' }}>
                          {isPos ? '+' : ''}{val.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No explainability information available.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* MODAL FOOTER - ANALYST ACTIONS */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid var(--border-color)',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Analyst Action for {transaction.transactionId}
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <button
              onClick={handleConfirmFraud}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--risk-critical)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldAlert size={16} />
              Confirm Fraud
            </button>

            <button
              onClick={handleMarkFalsePositive}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle size={16} color="var(--accent-indigo)" />
              Mark False Positive
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
