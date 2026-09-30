/* ================================================================
   ProtectedRoute.tsx — Route Access Guard with Role Restrictions
   Phase 10.6: Enforces authentication and role-based permissions.
   Redirects unauthenticated visitors to /login and presents clean
   industrial access-denied views for restricted modules.
   ================================================================ */

import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDemoUser } from '../../context/DemoUserContext';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useDemoUser();

  // 1. If not authenticated, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. If role-restricted, check if currentUser has one of the allowed roles
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '40px auto',
        }}
        id="role-access-restricted-view"
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: 'var(--color-critical)',
            margin: '0 auto 16px',
          }}
        >
          🔒
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          ACCESS NOT AVAILABLE FOR YOUR ROLE
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 auto 16px', maxWidth: 420 }}>
          This module is designated for{' '}
          <strong style={{ color: 'var(--color-info)' }}>{allowedRoles.join(' or ')}</strong> personnel.
        </p>

        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'inline-block',
            marginBottom: 20,
          }}
        >
          Active Session: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name}</strong> ({currentUser.role} • {currentUser.id})
        </div>

        <div>
          <button
            className="btn btn--primary"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            ← Return to My Role Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated and authorized
  return <>{children}</>;
}
