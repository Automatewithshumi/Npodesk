'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type AuditLog = {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  performed_by: string;
  details: string;
  created_at: string;
  ip_address: string;
};

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

const actionColour = (action: string) => {
  if (action === 'INSERT') return { bg: '#EAF3DE', tx: '#27500A' };
  if (action === 'UPDATE') return { bg: '#E6F1FB', tx: '#0C447C' };
  if (action === 'DELETE') return { bg: '#FCEBEB', tx: '#791F1F' };
  if (action === 'LOGIN') return { bg: '#EEEDFE', tx: '#3C3489' };
  if (action === 'LOGOUT') return { bg: '#F1EFE8', tx: '#5F5E5A' };
  if (action === 'EXPORT') return { bg: '#FAEEDA', tx: '#633806' };
  return { bg: '#F1EFE8', tx: '#5F5E5A' };
};

const tableIcon = (table: string) => {
  const map: Record<string, string> = {
    beneficiaries: '👥', volunteers: '🤝', donors: '💰',
    caregivers: '🩺', meal_sites: '📍', meal_logs: '📋',
    donations: '💵', shifts: '📅', auth: '🔐', reports: '📊',
  };
  return map[table] || '📁';
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [search, setSearch] = useState('');
  const [actionF, setActionF] = useState('');
  const [tableF, setTableF] = useState('');
  const [sel, setSel] = useState<AuditLog | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadLogs = useCallback(async (oid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('org_id', oid)
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    if (error) {
      // Table might not exist yet
      setLogs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadLogs(userData.org_id); }
      else setLoading(false);
    });
  }, [loadLogs]);

  const exportCSV = () => {
    if (logs.length === 0) { showToast('No audit logs to export', 'error'); return; }
    const headers = ['Action', 'Module', 'Details', 'Performed By', 'Date & Time', 'IP Address'];
    const rows = logs.map(l => [
      `"${l.action}"`, `"${l.table_name}"`, `"${(l.details || '').replace(/"/g, "'")}"`,
      `"${l.performed_by || ''}"`, `"${new Date(l.created_at).toLocaleString('en-ZA')}"`,
      `"${l.ip_address || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${logs.length} audit records`);
  };

  const filtered = logs.filter(l =>
    (!search || (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.performed_by || '').toLowerCase().includes(search.toLowerCase()) ||
      l.table_name.toLowerCase().includes(search.toLowerCase())) &&
    (!actionF || l.action === actionF) &&
    (!tableF || l.table_name === tableF)
  );

  const uniqueTables = [...new Set(logs.map(l => l.table_name))];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div>
          <div className="page-title">Audit log</div>
          <div className="page-sub">POPIA-compliant activity tracking · All actions recorded</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div className="metrics-grid">
        {[
          { label: '📋 Total actions', value: logs.length.toString(), delta: 'All recorded' },
          { label: '➕ Records added', value: logs.filter(l => l.action === 'INSERT').length.toString(), delta: 'Inserts' },
          { label: '✏️ Records updated', value: logs.filter(l => l.action === 'UPDATE').length.toString(), delta: 'Updates' },
          { label: '🗑️ Records deleted', value: logs.filter(l => l.action === 'DELETE').length.toString(), delta: 'Deletions' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* No audit table yet — show setup instructions */}
      {!loading && logs.length === 0 && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #185FA5' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>ℹ️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#185FA5', marginBottom: 6 }}>Set up audit logging</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
                To enable POPIA-compliant audit logging, run the following SQL in your Supabase SQL Editor:
              </div>
              <div style={{ background: '#1C1410', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#e0d8d0', fontFamily: 'monospace', lineHeight: 1.7, marginBottom: 10, overflowX: 'auto' }}>
                {`-- Create audit_logs table
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references organisations,
  action text not null,
  table_name text not null,
  record_id text,
  performed_by text,
  details text,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table audit_logs enable row level security;
create policy "audit_logs_access" on audit_logs
  for all using (true) with check (true);`}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>After running the SQL, audit logs will appear here automatically as users perform actions in the system.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Activity log</span>
        <span style={{ fontSize: 12, color: '#888' }}>Last 200 records</span>
      </div>

      <div className="toolbar">
        <input placeholder="Search by action, module or user..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={actionF} onChange={e => setActionF(e.target.value)}>
          <option value="">All actions</option>
          {['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={tableF} onChange={e => setTableF(e.target.value)}>
          <option value="">All modules</option>
          {uniqueTables.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {logs.length === 0 ? '📋 No audit logs yet — set up the table using the instructions above' : 'No results found'}
            </div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '14%' }}>Action</th>
                <th style={{ width: '16%' }}>Module</th>
                <th style={{ width: '32%' }}>Details</th>
                <th style={{ width: '18%' }}>Performed by</th>
                <th style={{ width: '20%' }}>Date & time</th>
              </tr></thead>
              <tbody>
                {filtered.map(l => {
                  const ac = actionColour(l.action);
                  return (
                    <tr key={l.id} className={sel?.id === l.id ? 'selected' : ''} onClick={() => setSel(l)}>
                      <td><span className="pill" style={{ background: ac.bg, color: ac.tx }}>{l.action}</span></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}><span>{tableIcon(l.table_name)}</span>{l.table_name}</div></td>
                      <td style={{ fontSize: 11, color: '#555' }}>{l.details || '—'}</td>
                      <td style={{ fontSize: 11 }}>{l.performed_by || '—'}</td>
                      <td style={{ fontSize: 11, color: '#888' }}>{new Date(l.created_at).toLocaleString('en-ZA')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {sel ? (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Log details</div>
            {[
              ['Action', sel.action],
              ['Module', sel.table_name],
              ['Record ID', sel.record_id || '—'],
              ['Performed by', sel.performed_by || '—'],
              ['IP Address', sel.ip_address || '—'],
              ['Date & time', new Date(sel.created_at).toLocaleString('en-ZA')],
            ].map(([l, v]) => (
              <div key={l} className="d-row">
                <span className="d-label">{l}</span>
                <span className="d-value" style={{ fontSize: 11 }}>{v}</span>
              </div>
            ))}
            {sel.details && (
              <>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 500, margin: '10px 0 4px' }}>Details</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, background: '#FAFAF8', borderRadius: 6, padding: '8px 10px' }}>{sel.details}</div>
              </>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 13 }}>Click a log entry to view details</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
