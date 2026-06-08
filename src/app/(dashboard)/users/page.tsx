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

const NAV_MODULES = [
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
  { route: '/settings', label: 'Settings & POPIA', icon: '🛡️' },
  { route: '/users', label: 'User management', icon: '👤' },
];

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

  const [form, setForm] = useState({
    email: '', full_name: '', password: '', role: 'manager' as UserRole,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async (oid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('org_id', oid)
      .order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setCurrentUserId(data.session.user.id);
      const { data: userData } = await supabase
        .from('users').select('org_id, role').eq('id', data.session.user.id).single();
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
      showToast('Please fill in all required fields', 'error'); return;
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
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: form.role,
          org_id: orgId,
          requester_id: currentUserId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create user');
      showToast(`✅ ${form.full_name} added as ${ROLE_INFO[form.role].label}! They can now login at app.npodesk.co.za`);
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
    if (userId === currentUserId) {
      showToast('You cannot change your own role', 'error'); return;
    }
    const { error } = await supabase
      .from('users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      showToast(`Role updated to ${ROLE_INFO[newRole].label}!`);
      loadUsers(orgId);
      if (sel?.id === userId) setSel({ ...sel, role: newRole });
    } else {
      showToast('Failed to update role', 'error');
    }
  };

  const handleRemoveUser = async (user: OrgUser) => {
    if (user.id === currentUserId) { showToast('You cannot remove your own account', 'error'); return; }
    if (!confirm(`Remove ${user.full_name}? They will lose access immediately.`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, requester_id: currentUserId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to remove user');
      showToast(`${user.full_name} removed successfully`);
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
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div>
          <div className="page-title">👤 User management</div>
          <div className="page-sub">Add team members and assign their access roles</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setSel(null); }}>
            {showForm ? '✕ Cancel' : '+ Add team member'}
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 20 }}>
        {roleOptions.map(role => {
          const info = ROLE_INFO[role];
          return (
            <div key={role} style={{ background: '#fff', border: `1.5px solid ${info.bg}`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.colour, flexShrink: 0, display: 'block' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: info.colour }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{info.description}</div>
            </div>
          );
        })}
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#D85A30' }}>👤 Add new team member</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>They will be able to login at <strong>app.npodesk.co.za</strong> with the email and password you set below.</div>
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
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 chars, include uppercase + number" required />
                {form.password.length > 0 && form.password.length < 8 && (
                  <div style={{ fontSize: 11, color: '#f04040', marginTop: 4 }}>⚠️ Password must be at least 8 characters</div>
                )}
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

            {/* Live access preview */}
            <div style={{ background: '#FAFAF8', borderRadius: 8, padding: '12px 14px', marginBottom: 14, border: '0.5px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                <span style={{ background: ROLE_INFO[form.role].bg, color: ROLE_INFO[form.role].colour, padding: '2px 10px', borderRadius: 99, fontWeight: 600, marginRight: 6 }}>{ROLE_INFO[form.role].label}</span>
                will have access to:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {NAV_MODULES.map(({ route, label, icon }) => {
                  const hasAccess = canAccessRoute(form.role, route);
                  return (
                    <span key={route} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: hasAccess ? '#EAF3DE' : '#F5F3F0', color: hasAccess ? '#27500A' : '#ccc', border: `0.5px solid ${hasAccess ? '#b0d890' : '#e8e4e0'}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {label} {hasAccess ? '✓' : ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex-gap">
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                {saving ? '⏳ Creating account...' : '💾 Create account & assign role'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="two-col">
        {/* Team members table */}
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading team members...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No team members yet</div>
              <div style={{ fontSize: 12 }}>Click "+ Add team member" to add a caregiver, manager or volunteer</div>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '32%' }}>Name</th>
                <th style={{ width: '22%' }}>Role</th>
                <th style={{ width: '28%' }}>Key access</th>
                <th style={{ width: '18%' }}>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => {
                  const info = ROLE_INFO[u.role] || ROLE_INFO.volunteer;
                  const isCurrentUser = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={sel?.id === u.id ? 'selected' : ''} onClick={() => { setSel(u); setShowForm(false); }}>
                      <td>
                        <div className="name-cell">
                          <div className="av" style={{ background: info.bg, color: info.colour }}>{ini(u.full_name)}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{u.full_name}</div>
                            <div style={{ fontSize: 10, color: isCurrentUser ? '#D85A30' : '#aaa' }}>
                              {isCurrentUser ? '● You' : u.email || 'Team member'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><RolePill role={u.role} /></td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {[
                            { route: '/beneficiaries', label: 'Beneficiaries' },
                            { route: '/donors', label: 'Donors' },
                            { route: '/reports', label: 'Reports' },
                            { route: '/settings', label: 'Settings' },
                          ].map(({ route, label }) => {
                            if (!canAccessRoute(u.role, route)) return null;
                            return <span key={route} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: '#EAF3DE', color: '#27500A', border: '0.5px solid #b0d890' }}>{label}</span>;
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

        {/* Detail / edit panel */}
        {sel ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: ROLE_INFO[sel.role]?.bg || '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: ROLE_INFO[sel.role]?.colour || '#633806', flexShrink: 0 }}>
                {ini(sel.full_name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{sel.full_name}</div>
                <RolePill role={sel.role} />
              </div>
              {sel.id !== currentUserId && (
                <button className="btn btn-sm" style={{ color: '#791F1F', fontSize: 11 }}
                  onClick={() => handleRemoveUser(sel)}>🗑 Remove</button>
              )}
            </div>

            {/* Change role */}
            {sel.id !== currentUserId && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Change role</div>
                <select className="form-input" value={sel.role}
                  onChange={e => handleUpdateRole(sel.id, e.target.value as UserRole)}>
                  {roleOptions.map(r => (
                    <option key={r} value={r}>{ROLE_INFO[r].label} — {ROLE_INFO[r].description}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Access permissions */}
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Access permissions for {sel.full_name.split(' ')[0]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV_MODULES.map(({ route, label, icon }) => {
                const hasAccess = canAccessRoute(sel.role, route);
                return (
                  <div key={route} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: hasAccess ? '#F5FBF0' : '#FAFAF8' }}>
                    <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{icon}</span>
                    <span style={{ flex: 1, fontSize: 12, color: hasAccess ? '#1a1a1a' : '#ccc' }}>{label}</span>
                    <span style={{ fontSize: 13 }}>{hasAccess ? '✅' : '—'}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, background: '#E6F1FB', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#0C447C', lineHeight: 1.6 }}>
              ℹ️ Role changes take effect immediately. The user will see their new permissions on their next page load.
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Click any team member</div>
              <div style={{ fontSize: 12 }}>View permissions and change their role</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
