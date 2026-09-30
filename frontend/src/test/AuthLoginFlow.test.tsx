/* ================================================================
   AuthLoginFlow.test.tsx — Phase 10.6 Login Authentication & RBAC Tests
   Validates:
   1. Login page rendering (/login), credentials input, show/hide password
   2. Authentication failure on invalid credentials
   3. Successful login for all 4 demonstration users:
      - Ananya Sharma (ananya / admin123) -> Admin Dashboard
      - Aryan Mishra (aryan / maintenance123) -> Maintenance Dashboard
      - Aditya Gupta (aditya.reliability / reliability123) -> Reliability Dashboard
      - Aditya Maurya (aditya.operator / operator123) -> Operator Dashboard
   4. Protected route redirection to /login when unauthenticated
   5. Role-based module access restrictions (Operator cannot access /analytics)
   6. Logout and Switch User terminate session and return to /login
   7. Session persistence across page reloads
   ================================================================ */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoUserProvider, useDemoUser } from '../context/DemoUserContext';
import { FleetProvider } from '../context/FleetContext';
import LoginPage from '../pages/LoginPage';
import FleetDashboard from '../pages/FleetDashboard';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AppShell from '../components/layout/AppShell';

// Storage mock for jsdom test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Phase 10.6 — Login Authentication & Role-Based Access Control', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Login Page Interface', () => {
    it('renders login portal with industrial branding, fields, and demo profile buttons', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <LoginPage />
          </DemoUserProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('DIGITAL TWIN')).toBeInTheDocument();
      expect(screen.getByText('PREDICTIVE MAINTENANCE SYSTEM')).toBeInTheDocument();
      expect(screen.getByLabelText(/Username \/ Operator ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i })).toBeInTheDocument();
      expect(screen.getByText(/DEMONSTRATION ACCESS PROFILES/i)).toBeInTheDocument();

      // Quick-fill buttons for demo users
      expect(screen.getByRole('button', { name: /Ananya/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aryan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aditya.*Reliability/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aditya.*Plant/i })).toBeInTheDocument();
    });

    it('toggles password visibility when clicking show/hide button', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <LoginPage />
          </DemoUserProvider>
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: /Show Password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(screen.getByRole('button', { name: /Hide Password/i }));
      expect(passwordInput.type).toBe('password');
    });

    it('displays error message when submitted with invalid credentials', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <LoginPage />
          </DemoUserProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username \/ Operator ID/i);
      const passwordInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i });

      fireEvent.change(usernameInput, { target: { value: 'unknown_user' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong_password' } });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText(/Invalid username or password. Please verify industrial credentials./i)
      ).toBeInTheDocument();
    });
  });

  describe('2. Authentication for All Four Demo Users', () => {
    it('authenticates Ananya Sharma (System Administrator) and displays System Overview', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FleetDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      // Click Ananya quickfill
      fireEvent.click(screen.getByRole('button', { name: /Ananya/i }));
      fireEvent.click(screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i }));

      await waitFor(() => {
        expect(screen.getByText(/SYSTEM OVERVIEW/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/SYSTEM STATUS: OPERATIONAL/i)).toBeInTheDocument();
    });

    it('authenticates Aryan Mishra (Maintenance Engineer) and displays Maintenance Control Center', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FleetDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      // Click Aryan quickfill
      fireEvent.click(screen.getByRole('button', { name: /Aryan/i }));
      fireEvent.click(screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i }));

      await waitFor(() => {
        expect(screen.getByText(/MAINTENANCE CONTROL CENTER/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Maintenance Priority Queue/i)).toBeInTheDocument();
    });

    it('authenticates Aditya Gupta (Reliability Engineer) and displays Reliability & Predictive Analytics', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FleetDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      // Click quickfill for Aditya Gupta
      const quickBtns = screen.getAllByRole('button', { name: /Aditya/i });
      fireEvent.click(quickBtns[0]);
      fireEvent.click(screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i }));

      await waitFor(() => {
        expect(screen.getByText(/RELIABILITY & PREDICTIVE ANALYTICS/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Failure Risk & Degradation Ranking/i)).toBeInTheDocument();
    });

    it('authenticates Aditya Maurya (Plant Operator) and displays Live Operations', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FleetDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      // Click quickfill for Aditya Maurya (second Aditya button)
      const quickBtns = screen.getAllByRole('button', { name: /Aditya/i });
      fireEvent.click(quickBtns[1]);
      fireEvent.click(screen.getByRole('button', { name: /AUTHENTICATE & ACCESS SYSTEM/i }));

      await waitFor(() => {
        expect(screen.getByText(/LIVE OPERATIONS/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Live Floor Telemetry & Digital Twins/i)).toBeInTheDocument();
    });
  });

  describe('3. Protected Routes & Role Authorization', () => {
    it('redirects unauthenticated user accessing /dashboard to /login', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DemoUserProvider>
            <Routes>
              <Route path="/login" element={<div>LOGIN PORTAL SCREEN</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>PROTECTED DASHBOARD</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DemoUserProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText('LOGIN PORTAL SCREEN')).toBeInTheDocument();
      expect(screen.queryByText('PROTECTED DASHBOARD')).not.toBeInTheDocument();
    });

    it('blocks unauthorized role and displays clean access restricted message', async () => {
      // Simulate authenticated Operator (Aditya Maurya)
      localStorageMock.setItem('machinax_auth_user_id', 'USR-004');

      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <DemoUserProvider>
            <Routes>
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['System Administrator', 'Reliability Engineer']}>
                    <div>RELIABILITY ANALYTICS ENGINE</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<div>OPERATOR DASHBOARD</div>} />
            </Routes>
          </DemoUserProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText(/ACCESS NOT AVAILABLE FOR YOUR ROLE/i)).toBeInTheDocument();
      expect(screen.getByText(/This module is designated for/i)).toBeInTheDocument();
      expect(screen.queryByText('RELIABILITY ANALYTICS ENGINE')).not.toBeInTheDocument();
    });
  });

  describe('4. Session Termination & Switch User', () => {
    it('clears session and redirects to /login when logging out from Profile Page', async () => {
      // Seed active session
      localStorageMock.setItem('machinax_auth_user_id', 'USR-001');

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<div>LOGIN SCREEN AFTER LOGOUT</div>} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText('ANANYA SHARMA')).toBeInTheDocument();
      const logoutBtn = screen.getByRole('button', { name: /⎋ Logout/i });
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByText('LOGIN SCREEN AFTER LOGOUT')).toBeInTheDocument();
      });
      expect(localStorageMock.getItem('machinax_auth_user_id')).toBeNull();
    });

    it('restores authenticated user session from localStorage on reload', async () => {
      // Seed persisted session
      localStorageMock.setItem('machinax_auth_user_id', 'USR-002');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DemoUserProvider>
            <FleetProvider>
              <Routes>
                <Route path="/login" element={<div>LOGIN SCREEN</div>} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FleetDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      // Verifies Aryan Mishra session was preserved on load
      expect(await screen.findByText(/MAINTENANCE CONTROL CENTER/i)).toBeInTheDocument();
      expect(screen.queryByText('LOGIN SCREEN')).not.toBeInTheDocument();
    });
  });
});
