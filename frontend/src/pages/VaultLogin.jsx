import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff, AlertCircle, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
import vaultBgExact from '../assets/vault_bg_exact.jpg';

export default function VaultLogin() {
  const { verifyCredentials, commitSession } = useAuth();

  // Form Input States (Login Only)
  const [email, setEmail] = useState('analyst');
  const [password, setPassword] = useState('SecureVault@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus, Error & Warning States
  const [floatingError, setFloatingError] = useState('');
  const [isRedBlinking, setIsRedBlinking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const blinkTimerRef = useRef(null);

  // Success Unlock Handoff State
  const [sequenceStage, setSequenceStage] = useState('IDLE');

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (blinkTimerRef.current) clearInterval(blinkTimerRef.current);
    };
  }, []);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || sequenceStage !== 'IDLE') return;

    if (!email.trim()) {
      triggerWrongCredentials('Please enter your email or username');
      return;
    }
    if (!password.trim()) {
      triggerWrongCredentials('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setFloatingError('');

    try {
      // Authentic Spring Boot backend verification
      const res = await verifyCredentials(email, password);

      if (res.success) {
        commitSession(res.data);
      } else {
        triggerWrongCredentials(res.message || 'Incorrect email or password');
      }
    } catch (err) {
      triggerWrongCredentials('Incorrect email or password');
    }
  };



  // Wrong credentials handler: Form Shake + 3 Red Blinks + Error Toast
  const triggerWrongCredentials = (msg) => {
    setIsSubmitting(false);
    setFloatingError(msg);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 420);

    if (blinkTimerRef.current) clearInterval(blinkTimerRef.current);
    const times = [
      { delay: 0, val: true },
      { delay: 140, val: false },
      { delay: 280, val: true },
      { delay: 420, val: false },
      { delay: 560, val: true },
      { delay: 700, val: false }
    ];

    times.forEach(({ delay, val }) => {
      setTimeout(() => {
        setIsRedBlinking(val);
      }, delay);
    });

    setTimeout(() => {
      setFloatingError('');
    }, 3500);
  };

  return (
    <div className="glassmorphic-vault-viewport">
      {/* ARIA Accessibility Status */}
      <div className="sr-only" aria-live="assertive">
        {isSubmitting && 'Verifying vault credentials...'}
        {sequenceStage !== 'IDLE' && 'Vault unlocked successfully.'}
        {floatingError && `Security Alert: ${floatingError}`}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Outfit:wght@500;600;700&family=Poppins:wght@500;600;700&display=swap');

        .glassmorphic-vault-viewport {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background-color: #0c1214;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          overflow: hidden;
          font-family: 'Outfit', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          user-select: none;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        /* BACKGROUND VAULT GRAPHIC - EXACT USER STATIC IMAGE */
        .vault-backdrop-image-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-image: url(${vaultBgExact});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 1;
        }

        /* SOFT DARK OVERLAY FOR READABILITY WITH LIGHT BLUR & DIM FADE */
        .glass-vault-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 14, 16, 0.52);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          pointer-events: none;
          z-index: 2;
        }

        /* CENTER SPOTLIGHT FADE & DEEP BLUR BACKDROP PARTICULARLY BEHIND LOGIN BOX */
        .center-focus-backdrop-fade {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 580px;
          height: 580px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(6, 10, 12, 0.95) 0%, rgba(8, 14, 16, 0.88) 45%, rgba(10, 16, 18, 0.5) 75%, transparent 100%);
          backdrop-filter: blur(36px) saturate(190%);
          -webkit-backdrop-filter: blur(36px) saturate(190%);
          box-shadow: 0 0 100px rgba(0, 0, 0, 0.9);
          pointer-events: none;
          z-index: 5;
        }

        /* FLOATING ERROR TOAST */
        .floating-error-toast {
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.65rem 1.6rem;
          border-radius: 25px;
          background: rgba(220, 38, 38, 0.94);
          border: 1px solid rgba(254, 202, 202, 0.6);
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 700;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.9);
          display: flex;
          align-items: center;
          gap: 0.55rem;
          white-space: nowrap;
          z-index: 30;
          animation: floatToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes floatToastIn {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* RED WARNING BLINK AURA */
        .red-warning-blink-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(239, 68, 68, 0.6) 0%, rgba(239, 68, 68, 0.2) 60%, transparent 80%);
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.9);
          opacity: 0;
          pointer-events: none;
          z-index: 8;
          transition: opacity 0.12s ease;
        }

        .red-warning-blink-aura.blink-active {
          opacity: 1;
        }

        /* GLASSMORPHIC LOGIN CARD WITH ULTRA DEEP CENTER BLUR & CRISP BORDER */
        .glassmorphic-vault-card {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 410px;
          max-width: 90vw;
          padding: 2.75rem 2.35rem;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(15, 22, 24, 0.55) 100%);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1.5px solid ${isRedBlinking ? '#ef4444' : 'rgba(255, 215, 130, 0.5)'};
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.7),
            inset 0 1px 2px rgba(255, 255, 255, 0.4),
            0 0 ${isRedBlinking ? '50px rgba(239, 68, 68, 0.9)' : '45px rgba(255, 200, 100, 0.25)'};
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
          animation: floatCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.4s ease, opacity 0.4s ease;
        }

        .glassmorphic-vault-card.shaking {
          animation: cardShake 0.4s ease-in-out;
        }

        .glassmorphic-vault-card.unlocking-fade {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.92);
          pointer-events: none;
        }

        @keyframes floatCardIn {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @keyframes cardShake {
          0%, 100% { transform: translate(-50%, -50%); }
          20% { transform: translate(calc(-50% - 12px), -50%); }
          40% { transform: translate(calc(-50% + 12px), -50%); }
          60% { transform: translate(calc(-50% - 8px), -50%); }
          80% { transform: translate(calc(-50% + 8px), -50%); }
        }

        /* HEADING */
        .heading-cream {
          font-family: 'Cinzel', serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: ${isRedBlinking ? '#ef4444' : '#ffe8b5'};
          text-shadow: 0 0 20px ${isRedBlinking ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 215, 130, 0.5)'};
          margin-top: 0;
          margin-bottom: 1.8rem;
          text-align: center;
          letter-spacing: 0.06em;
        }

        /* BRIGHTER INPUT FIELDS & COLUMNS */
        .glass-input-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 1.25rem;
        }

        .glass-vault-input {
          width: 100%;
          height: 50px;
          padding: 0 2.8rem 0 1.2rem;
          box-sizing: border-box;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid ${isRedBlinking ? '#ef4444' : 'rgba(255, 225, 160, 0.85)'};
          box-shadow: 0 0 16px rgba(255, 215, 130, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.25);
          color: #ffffff;
          font-family: inherit;
          font-size: 0.96rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .glass-vault-input::placeholder {
          color: rgba(255, 255, 255, 0.82);
          font-weight: 500;
        }

        .glass-vault-input:focus {
          background: rgba(255, 255, 255, 0.28);
          border-color: ${isRedBlinking ? '#ef4444' : '#ffe49e'};
          box-shadow: 0 0 22px rgba(255, 215, 130, 0.55), 0 0 0 3.5px ${isRedBlinking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 215, 130, 0.35)'}, inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Show/Hide Password Eye Toggle Icon in Muted Gold */
        .muted-gold-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #c9a15a;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.2s ease, transform 0.2s ease;
          z-index: 6;
        }

        .muted-gold-eye-btn:hover {
          color: #f0e6d2;
          transform: translateY(-50%) scale(1.08);
        }

        /* FORGOT PASSWORD LINK */
        .forgot-password-muted-gold {
          font-size: 0.8rem;
          color: #c9bfa8;
          text-decoration: none;
          margin-bottom: 1.4rem;
          align-self: flex-end;
          transition: color 0.2s ease;
        }

        .forgot-password-muted-gold:hover {
          color: #f0e6d2;
          text-decoration: underline;
        }

        /* PRIMARY BRASS-GOLD GRADIENT BUTTON (#c9a15a → #8a6d3a) */
        .brass-gold-gradient-btn {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: linear-gradient(135deg, #c9a15a 0%, #8a6d3a 100%);
          color: #0c1214;
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(138, 109, 58, 0.4);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .brass-gold-gradient-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #d8b066 0%, #997943 100%);
          box-shadow: 0 0 24px rgba(201, 161, 90, 0.55);
          transform: translateY(-1.5px);
        }

        .brass-gold-gradient-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .brass-gold-gradient-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        /* TRANSLUCENT DIVIDER */
        .divider-glass-container {
          display: flex;
          align-items: center;
          width: 100%;
          margin: 1.4rem 0;
          gap: 0.8rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(201, 161, 90, 0.25);
        }

        .divider-text {
          font-size: 0.78rem;
          color: #c9bfa8;
          font-weight: 500;
        }

        /* GLASS GOOGLE OAUTH BUTTON */
        .glass-google-btn {
          width: 100%;
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(201, 161, 90, 0.28);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #ffffff;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          transition: all 0.25s ease;
        }

        .glass-google-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(201, 161, 90, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        /* FOOTER MICROCOPY */
        .vault-footer-microcopy {
          margin-top: 1.6rem;
          font-size: 0.75rem;
          color: #c9bfa8;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          opacity: 0.85;
        }
      `}</style>

      {/* BACKGROUND VAULT GRAPHIC - EXACT USER STATIC IMAGE */}
      <div className="vault-backdrop-image-wrapper" />
      <div className="glass-vault-overlay" />

      {/* CENTER SPOTLIGHT FADE & DEEP BLUR BACKDROP PARTICULARLY BEHIND LOGIN BOX */}
      <div className="center-focus-backdrop-fade" />

      {/* FLOATING ERROR TOAST */}
      {floatingError && (
        <div className="floating-error-toast" role="alert">
          <AlertCircle size={18} />
          <span>{floatingError}</span>
        </div>
      )}

      {/* RED WARNING BLINK AURA */}
      <div className={`red-warning-blink-aura ${isRedBlinking ? 'blink-active' : ''}`} />

      {/* GLASSMORPHIC LOGIN CARD */}
      <div className={`glassmorphic-vault-card ${isShaking ? 'shaking' : ''} ${sequenceStage !== 'IDLE' ? 'unlocking-fade' : ''}`}>
        
        <h1 className="heading-cream">
          SECURE VAULT ACCESS
        </h1>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Email / Username Input */}
          <div className="glass-input-wrapper">
            <input
              type="text"
              className="glass-vault-input"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
              spellCheck="false"
            />
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="glass-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="glass-vault-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              spellCheck="false"
            />
            <button
              type="button"
              className="muted-gold-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <a href="#forgot" className="forgot-password-muted-gold" onClick={(e) => e.preventDefault()}>
            Forgot Password?
          </a>

          {/* Primary Brass-Gold Gradient Button */}
          <button
            type="submit"
            className="brass-gold-gradient-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Cpu size={18} className="animate-spin" /> AUTHENTICATING...
              </>
            ) : (
              <>
                ACCESS VAULT <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>


        {/* Footer Microcopy */}
        <div className="vault-footer-microcopy">
          <ShieldCheck size={14} style={{ color: '#c9a15a' }} />
          <span>🔒 Vault-grade 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
