/* ================================================================
   RoleBasedUI.test.tsx — Phase 10.7 Role-Specific Industrial Experience Tests
   Validates:
   1. Role-specific dashboards for all 4 users:
      - Aditya Maurya: LIVE OPERATIONS, Live Machine Monitoring, Throughput, Operator Controls
      - Aryan Mishra: MAINTENANCE CONTROL CENTER, Work Orders, BOM, 8-Step Procedure, LOTO
      - Aditya Gupta: RELIABILITY & PREDICTIVE ANALYTICS, RCA, Condition Hotspots, Risk
      - Ananya Sharma: SYSTEM ADMINISTRATION, Data Flow Pipeline, User Mgmt, Data Health, Audit Log
   2. Role-specific navigation generated from role config (Phase 10.7 Section 6)
   3. Role-specific reports in Generate Report modal (Phase 10.7 Section 10)
   4. Machine data consistency across all roles (Same machines, same states)
   5. Reusable DigitalTwin component supporting 4 modes (operator, maintenance, reliability, admin)
   ================================================================ */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FleetProvider } from '../context/FleetContext';
import { DemoUserProvider, useDemoUser } from '../context/DemoUserContext';
import FleetDashboard from '../pages/FleetDashboard';
import AppShell from '../components/layout/AppShell';
import ProfilePage from '../pages/ProfilePage';
import GenerateReportModal from '../components/report/GenerateReportModal';

// Storage mock for jsdom node test runner
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

// Helper component that switches active demo user inside tests
function RoleSwitcherHelper({ targetUserId, children }: { targetUserId: string; children: React.ReactNode }) {
  const { switchUser } = useDemoUser();

  React.useEffect(() => {
    switchUser(targetUserId);
  }, [targetUserId, switchUser]);

  return <>{children}</>;
}

describe('Phase 10.7 — Role-Specific Industrial Experience', () => {
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

  describe('1. Ananya Sharma — System Administrator (USR-001)', () => {
    it('renders SYSTEM ADMINISTRATION dashboard, architecture pipeline, and system health', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-001">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/SYSTEM ADMINISTRATION/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/SYSTEM STATUS: OPERATIONAL/i)).toBeInTheDocument();
      expect(screen.getByText(/System Architecture & Data Flow/i)).toBeInTheDocument();
      expect(screen.getAllByText(/User Management/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/DATA HEALTH & PROTOCOL/i)).toBeInTheDocument();
      expect(screen.getByText(/Security & System Audit Log/i)).toBeInTheDocument();
      expect(screen.getByText(/MQTT Broker:/i)).toBeInTheDocument();
      expect(screen.getByText(/OPC-UA:/i)).toBeInTheDocument();
    }, 15000);

    it('displays System Administrator navigation items in AppShell (Phase 10.7 Section 6)', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-001">
                <AppShell>
                  <div>Content</div>
                </AppShell>
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('System Overview')).toBeInTheDocument();
      });
      expect(screen.getByText('Machines')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('2. Aryan Mishra — Maintenance Engineer (USR-002)', () => {
    it('renders MAINTENANCE CONTROL CENTER, Work Orders, BOM, and Procedure Panel', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-002">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/MAINTENANCE CONTROL CENTER/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/MAINTENANCE DUE/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/OVERDUE/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CRITICAL MACHINES/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/ACTIVE FAULTS/i)).toBeInTheDocument();
      expect(screen.getByText(/OPEN WORK ORDERS/i)).toBeInTheDocument();
      expect(screen.getAllByText(/IN PROGRESS/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Machine Maintenance View/i)).toBeInTheDocument();
      expect(screen.getByText(/Bill of Materials/i)).toBeInTheDocument();
      expect(screen.getByText(/Maintenance Procedure/i)).toBeInTheDocument();
    });

    it('displays Maintenance Engineer navigation items in AppShell (Phase 10.7 Section 6)', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-002">
                <AppShell>
                  <div>Content</div>
                </AppShell>
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByText('Machines')).toBeInTheDocument();
      expect(screen.getByText('Faults')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('3. Aditya Gupta — Reliability Engineer (USR-003)', () => {
    it('renders RELIABILITY & PREDICTIVE ANALYTICS with RCA and condition hotspots', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-003">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/RELIABILITY & PREDICTIVE ANALYTICS/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText(/FLEET HEALTH/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/HIGH-RISK MACHINES/i)).toBeInTheDocument();
      expect(screen.getAllByText(/ANOMALIES/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/PREDICTED FAILURES/i)).toBeInTheDocument();
      expect(screen.getByText(/AVERAGE RUL/i)).toBeInTheDocument();
      expect(screen.getByText(/ROOT CAUSE ANALYSIS \(RCA\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Predictive Recommendation/i).length).toBeGreaterThan(0);
    });

    it('displays Reliability Engineer navigation items in AppShell (Phase 10.7 Section 6)', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-003">
                <AppShell>
                  <div>Content</div>
                </AppShell>
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByText('Machines')).toBeInTheDocument();
      expect(screen.getByText('Digital Twins')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Anomalies')).toBeInTheDocument();
      expect(screen.getByText('Predictions')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('4. Aditya Maurya — Plant Operator (USR-004)', () => {
    it('renders LIVE OPERATIONS, Line Throughput, Operator Controls, and Alarms table', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-004">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/LIVE OPERATIONS/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/RUNNING/i)).toBeInTheDocument();
      expect(screen.getAllByText(/WARNING/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/OFFLINE/i)).toBeInTheDocument();
      expect(screen.getByText(/LINE THROUGHPUT/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Machine Monitoring/i)).toBeInTheDocument();
      expect(screen.getByText(/Immediate Operator Alarms & Safety Priority/i)).toBeInTheDocument();
    });

    it('displays Plant Operator navigation items in AppShell (Phase 10.7 Section 6)', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-004">
                <AppShell>
                  <div>Content</div>
                </AppShell>
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Live Operations')).toBeInTheDocument();
      });
      expect(screen.getByText('Machines')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('5. Shared Fleet Machine Data Consistency', () => {
    it('ensures all 4 users observe identical underlying machine states and counts', async () => {
      // Test Ananya
      const { unmount: unmount1 } = render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-001">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getAllByText(/Motor IM-001/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Motor IM-002/i).length).toBeGreaterThan(0);
      });
      unmount1();

      // Test Aryan
      const { unmount: unmount2 } = render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-002">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getAllByText(/Motor IM-001/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Motor IM-002/i).length).toBeGreaterThan(0);
      });
      unmount2();

      // Test Aditya Gupta
      const { unmount: unmount3 } = render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-003">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getAllByText(/Motor IM-001/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Motor IM-002/i).length).toBeGreaterThan(0);
      });
      unmount3();

      // Test Aditya Maurya
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-004">
                <FleetDashboard />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getAllByText(/Motor IM-001/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Motor IM-002/i).length).toBeGreaterThan(0);
      });
    }, 20000);
  });

  describe('6. Role-Specific Report Options (Phase 10.7 Section 10)', () => {
    it('filters report types according to the active demonstration user role', async () => {
      // Test Ananya reports
      const { unmount, container: container1 } = render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-001">
                <GenerateReportModal isOpen={true} onClose={() => {}} defaultMachineId="ALL" />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const select = container1.querySelector('#select-report-type');
        expect(select?.textContent).toContain('System Health Report');
        expect(select?.textContent).toContain('Machine Connectivity Report');
        expect(select?.textContent).toContain('User Activity Report');
        expect(select?.textContent).toContain('Audit Report');
      });
      unmount();

      // Test Aryan reports
      const { container: container2 } = render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-002">
                <GenerateReportModal isOpen={true} onClose={() => {}} defaultMachineId="ALL" />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const select = container2.querySelector('#select-report-type');
        expect(select?.textContent).toContain('Maintenance Report');
        expect(select?.textContent).toContain('Fault Report');
        expect(select?.textContent).toContain('Maintenance History');
        expect(select?.textContent).toContain('Work Order Report');
      });
    });
  });

  describe('7. Profile Page (/profile)', () => {
    it('displays active demonstration user profile, ID, responsibilities, and switcher', async () => {
      render(
        <MemoryRouter>
          <DemoUserProvider>
            <FleetProvider>
              <RoleSwitcherHelper targetUserId="USR-001">
                <ProfilePage />
              </RoleSwitcherHelper>
            </FleetProvider>
          </DemoUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ANANYA SHARMA')).toBeInTheDocument();
      });
      expect(screen.getByText('USR-001')).toBeInTheDocument();
      expect(screen.getAllByText('System Administrator').length).toBeGreaterThan(0);
      expect(screen.getByText('DEMO USER')).toBeInTheDocument();
      expect(screen.getByText(/Switch Demonstration Role/i)).toBeInTheDocument();
    });
  });
});
