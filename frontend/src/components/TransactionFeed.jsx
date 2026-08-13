import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import TransactionInspector from './TransactionInspector';
import { formatINR } from '../utils/currency';
import { Filter, Zap, Search, Calendar } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';

const PAGE_SIZE = 15;

export default function TransactionFeed({ transactions = [], selectedTxn, onSelectTxn, onSubmitDecision }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistorical, setShowHistorical] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = transactions.filter(t => {
    const hasSearch = searchQuery.trim().length > 0;

    // Type filter
    if (filterType === 'FLAGGED' && !(t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH' || t.status === 'FLAGGED' || t.isAnomaly)) {
      return false;
    }
    if (filterType !== 'ALL' && filterType !== 'FLAGGED' && t.type !== filterType) {
      return false;
    }

    // Search Query filter
    if (hasSearch) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = t.transactionId?.toLowerCase().includes(q);
      const matchUser = (t.userId || t.nameOrig || t.sender || '')?.toLowerCase().includes(q);
      const matchType = t.type?.toLowerCase().includes(q);
      const matchDate = String(t.timestamp || '').toLowerCase().includes(q);
      const matchAmount = String(t.amount || '').includes(q);
      return matchId || matchUser || matchType || matchDate || matchAmount;
    }

    return true;
  });

  const handleRowClick = (txn) => {
    onSelectTxn(txn);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const filterButtons = [
    { id: 'ALL', label: 'All Types' },
    { id: 'FLAGGED', label: 'FLAGGED ONLY' },
    { id: 'TRANSFER', label: 'Transfer' },
    { id: 'CASH_OUT', label: 'Cash Out' },
    { id: 'PAYMENT', label: 'Payment' },
    { id: 'DEBIT', label: 'Debit' },
    { id: 'CASH_IN', label: 'Cash In' }
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER & SEARCH BAR */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="var(--accent-indigo)" /> LIVE TODAY TRANSACTION STREAM
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Showing active today's live ingestion pipeline. Real-time stream from Kafka & backend.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '12px', border: '1px solid #86efac', fontWeight: '800' }}>
              LIVE TODAY STREAM
            </span>
            <span style={{ background: 'var(--bg-primary)', padding: '0.35rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
              {filtered.length} Today
            </span>
          </div>
        </div>

        {/* SEARCH BAR & HISTORICAL TOGGLE */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transaction ID, user, type or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.85rem 0.45rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* PILL BUTTON FILTERS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem',
            scrollbarWidth: 'thin'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
            <Filter size={14} /> FILTER:
          </div>

          {filterButtons.map(btn => {
            const isActive = filterType === btn.id;
            const isFlagged = btn.id === 'FLAGGED';

            let activeBg = 'var(--accent-indigo)';
            let activeGlow = '0 0 12px rgba(79, 70, 229, 0.35)';
            if (isFlagged) {
              activeBg = 'var(--risk-critical)';
              activeGlow = '0 0 12px rgba(220, 38, 38, 0.4)';
            }

            return (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: isActive ? `1px solid ${activeBg}` : '1px solid var(--border-color)',
                  background: isActive ? activeBg : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? activeGlow : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em'
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ENTERPRISE STREAM TABLE */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingIndicator label="Waiting for transaction stream..." size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {searchQuery ? `No transactions matched "${searchQuery}".` : "No live today transactions match the selected filter."}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TIME</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TRANSACTION ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TYPE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AMOUNT (INR)</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORIGIN ACCOUNT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DEST ACCOUNT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RISK LEVEL</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RISK SCORE</th>
              </tr>
            </thead>
            <tbody>
              {(showAll ? filtered : filtered.slice(0, PAGE_SIZE)).map((t, idx) => (
                <tr
                  key={t.transactionId || idx}
                  onClick={() => handleRowClick(t)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: selectedTxn && selectedTxn.transactionId === t.transactionId ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {t.timestamp ? (t.timestamp.includes('T') ? t.timestamp.split('T')[1].substring(0, 8) : t.timestamp) : 'Just now'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-indigo)' }}>
                    {t.transactionId || `TXN-${t.id}`}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {t.type}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {formatINR(t.amount || 0)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {t.nameOrig || t.userId || 'C12345678'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {t.nameDest || t.merchant || 'M98765432'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <RiskBadge level={t.riskLevel} score={t.riskScore} />
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                    {((t.riskScore || 0) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SHOW MORE / SHOW LESS BUTTON */}
      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button
            onClick={() => setShowAll(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.75rem',
              borderRadius: '24px',
              border: '1px solid var(--accent-indigo)',
              background: 'rgba(79, 70, 229, 0.06)',
              color: 'var(--accent-indigo)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 8px rgba(79,70,229,0.12)',
              transition: 'all 0.2s ease'
            }}
          >
            {showAll ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                Show Less
              </>
            ) : (
              <>
                Show All {filtered.length} Transactions
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* INSPECTOR MODAL */}
      <TransactionInspector
        transaction={selectedTxn}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmitDecision={onSubmitDecision}
      />
    </div>
  );
}
