'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Volunteer = { id: string; full_name: string; role: string; area: string; phone: string; status: string; joined_at: string; };
type Shift = { id: string; volunteer_id: string; program: string; shift_date: string; start_time: string; end_time: string; hours: number; status: string; };

const COLOURS = [
  { bg: '#FAECE7', tx: '#712B13' }, { bg: '#E6F1FB', tx: '#0C447C' },
  { bg: '#E1F5EE', tx: '#085041' }, { bg: '#EEEDFE', tx: '#3C3489' },
  { bg: '#FAEEDA', tx: '#633806' }, { bg: '#EAF3DE', tx: '#27500A' },
];
const ini = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const colourFor = (name: string) => COLOURS[name.charCodeAt(0) % COLOURS.length];

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sel, setSel] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'roster' | 'schedule'>('roster');
  const [showVolForm, setShowVolForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [search, setSearch] = useState('');
  const [roleF, setRoleF] = useState('');
  const [statusF, setStatusF] = useState('');

  const [volForm, setVolForm] = useState({ full_name: '', role: 'Meal coordinator', area: 'Soweto', phone: '', status: 'Active' });
  const [shiftForm, setShiftForm] = useState({ volunteer_id: '', program: 'Hot meals', shift_date: new Date().toISOString().split('T')[0], start_time: '07:00', end_time: '12:00', hours: 5, status: 'Confirmed' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (oid: string) => {
    setLoading(true);
    const [vRes, sRes] = await Promise.all([
      supabase.from('volunteers').select('*').eq('org_id', oid).order('joined_at', { ascending: false }),
      supabase.from('shifts').select('*').eq('org_id', oid).order('shift_date', { ascending: false })
    ]);
    if (vRes.data) setVolunteers(vRes.data);
    if (sRes.data) setShifts(sRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadData(userData.org_id); }
      else setLoading(false);
    });
  }, [loadData]);

  const totalHours = (volId: string) => shifts.filter(s => s.volunteer_id === volId).reduce((sum, s) => sum + (s.hours || 0), 0);
  const totalShifts = (volId: string) => shifts.filter(s => s.volunteer_id === volId).length;

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volForm.full_name.trim()) { showToast('Please enter a full name', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('volunteers').insert({ ...volForm, org_id: orgId });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast(`${volForm.full_name} added as volunteer!`); setShowVolForm(false); setVolForm({ full_name: '', role: 'Meal coordinator', area: 'Soweto', phone: '', status: 'Active' }); loadData(orgId); }
    setSaving(false);
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.volunteer_id) { showToast('Please select a volunteer', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('shifts').insert({ ...shiftForm, org_id: orgId, volunteer_id: shiftForm.volunteer_id });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast('Shift added successfully!'); setShowShiftForm(false); loadData(orgId); }
    setSaving(false);
  };

  const exportCSV = () => {
    if (volunteers.length === 0) { showToast('No volunteers to export yet', 'error'); return; }
    const headers = ['Full Name', 'Role', 'Area', 'Phone', 'Status', 'Total Hours', 'Total Shifts', 'Joined Date'];
    const rows = volunteers.map(v => [
      `"${v.full_name}"`, `"${v.role}"`, `"${v.area}"`, `"${v.phone || ''}"`,
      `"${v.status}"`, totalHours(v.id), totalShifts(v.id),
      `"${new Date(v.joined_at).toLocaleDateString('en-ZA')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `volunteers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${volunteers.length} volunteers`);
  };

  const sPill = (s: string) => {
    if (s === 'Active') return <span className="pill pill-green">Active</span>;
    if (s === 'New') return <span className="pill pill-blue">New</span>;
    return <span className="pill pill-gray">On leave</span>;
  };

  const filtered = volunteers.filter(v =>
    (!search || v.full_name.toLowerCase().includes(search.toLowerCase()) || v.role.toLowerCase().includes(search.toLowerCase())) &&
    (!roleF || v.role === roleF) && (!statusF || v.status === statusF)
  );

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div><div className="page-title">Volunteer management</div><div className="page-sub">Roster, shifts & hours tracking</div></div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🤝 Total volunteers', value: volunteers.length.toString(), delta: 'All time' },
          { label: '🕐 Total hours', value: shifts.reduce((s, sh) => s + (sh.hours || 0), 0).toString(), delta: 'All recorded shifts' },
          { label: '📅 Total shifts', value: shifts.length.toString(), delta: 'All time' },
          { label: '⚠️ Unfilled', value: shifts.filter(s => s.status === 'Unfilled').length.toString(), delta: 'Need cover' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="subtabs">
        {(['roster', 'schedule'] as const).map(t => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'roster' ? '📋 Roster' : '📅 Schedule'}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Volunteer roster</span>
            <div className="flex-gap">
              <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowVolForm(!showVolForm)}>
                {showVolForm ? '✕ Cancel' : '+ Add volunteer'}
              </button>
            </div>
          </div>

          {showVolForm && (
            <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>🤝 Add new volunteer</div>
              <form onSubmit={handleAddVolunteer}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Full name *</label><input className="form-input" value={volForm.full_name} onChange={e => setVolForm({ ...volForm, full_name: e.target.value })} placeholder="e.g. Thabo Nkosi" required /></div>
                  <div className="form-group"><label className="form-label">Role</label>
                    <select className="form-input" value={volForm.role} onChange={e => setVolForm({ ...volForm, role: e.target.value })}>
                      {['Meal coordinator', 'Delivery driver', 'Food packer', 'School liaison', 'Registration', 'Admin', 'Other'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Area</label>
                    <select className="form-input" value={volForm.area} onChange={e => setVolForm({ ...volForm, area: e.target.value })}>
                      {['Soweto', 'Alexandra', 'Diepsloot', 'Orange Farm', 'Tembisa', 'Sandton', 'Other'].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={volForm.phone} onChange={e => setVolForm({ ...volForm, phone: e.target.value })} placeholder="07x xxx xxxx" /></div>
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-input" value={volForm.status} onChange={e => setVolForm({ ...volForm, status: e.target.value })}>
                    {['Active', 'New', 'On leave'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-gap" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowVolForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Add volunteer'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="toolbar">
            <input placeholder="Search name or role..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={roleF} onChange={e => setRoleF(e.target.value)}>
              <option value="">All roles</option>
              {['Meal coordinator', 'Delivery driver', 'Food packer', 'School liaison', 'Registration', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {['Active', 'New', 'On leave'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="two-col">
            <div className="table-wrap">
              {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading volunteers...</div>
                : filtered.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>{volunteers.length === 0 ? '🤝 No volunteers yet — add your first one above!' : 'No results found'}</div>
                : <table>
                  <thead><tr>
                    <th style={{ width: '30%' }}>Name</th><th style={{ width: '22%' }}>Role</th>
                    <th style={{ width: '14%' }}>Area</th><th style={{ width: '12%' }}>Hours</th>
                    <th style={{ width: '10%' }}>Shifts</th><th style={{ width: '12%' }}>Status</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(v => (
                      <tr key={v.id} className={sel?.id === v.id ? 'selected' : ''} onClick={() => setSel(v)}>
                        <td><div className="name-cell"><div className="av" style={{ background: colourFor(v.full_name).bg, color: colourFor(v.full_name).tx }}>{ini(v.full_name)}</div>{v.full_name}</div></td>
                        <td style={{ fontSize: 12 }}>{v.role}</td><td style={{ fontSize: 12 }}>{v.area}</td>
                        <td style={{ fontWeight: 500, color: '#D85A30' }}>{totalHours(v.id)}h</td>
                        <td style={{ fontSize: 12 }}>{totalShifts(v.id)}</td><td>{sPill(v.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
            {sel ? (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: colourFor(sel.full_name).bg, color: colourFor(sel.full_name).tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(sel.full_name)}</div>
                  <div><div style={{ fontWeight: 500, fontSize: 14 }}>{sel.full_name}</div><div style={{ fontSize: 11, color: '#888' }}>{sel.role} · {sel.area}</div></div>
                </div>
                {[['Role', sel.role], ['Area', sel.area], ['Phone', sel.phone || '—'], ['Hours', `${totalHours(sel.id)}h`], ['Shifts', totalShifts(sel.id).toString()], ['Joined', new Date(sel.joined_at).toLocaleDateString('en-ZA')]].map(([l, v]) => (
                  <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={l === 'Hours' ? { color: '#D85A30' } : {}}>{v}</span></div>
                ))}
                <div className="flex-gap" style={{ marginTop: 14 }}>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShiftForm({ ...shiftForm, volunteer_id: sel.id }); setTab('schedule'); setShowShiftForm(true); }}>📅 Add shift</button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#791F1F' }} onClick={async () => {
                    if (confirm(`Remove ${sel.full_name}?`)) {
                      await supabase.from('volunteers').delete().eq('id', sel.id);
                      setSel(null); loadData(orgId); showToast(`${sel.full_name} removed`);
                    }
                  }}>🗑 Remove</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div style={{ textAlign: 'center', color: '#aaa' }}><div style={{ fontSize: 32, marginBottom: 8 }}>👆</div><div style={{ fontSize: 13 }}>Click a volunteer to view profile</div></div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Shift schedule</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowShiftForm(!showShiftForm)}>
              {showShiftForm ? '✕ Cancel' : '+ Add shift'}
            </button>
          </div>

          {showShiftForm && (
            <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>📅 Add new shift</div>
              <form onSubmit={handleAddShift}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Volunteer *</label>
                    <select className="form-input" value={shiftForm.volunteer_id} onChange={e => setShiftForm({ ...shiftForm, volunteer_id: e.target.value })} required>
                      <option value="">Select volunteer</option>
                      {volunteers.map(v => <option key={v.id} value={v.id}>{v.full_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Program</label>
                    <select className="form-input" value={shiftForm.program} onChange={e => setShiftForm({ ...shiftForm, program: e.target.value })}>
                      {['Hot meals', 'Food parcels', 'School feeding', 'Elderly care', 'Delivery', 'Food packing', 'Registration'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={shiftForm.shift_date} onChange={e => setShiftForm({ ...shiftForm, shift_date: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Hours</label><input className="form-input" type="number" min={1} max={24} value={shiftForm.hours} onChange={e => setShiftForm({ ...shiftForm, hours: parseFloat(e.target.value) })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Start time</label><input className="form-input" type="time" value={shiftForm.start_time} onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">End time</label><input className="form-input" type="time" value={shiftForm.end_time} onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-input" value={shiftForm.status} onChange={e => setShiftForm({ ...shiftForm, status: e.target.value })}>
                    {['Confirmed', 'Unfilled', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-gap" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowShiftForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Add shift'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-wrap">
            {shifts.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>📅 No shifts scheduled yet — add the first one above!</div>
              : <table>
                <thead><tr>
                  <th style={{ width: '25%' }}>Volunteer</th><th style={{ width: '18%' }}>Program</th>
                  <th style={{ width: '14%' }}>Date</th><th style={{ width: '12%' }}>Hours</th>
                  <th style={{ width: '18%' }}>Time</th><th style={{ width: '13%' }}>Status</th>
                </tr></thead>
                <tbody>
                  {shifts.map(s => {
                    const vol = volunteers.find(v => v.id === s.volunteer_id);
                    return (
                      <tr key={s.id}>
                        <td><div className="name-cell">{vol && <div className="av" style={{ background: colourFor(vol.full_name).bg, color: colourFor(vol.full_name).tx }}>{ini(vol.full_name)}</div>}{vol?.full_name || '—'}</div></td>
                        <td style={{ fontSize: 12 }}>{s.program}</td>
                        <td style={{ fontSize: 12 }}>{new Date(s.shift_date).toLocaleDateString('en-ZA')}</td>
                        <td style={{ fontWeight: 500, color: '#D85A30' }}>{s.hours}h</td>
                        <td style={{ fontSize: 11, color: '#888' }}>{s.start_time} – {s.end_time}</td>
                        <td><span className={`pill ${s.status === 'Confirmed' || s.status === 'Completed' ? 'pill-green' : s.status === 'Unfilled' ? 'pill-red' : 'pill-gray'}`}>{s.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>}
          </div>
        </>
      )}
    </>
  );
}
