import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { ShieldCheck, CheckCircle2, Clock, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function AppBar({ isHealthy = true, onToggleSidebar }) {
  const [now, setNow] = useState(DateTime.now());
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(DateTime.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toFormat('dd LLL yyyy   hh:mm:ss a').toUpperCase();

  return (
    <header
      className="top-app-bar"
      style={{
        height: '70px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}
    >
      {/* LEFT: Hamburger toggle + Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>

        {/* HAMBURGER BUTTON */}
        <button
          onClick={onToggleSidebar}
          title="Open navigation menu"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'rgba(79,70,229,0.07)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            flexShrink: 0,
            padding: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(79,70,229,0.15)';
            e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(79,70,229,0.07)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <span style={{ display: 'block', width: '18px', height: '2px', borderRadius: '2px', background: 'var(--accent-indigo)' }} />
          <span style={{ display: 'block', width: '14px', height: '2px', borderRadius: '2px', background: 'var(--accent-indigo)', alignSelf: 'flex-start', marginLeft: '2px' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', borderRadius: '2px', background: 'var(--accent-indigo)' }} />
        </button>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}
        >
          <ShieldCheck size={24} color="#ffffff" />
        </div>

        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            REAL-TIME FRAUD ANOMALY DETECTOR
          </h1>
          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
            Intelligent Transaction Monitoring System
          </div>
        </div>
      </div>

      {/* CENTER SYSTEM HEALTH STATUS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          background: isHealthy ? 'var(--risk-low-bg)' : '#fef2f2',
          border: `1px solid ${isHealthy ? 'var(--risk-low-border)' : '#fecaca'}`,
          color: isHealthy ? 'var(--risk-low)' : '#dc2626',
          fontSize: '0.8rem',
          fontWeight: '800',
          letterSpacing: '0.05em'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isHealthy ? 'var(--risk-low)' : '#dc2626',
            boxShadow: `0 0 8px ${isHealthy ? 'var(--risk-low)' : '#dc2626'}`,
            animation: isHealthy ? 'pulse-dot 2s ease infinite' : 'none'
          }}
        />
        <CheckCircle2 size={16} />
        <span>{isHealthy ? 'SYSTEM HEALTHY' : 'CONNECTING...'}</span>
      </div>

      {/* RIGHT LIVE DATE & TIME + USER AUTH BADGE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            fontWeight: '700',
            color: 'var(--text-secondary)',
            background: '#f8fafc',
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Clock size={16} color="var(--accent-indigo)" />
          <span>{formattedTime}</span>
        </div>

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              padding: '0.35rem 0.75rem',
              borderRadius: '10px'
            }}
          >
            <UserCheck size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-indigo)' }}>
              {user.username.toUpperCase()} ({user.role})
            </span>
            <button
              onClick={logout}
              title="Lock Vault & Logout"
              style={{
                marginLeft: '0.3rem',
                padding: '0.2rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
