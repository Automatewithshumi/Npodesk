'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole, ROLE_INFO, canAccessRoute } from '@/lib/rbac';

type OrgUser = {
  id: string; full_name: string; role: UserRole;
  org_id: string; created_at: string; email?: string;
};

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 360 }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

const RolePill = ({ role }: { role: string }) => {
  const info = ROLE_INFO[role as UserRole] || ROLE_INFO.volunteer;
  return <span style={{ fontSize: 11, background: info.bg, color: info.colour, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{info.label}</span>;
};

const ini = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function UsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [showForm, setShowForm] = useState(false);
  const [sel, setSel] = useState<OrgUser | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '', full_name: '', password: '', role: 'manager' as UserRole,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async (oid: string) => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').eq('org_id', oid).order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setCurrentUserId(data.session.user.id);
      const { data: userData } = await supabase.from('users').select('org_id, role').eq('id', data.session.user.id).single();
      if (userData?.org_id) {
        setOrgId(userData.org_id);
        setCurrentRole(userData.role as UserRole || 'admin');
        loadUsers(userData.org_id);
      } else setLoading(false);
    });
  }, [loadUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.full_name.trim() || !form.password.trim()) {
      showToast('Please fill in all fields', 'error'); return;
    }
    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          org_id: orgId,
          requester_id: currentUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      showToast(`${form.full_name} added as ${ROLE_INFO[form.role].label}!`);
      setShowForm(false);
      setForm({ email: '', full_name: '', password: '', role: 'manager' });
      loadUsers(orgId);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Failed: ${error.message}`, 'error');
    }
    setSaving(false);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserId && (currentRole === 'admin' || currentRole === 'super_admin') && newRole !== 'admin' && newRole !== 'super_admin') {
      showToast('Cannot demote yourself from admin role', 'error'); return;
    }
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      showToast(`Role updated to ${ROLE_INFO[newRole].label}!`);
      setEditingRole(null);
      loadUsers(orgId);
      if (sel?.id === userId) setSel({ ...sel, role: newRole });
    } else showToast('Failed to update role', 'error');
  };

  const handleRemoveUser = async (user: OrgUser) => {
    if (user.id === currentUserId) { showToast('Cannot remove your own account', 'error'); return; }
    if (!confirm(`Remove ${user.full_name}? They will lose access immediately.`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, requester_id: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove user');
      showToast(`${user.full_name} removed`);
      setSel(null);
      loadUsers(orgId);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Failed: ${error.message}`, 'error');
    }
  };

  const roleOptions: UserRole[] = ['super_admin', 'admin', 'manager', 'caregiver', 'volunteer'];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type as 'success' | 'error'} />}
      <div className="topbar">
        <div>
          <div className="page-title">👤 User management</div>
          <div className="page-sub">Manage team members and their access roles</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      {/* Role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 20 }}>
        {roleOptions.map(role => {
          const info = ROLE_INFO[role];
          return (
            <div key={role} style={{ background: '#fff', border: `0.5px solid ${info.bg}`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.colour, flexShrink: 0, display: 'block' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: info.colour }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{info.description}</div>
            </div>
          );
        })}
      </div>

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Team members ({users.length})</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add team member'}
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>👤 Add new team member</div>
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Thandi Mokoena" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email address *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="thandi@organisation.co.za" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                  {roleOptions.map(r => (
                    <option key={r} value={r}>{ROLE_INFO[r].label} — {ROLE_INFO[r].description}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role access preview */}
            <div style={{ background: '#FAFAF8', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#555', marginBottom: 6 }}>
                {ROLE_INFO[form.role].label} will have access to:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { route: '/dashboard', label: 'Dashboard', icon: '📊' },
                  { route: '/beneficiaries', label: 'Beneficiaries', icon: '👥' },
                  { route: '/caregivers', label: 'Caregivers', icon: '🩺' },
                  { route: '/volunteers', label: 'Volunteers', icon: '🤝' },
                  { route: '/donors', label: 'Donors', icon: '💰' },
                  { route: '/meal-programs', label: 'Meals', icon: '🍲' },
                  { route: '/documents', label: 'Documents', icon: '📁' },
                  { route: '/reports', label: 'Reports', icon: '📋' },
                  { route: '/settings', label: 'Settings', icon: '🛡️' },
                  { route: '/users', label: 'Users', icon: '👤' },
                ].map(({ route, label, icon }) => {
                  const { canAccessRoute } = require('@/lib/rbac');
                  const hasAccess = canAccessRoute(form.role, route);
                  return (
                    <span key={route} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: hasAccess ? '#EAF3DE' : '#F0EDE8', color: hasAccess ? '#27500A' : '#aaa', border: `0.5px solid ${hasAccess ? '#b0d890' : '#e0ddd8'}` }}>
                      {icon} {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex-gap">
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                {saving ? '⏳ Adding...' : '💾 Add team member'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="two-col">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading team members...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>👤 No team members yet</div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '30%' }}>Name</th>
                <th style={{ width: '22%' }}>Role</th>
                <th style={{ width: '30%' }}>Access</th>
                <th style={{ width: '18%' }}>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => {
                  const info = ROLE_INFO[u.role] || ROLE_INFO.volunteer;
                  const isCurrentUser = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={sel?.id === u.id ? 'selected' : ''} onClick={() => setSel(u)}>
                      <td>
                        <div className="name-cell">
                          <div className="av" style={{ background: info.bg, color: info.colour }}>{ini(u.full_name)}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{u.full_name}</div>
                            {isCurrentUser && <div style={{ fontSize: 10, color: '#D85A30' }}>You</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {editingRole === u.id ? (
                          <select className="form-input" style={{ fontSize: 11, padding: '4px 8px', height: 28 }}
                            defaultValue={u.role}
                            onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                            onBlur={() => setEditingRole(null)}
                            autoFocus>
                            {roleOptions.map(r => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
                          </select>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RolePill role={u.role} />
                            {!isCurrentUser && (
                              <button onClick={e => { e.stopPropagation(); setEditingRole(u.id); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#aaa' }} title="Change role">✏️</button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {[
                            { route: '/beneficiaries', label: 'Beneficiaries' },
                            { route: '/donors', label: 'Donors' },
                            { route: '/reports', label: 'Reports' },
                            { route: '/settings', label: 'Settings' },
                          ].map(({ route, label }) => {
                            const has = canAccessRoute(u.role, route);
                            if (!has) return null;
                            return <span key={route} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: '#EAF3DE', color: '#27500A' }}>{label}</span>;
                          })}
                        </div>
                      </td>
                      <td>
                        {!isCurrentUser && (
                          <button className="btn btn-sm" style={{ fontSize: 11, color: '#791F1F', padding: '3px 8px' }}
                            onClick={e => { e.stopPropagation(); handleRemoveUser(u); }}>
                            🗑 Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {sel ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: ROLE_INFO[sel.role]?.bg || '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: ROLE_INFO[sel.role]?.colour || '#633806' }}>
                {ini(sel.full_name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{sel.full_name}</div>
                <RolePill role={sel.role} />
              </div>
            </div>

            {/* Access list */}
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Access permissions</div>
            {[
              { route: '/dashboard', label: 'Dashboard', icon: '📊' },
              { route: '/beneficiaries', label: 'Beneficiaries', icon: '👥' },
              { route: '/caregivers', label: 'Caregivers', icon: '🩺' },
              { route: '/volunteers', label: 'Volunteers', icon: '🤝' },
              { route: '/donors', label: 'Donors', icon: '💰' },
              { route: '/meal-programs', label: 'Meal programs', icon: '🍲' },
              { route: '/documents', label: 'Documents', icon: '📁' },
              { route: '/reports', label: 'Reports', icon: '📋' },
              { route: '/funding-agent', label: 'Funding Agent', icon: '💸' },
              { route: '/audit-log', label: 'Audit log', icon: '🔍' },
              { route: '/settings', label: 'Settings', icon: '🛡️' },
              { route: '/users', label: 'User management', icon: '👤' },
            ].map(({ route, label, icon }) => {
              const hasAccess = canAccessRoute(sel.role, route);
              return (
                <div key={route} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: 14, width: 20 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 12, color: hasAccess ? '#1a1a1a' : '#ccc' }}>{label}</span>
                  <span style={{ fontSize: 11, color: hasAccess ? '#27500A' : '#ccc' }}>{hasAccess ? '✅' : '—'}</span>
                </div>
              );
            })}

            <div className="flex-gap" style={{ marginTop: 14 }}>
              <select className="form-input" style={{ flex: 1, fontSize: 12 }}
                value={sel.role}
                onChange={e => handleUpdateRole(sel.id, e.target.value as UserRole)}
                disabled={sel.id === currentUserId}>
                {roleOptions.map(r => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
              </select>
              {sel.id !== currentUserId && (
                <button className="btn btn-sm" style={{ color: '#791F1F' }} onClick={() => handleRemoveUser(sel)}>🗑</button>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 13 }}>Click a team member to view their permissions</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
