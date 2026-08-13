import React from 'react';
import RiskBadge from './RiskBadge';
import { formatINR } from '../utils/currency';
import { X, TrendingUp, Activity, User, ShieldAlert } from 'lucide-react';

export default function ReasonPanel({ transaction, onClose }) {

  if (!transaction) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Select a transaction to inspect<br/>AI/ML feature attributions.</p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // SHAP values
  // ---------------------------------------------------------
  const shapEntries = transaction.shapValues && typeof transaction.shapValues === 'object'
    ? Object.entries(transaction.shapValues).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5)
    : [];

  const maxAbsShap = shapEntries.length > 0
    ? Math.max(...shapEntries.map(([, value]) => Math.abs(Number(value))), 0.0001)
    : 1;

  // ---------------------------------------------------------
  // Safe model values
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
    ? Number(gbProbRaw) : riskScoreRaw !== null && riskScoreRaw !== undefined ? Number(riskScoreRaw) : null;
  const isolationForestScore = transaction.isolationForestScore !== undefined ? Number(transaction.isolationForestScore) : null;
  const riskLevel = transaction.riskLevel || 'UNKNOWN';
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TRANSACTION INSPECTOR
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '0.2rem' }}>
            {transaction.transactionId}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <RiskBadge level={riskLevel} score={transaction.riskScore} />
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* BASIC DETAILS ROW */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100px', minWidth: '100px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ color: 'var(--accent-indigo)' }}><Activity size={20} /></div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>{formatINR(transaction.amount || 0)}</div>
          </div>
        </div>
        <div style={{ flex: '1 1 100px', minWidth: '100px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)' }}><TrendingUp size={20} /></div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', wordBreak: 'break-word' }}>{transaction.type || 'N/A'}</div>
          </div>
        </div>
        <div style={{ flex: '1 1 100px', minWidth: '100px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)' }}><User size={20} /></div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>{transaction.userId || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* ENSEMBLE MODEL SCORES */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          ENSEMBLE MODEL SCORES
        </h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 120px', minWidth: '120px', border: '1px solid var(--border-color)', borderTop: '3px solid var(--accent-indigo)', borderRadius: '6px', padding: '1rem', background: '#fff' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>Gradient Boosting<br/>Probability</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-indigo)', marginTop: '0.5rem' }}>
              {gradientBoostProbability !== null ? `${(gradientBoostProbability * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', marginTop: '0.5rem', borderRadius: '2px' }}>
              <div style={{ width: gradientBoostProbability !== null ? `${gradientBoostProbability * 100}%` : '0%', height: '100%', background: 'var(--accent-indigo)', borderRadius: '2px' }}></div>
            </div>
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '120px', border: '1px solid var(--border-color)', borderTop: '3px solid var(--risk-critical)', borderRadius: '6px', padding: '1rem', background: '#fff' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>Isolation Forest<br/>Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isAnomaly ? 'var(--risk-critical)' : 'var(--risk-low)', marginTop: '0.5rem', letterSpacing: '0.02em', wordBreak: 'break-word' }}>
              {isolationForestScore === null ? 'N/A' : isAnomaly ? 'ANOMALY' : 'NORMAL'}
            </div>
            <div style={{ width: '100%', height: '4px', background: isAnomaly ? 'var(--risk-critical)' : 'var(--risk-low)', marginTop: '0.5rem', borderRadius: '2px' }}></div>
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '120px', border: '1px solid var(--border-color)', borderTop: '3px solid var(--risk-medium)', borderRadius: '6px', padding: '1rem', background: '#fff' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>Autoencoder MSE<br/>Recon. Error</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: autoencoderStatus === 'HIGH' ? 'var(--risk-medium)' : 'var(--risk-low)', marginTop: '0.5rem', wordBreak: 'break-word' }}>
              {autoencoderStatus || 'N/A'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              MSE: {autoencoderMse !== null && autoencoderMse !== undefined ? Number(autoencoderMse).toFixed(4) : 'N/A'}
            </div>
          </div>

        </div>
      </div>

      {/* EXPLANATION AND SHAP */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: '180px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            WHY FLAGGED?
          </h4>
          <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {transaction.topReasons && transaction.topReasons.length > 0 ? (
              transaction.topReasons.map((reason, index) => (
                <li key={index} style={{ color: isHighRisk ? 'var(--risk-critical)' : 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {reason}
                </li>
              ))
            ) : (
              <li>No explainability information available.</li>
            )}
          </ul>
        </div>

        <div style={{ flex: '1.2 1 200px', minWidth: '200px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            SHAP FEATURE CONTRIBUTION
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {shapEntries.map(([feature, rawValue]) => {
              const value = Number(rawValue);
              const isPositive = value >= 0;
              const barWidth = Math.min((Math.abs(value) / maxAbsShap) * 100, 100);
              
              return (
                <div key={feature} style={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                  <div style={{ flex: '1', textAlign: 'right', paddingRight: '0.5rem', fontFamily: 'var(--font-mono)' }}>{feature}</div>
                  
                  <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', position: 'relative', height: '14px' }}>
                    {/* Zero Line */}
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'var(--border-color)', zIndex: 1 }} />
                    
                    {/* Left Side (Negative) */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '2px' }}>
                      {!isPositive && (
                        <div style={{ width: `${barWidth}%`, height: '6px', background: 'var(--accent-indigo)', borderRadius: '2px', zIndex: 2 }} />
                      )}
                    </div>
                    
                    {/* Right Side (Positive) */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2px' }}>
                      {isPositive && (
                        <div style={{ width: `${barWidth}%`, height: '6px', background: 'var(--risk-critical)', borderRadius: '2px', zIndex: 2 }} />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ width: '40px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isPositive ? 'var(--risk-critical)' : 'var(--accent-indigo)' }}>
                    {isPositive ? '+' : ''}{value.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', paddingLeft: '40%', paddingRight: '40px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            <span>-1.0</span>
            <span>0</span>
            <span>+1.0</span>
          </div>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          style={{ flex: '1 1 140px', padding: '0.85rem', background: 'var(--risk-critical)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => alert(`Confirmed FRAUD for ${transaction.transactionId}`)}
        >
          <ShieldAlert size={18} />
          CONFIRM FRAUD
        </button>
        <button
          style={{ flex: '1 1 140px', padding: '0.85rem', background: 'var(--accent-indigo)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textAlign: 'center' }}
          onClick={() => alert(`Marked ${transaction.transactionId} as FALSE POSITIVE`)}
        >
          <User size={18} />
          MARK AS FALSE POSITIVE
        </button>
      </div>

    </div>
  );
}