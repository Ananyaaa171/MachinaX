/* ================================================================
   LoginPage.tsx — Industrial Predictive Maintenance Login Portal
   Phase 10.6: Realistic demonstration login authentication.
   Features credentials validation, show/hide password, error banner,
   and role pre-fill quick cards for easy test evaluation.
   ================================================================ */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoUser } from '../context/DemoUserContext';
import { DEMO_USERS, type DemoUser } from '../types/user';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useDemoUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your industrial account.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (user: DemoUser) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMsg('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
      id="page-login"
    >
      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            padding: '28px 24px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
          }}
        >

          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '1px',
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
              lineHeight: 1.2,
            }}
          >
            DIGITAL TWIN
          </h1>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
            }}
          >
            PREDICTIVE MAINTENANCE SYSTEM
          </div>
          <p
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              margin: '8px 0 0 0',
            }}
          >
            Three-Phase Induction Motor Fleet Governance Platform
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Error Message Alert */}
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: 'var(--color-critical)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              id="login-error-message"
            >
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="login-username"
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Username / Operator ID
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Password Field with Show/Hide toggle */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
                id="btn-toggle-password"
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-login-submit"
            className="btn btn--primary"
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.75 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>AUTHENTICATE & ACCESS SYSTEM →</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Strip */}
        <div
          style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--text-muted)',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            DEMONSTRATION ACCESS PROFILES (CLICK TO PREFILL)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {DEMO_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickFill(user)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'border-color var(--transition-fast)',
                }}
                id={`btn-quickfill-${user.username.replace('.', '-')}`}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: user.color,
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {user.initials}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {user.name.split(' ')[0]}
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--color-info)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {user.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 20,
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>MACHINA-X v10.6 · INDUSTRIAL PREDICTIVE MAINTENANCE TELEMETRY</span>
      </div>
    </div>
  );
}
