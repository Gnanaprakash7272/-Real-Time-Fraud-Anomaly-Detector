import React, { useEffect } from 'react';
import {
  LayoutDashboard, Activity, BarChart2, Bell, Box,
  UserCheck, FileText, Settings, X, User
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function NavigationRail({ activeTab, setActiveTab, isOpen, onClose, transactions = [] }) {
  const { user } = useAuth();

  // Count flagged alerts for the badge
  const alertCount = transactions.filter(
    t => t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH' || t.status === 'FLAGGED'
  ).length;

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',      icon: <LayoutDashboard size={20} />, badge: null },
    { id: 'livestream',  label: 'Live Stream',     icon: <Activity size={20} />,        badge: null },
    { id: 'analytics',   label: 'Analytics',       icon: <BarChart2 size={20} />,       badge: null },
    { id: 'alerts',      label: 'Alerts',          icon: <Bell size={20} />,            badge: alertCount > 0 ? alertCount : null },
    { id: 'models',      label: 'Models',          icon: <Box size={20} />,             badge: null },
    { id: 'analyst',     label: 'Analyst Review',  icon: <UserCheck size={20} />,       badge: null },
    { id: 'reports',     label: 'Reports',         icon: <FileText size={20} />,        badge: null },
    { id: 'settings',    label: 'Settings',        icon: <Settings size={20} />,        badge: null },
  ];

  // Tabs that navigate to real pages; others are visual only
  const navigableTabs = new Set(['dashboard', 'analyst', 'reports']);

  const handleNavClick = (id) => {
    if (navigableTabs.has(id)) {
      setActiveTab(id);
    }
    onClose();
  };

  return (
    <>
      {/* OVERLAY — closes sidebar when clicking outside */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* SIDEBAR PANEL — 3D GLASS & REAL MIRROR COLOUR STYLE */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '270px',
          zIndex: 1200,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.38) 0%, rgba(240, 245, 255, 0.22) 100%)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderRight: '1.5px solid rgba(255, 255, 255, 0.65)',
          boxShadow: '8px 0 32px 0 rgba(0, 0, 0, 0.22), inset 1px 1px 2px 0 rgba(255, 255, 255, 0.95), inset -1px 0 2px 0 rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* TOP GOLD ACCENT LINE */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, rgba(201,161,90,0.8), rgba(240,195,100,0.4), transparent)'
        }} />

        {/* HEADER — Branding + Close */}
        <div style={{
          padding: '1.5rem 1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.4)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.04em' }}>
                FRAUD DETECTOR
              </div>
              <div style={{ fontSize: '0.62rem', color: '#4f46e5', fontWeight: '700', letterSpacing: '0.06em' }}>
                SECURE VAULT SYSTEM
              </div>
            </div>
          </div>

          {/* X Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.4)',
              color: '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close sidebar (Esc)"
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.2)';
              e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.color = '#334155';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* SECTION LABEL */}
        <div style={{
          padding: '1rem 1.25rem 0.5rem',
          fontSize: '0.62rem', fontWeight: '800',
          color: '#475569',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          NAVIGATION
        </div>

        {/* NAV ITEMS */}
        <nav style={{ flex: 1, padding: '0.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const isNavigable = navigableTabs.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: isActive
                    ? '1px solid rgba(79,70,229,0.35)'
                    : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(124,58,237,0.15))'
                    : 'transparent',
                  color: isActive ? '#1e1b4b' : '#334155',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  position: 'relative',
                  transition: 'all 0.18s ease',
                  letterSpacing: '0.01em',
                  boxShadow: isActive ? '0 4px 14px rgba(79,70,229,0.18), inset 0 1px 0 rgba(255,255,255,0.6)' : 'none',
                  opacity: isNavigable ? 1 : 0.65,
                }}
                title={isNavigable ? item.label : `${item.label} (coming soon)`}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#334155';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Active left accent bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '18%', bottom: '18%',
                    width: '3px', borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg, #c9a15a, #f0c364)'
                  }} />
                )}

                {/* Icon */}
                <span style={{
                  color: isActive ? '#c9a15a' : 'rgba(180,195,220,0.7)',
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                  transition: 'color 0.18s ease'
                }}>
                  {item.icon}
                </span>

                {/* Label */}
                <span style={{ flex: 1 }}>{item.label}</span>

                {/* Badge */}
                {item.badge != null && (
                  <span style={{
                    minWidth: '22px', height: '22px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 6px',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
                  }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}

                {/* Coming soon chip */}
                {!isNavigable && (
                  <span style={{
                    fontSize: '0.58rem', fontWeight: '700',
                    color: 'rgba(201,161,90,0.5)',
                    background: 'rgba(201,161,90,0.08)',
                    border: '1px solid rgba(201,161,90,0.15)',
                    padding: '0.1rem 0.35rem', borderRadius: '6px',
                    letterSpacing: '0.04em'
                  }}>
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* DIVIDER */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 1rem' }} />

        {/* SYSTEM STATUS MINI PANEL */}
        <div style={{
          margin: '0.75rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'rgba(201,161,90,0.6)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            SYSTEM STATUS
          </div>
          {[
            { name: 'Kafka Stream',  color: '#22c55e' },
            { name: 'Backend API',   color: '#22c55e' },
            { name: 'ML Service',    color: '#22c55e' },
            { name: 'PostgreSQL DB', color: '#22c55e' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(200,210,230,0.65)', fontWeight: '500' }}>{s.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: s.color,
                  boxShadow: `0 0 6px ${s.color}`
                }} />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: s.color }}>ACTIVE</span>
              </div>
            </div>
          ))}
        </div>

        {/* USER PROFILE */}
        <div style={{
          margin: '0 0.75rem 1rem',
          padding: '0.85rem 1rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.1))',
          border: '1px solid rgba(201,161,90,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          {/* Avatar circle */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
            position: 'relative'
          }}>
            <User size={18} color="#ffffff" />
            {/* Online dot */}
            <span style={{
              position: 'absolute', bottom: '1px', right: '1px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid rgba(15,23,42,0.95)',
              boxShadow: '0 0 6px #22c55e'
            }} />
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f0e6d2', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Analyst'}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: '600', color: '#22c55e', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 4px #22c55e' }} />
              Online
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(201,161,90,0.7)', background: 'rgba(201,161,90,0.1)', border: '1px solid rgba(201,161,90,0.2)', padding: '0.15rem 0.45rem', borderRadius: '6px', letterSpacing: '0.06em' }}>
            {user?.role || 'ANALYST'}
          </div>
        </div>
      </aside>
    </>
  );
}
