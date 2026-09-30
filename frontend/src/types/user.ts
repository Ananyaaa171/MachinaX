/* ================================================================
   user.ts — Demo Users, Authentication & Role Definitions for MACHINA-X
   Phase 10.6: 4 Demonstration Users with Login Credentials & Roles
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
  username: string;
  password: string; // Demo credentials safe for frontend auth
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
    username: 'ananya',
    password: 'admin123',
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
    username: 'aryan',
    password: 'maintenance123',
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
    username: 'aditya.reliability',
    password: 'reliability123',
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
    username: 'aditya.operator',
    password: 'operator123',
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
