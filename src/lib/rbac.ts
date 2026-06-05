// ── ROLE-BASED ACCESS CONTROL ────────────────────────────
// Defines what each role can access in NpoDesk

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'caregiver' | 'volunteer';

export type Permission =
  | 'dashboard'
  | 'beneficiaries.view' | 'beneficiaries.create' | 'beneficiaries.edit' | 'beneficiaries.delete'
  | 'caregivers.view' | 'caregivers.create' | 'caregivers.edit' | 'caregivers.delete'
  | 'volunteers.view' | 'volunteers.create' | 'volunteers.edit' | 'volunteers.delete'
  | 'donors.view' | 'donors.create' | 'donors.edit' | 'donors.delete'
  | 'meal_programs.view' | 'meal_programs.create' | 'meal_programs.edit' | 'meal_programs.delete'
  | 'documents.view' | 'documents.upload' | 'documents.verify' | 'documents.delete'
  | 'reports.view' | 'reports.export'
  | 'funding_agent.view'
  | 'audit_log.view'
  | 'settings.view' | 'settings.edit'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete';

// ── PERMISSIONS PER ROLE ─────────────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {

  super_admin: [
    'dashboard',
    'beneficiaries.view', 'beneficiaries.create', 'beneficiaries.edit', 'beneficiaries.delete',
    'caregivers.view', 'caregivers.create', 'caregivers.edit', 'caregivers.delete',
    'volunteers.view', 'volunteers.create', 'volunteers.edit', 'volunteers.delete',
    'donors.view', 'donors.create', 'donors.edit', 'donors.delete',
    'meal_programs.view', 'meal_programs.create', 'meal_programs.edit', 'meal_programs.delete',
    'documents.view', 'documents.upload', 'documents.verify', 'documents.delete',
    'reports.view', 'reports.export',
    'funding_agent.view',
    'audit_log.view',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit', 'users.delete',
  ],

  admin: [
    'dashboard',
    'beneficiaries.view', 'beneficiaries.create', 'beneficiaries.edit', 'beneficiaries.delete',
    'caregivers.view', 'caregivers.create', 'caregivers.edit', 'caregivers.delete',
    'volunteers.view', 'volunteers.create', 'volunteers.edit', 'volunteers.delete',
    'donors.view', 'donors.create', 'donors.edit', 'donors.delete',
    'meal_programs.view', 'meal_programs.create', 'meal_programs.edit', 'meal_programs.delete',
    'documents.view', 'documents.upload', 'documents.verify', 'documents.delete',
    'reports.view', 'reports.export',
    'funding_agent.view',
    'audit_log.view',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit',
  ],

  manager: [
    'dashboard',
    'beneficiaries.view', 'beneficiaries.create', 'beneficiaries.edit',
    'caregivers.view', 'caregivers.create', 'caregivers.edit',
    'volunteers.view', 'volunteers.create', 'volunteers.edit',
    'donors.view', 'donors.create', 'donors.edit',
    'meal_programs.view', 'meal_programs.create', 'meal_programs.edit',
    'documents.view', 'documents.upload', 'documents.verify',
    'reports.view', 'reports.export',
    'funding_agent.view',
    'audit_log.view',
  ],

  caregiver: [
    'dashboard',
    'beneficiaries.view', 'beneficiaries.create', 'beneficiaries.edit',
    'documents.view', 'documents.upload',
    'meal_programs.view',
  ],

  volunteer: [
    'dashboard',
    'volunteers.view',
    'meal_programs.view',
  ],
};

// ── SIDEBAR NAV ITEMS PER ROLE ───────────────────────────
export const NAV_ACCESS: Record<string, UserRole[]> = {
  '/dashboard':      ['super_admin', 'admin', 'manager', 'caregiver', 'volunteer'],
  '/beneficiaries':  ['super_admin', 'admin', 'manager', 'caregiver'],
  '/caregivers':     ['super_admin', 'admin', 'manager', 'caregiver'],
  '/volunteers':     ['super_admin', 'admin', 'manager', 'volunteer'],
  '/donors':         ['super_admin', 'admin', 'manager'],
  '/meal-programs':  ['super_admin', 'admin', 'manager', 'caregiver', 'volunteer'],
  '/documents':      ['super_admin', 'admin', 'manager', 'caregiver'],
  '/reports':        ['super_admin', 'admin', 'manager'],
  '/funding-agent':  ['super_admin', 'admin', 'manager'],
  '/audit-log':      ['super_admin', 'admin', 'manager'],
  '/settings':       ['super_admin', 'admin'],
  '/users':          ['super_admin', 'admin'],
};

// ── ROLE DISPLAY INFO ────────────────────────────────────
export const ROLE_INFO: Record<UserRole, { label: string; colour: string; bg: string; description: string }> = {
  super_admin: { label: 'Super Admin',  colour: '#712B13', bg: '#FAECE7', description: 'Full access to everything including user management' },
  admin:       { label: 'Admin',        colour: '#D85A30', bg: '#FAECE7', description: 'Full access except cannot delete other admins' },
  manager:     { label: 'Manager',      colour: '#0C447C', bg: '#E6F1FB', description: 'All modules — no settings or user management' },
  caregiver:   { label: 'Caregiver',    colour: '#3C3489', bg: '#EEEDFE', description: 'Beneficiaries and document uploads only' },
  volunteer:   { label: 'Volunteer',    colour: '#27500A', bg: '#EAF3DE', description: 'Dashboard and shift schedule only' },
};

// ── HELPER FUNCTIONS ─────────────────────────────────────
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  const allowed = NAV_ACCESS[route];
  if (!allowed) return role === 'super_admin' || role === 'admin';
  return allowed.includes(role);
};

export const getRoleInfo = (role: string) => {
  return ROLE_INFO[role as UserRole] || ROLE_INFO.volunteer;
};
