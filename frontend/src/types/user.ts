/* ================================================================
   user.ts — Demo Users and Role Definitions for MACHINA-X
   Phase 10: 4 Demonstration Users with Distinct Operational Contexts
   ================================================================ */

export type UserRole =
  | 'System Administrator'
  | 'Maintenance Engineer'
  | 'Reliability Engineer'
  | 'Plant Operator';

export type UserFocusArea = 'OVERVIEW' | 'MAINTENANCE' | 'RELIABILITY' | 'OPERATIONS';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  color: string;
  badge: string;
  responsibilities: string[];
  focusArea: UserFocusArea;
  tagline: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'USR-001',
    name: 'Ananya Sharma',
    role: 'System Administrator',
    initials: 'AS',
    color: '#3b82f6',
    badge: 'ADMIN',
    responsibilities: [
      'System overview',
      'Machine monitoring',
      'User/system management',
      'Alerts',
      'Configuration',
    ],
    focusArea: 'OVERVIEW',
    tagline: 'Full system visibility, security oversight, and infrastructure monitoring.',
  },
  {
    id: 'USR-002',
    name: 'Aryan Mishra',
    role: 'Maintenance Engineer',
    initials: 'AM',
    color: '#f59e0b',
    badge: 'MAINT_ENG',
    responsibilities: [
      'Machine health',
      'Fault investigation',
      'Maintenance tasks',
      'Alerts',
      'Maintenance history',
    ],
    focusArea: 'MAINTENANCE',
    tagline: 'Field work orders, root cause fault inspection, and scheduled overhauls.',
  },
  {
    id: 'USR-003',
    name: 'Aditya Gupta',
    role: 'Reliability Engineer',
    initials: 'AG',
    color: '#8b5cf6',
    badge: 'RELIABILITY',
    responsibilities: [
      'Predictive analytics',
      'Failure trends',
      'RUL prognostics',
      'Machine reliability',
      'Sensor analysis',
    ],
    focusArea: 'RELIABILITY',
    tagline: 'Remaining useful life models, SHAP explainability, and failure trend prevention.',
  },
  {
    id: 'USR-004',
    name: 'Aditya Maurya',
    role: 'Plant Operator',
    initials: 'AM',
    color: '#10b981',
    badge: 'OPERATOR',
    responsibilities: [
      'Live machine monitoring',
      'Machine status',
      'Active alerts',
      'Operating conditions',
    ],
    focusArea: 'OPERATIONS',
    tagline: 'Real-time telemetry streams, immediate threshold alarms, and Bay 3 operations.',
  },
];
