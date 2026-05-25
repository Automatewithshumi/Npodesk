'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Site = { id: string; name: string; area: string; program: string; address: string; capacity: number; operating_hours: string; operating_days: string; active: boolean; };
type MealLog = { id: string; site_id: string; log_date: string; meals_served: number; target: number; logged_by: string; notes: string; };

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

const programs = [
  { icon: '🔥', name: 'Hot meals', color: '#D85A30', bg: '#FAECE7' },
  { icon: '📦', name: 'Food parcels', color: '#1D9E75', bg: '#EAF3DE' },
  { icon: '🏫', name: 'School feeding', color: '#185FA5', bg: '#E6F1FB' },
  { icon: '♿', name: 'Elderly care', color: '#534AB7', bg: '#EEEDFE' },
  { icon: '👶', name: 'Baby nutrition', color: '#D4537E', bg: '#FBEAF0' },
  { icon: '🌍', name: 'Weekend outreach', color: '#BA7517', bg: '#FAEEDA' },
];

export default function MealProgramsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [sel, setSel] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sites' | 'log'>('sites');
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');

  const [siteForm, setSiteForm] = useState({ name: '', area: 'Soweto', program: 'Hot meals', address: '', capacity: 100, operating_hours: '07:00–12:00', operating_days: 'Mon–Sat' });
  const [logForm, setLogForm] = useState({ site_id: '', log_date: new Date().toISOString().split('T')[0], meals_served: 0, target: 100, logged_by: 'Rachel', notes: '' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (oid: string) => {
    setLoading(true);
    const [sRes, lRes] = await Promise.all([
      supabase.from('meal_sites').select('*').eq('org_id', oid).order('name'),
      supabase.from('meal_logs').select('*').eq('org_id', oid).order('log_date', { ascending: false })
    ]);
    if (sRes.data) setSites(sRes.data);
    if (lRes.data) setLogs(lRes.data);
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

  const todayTotal = logs.filter(l => l.log_date === new Date().toISOString().split('T')[0]).reduce((s, l) => s + l.meals_served, 0);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteForm.name.trim()) { showToast('Please enter a site name', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('meal_sites').insert({ ...siteForm, org_id: orgId, active: true });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast(`${siteForm.name} added successfully!`); setShowSiteForm(false); setSiteForm({ name: '', area: 'Soweto', program: 'Hot meals', address: '', capacity: 100, operating_hours: '07:00–12:00', operating_days: 'Mon–Sat' }); loadData(orgId); }
    setSaving(false);
  };

  const handleLogMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.site_id) { showToast('Please select a site', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('meal_logs').insert({ ...logForm, org_id: orgId });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast(`${logForm.meals_served} meals logged successfully!`); setShowLogForm(false); setLogForm({ site_id: '', log_date: new Date().toISOString().split('T')[0], meals_served: 0, target: 100, logged_by: 'Rachel', notes: '' }); loadData(orgId); }
    setSaving(false);
  };

  const exportCSV = () => {
    if (logs.length === 0) { showToast('No meal logs to export yet', 'error'); return; }
    const headers = ['Site', 'Program', 'Date', 'Meals Served', 'Target', 'Logged By', 'Notes'];
    const rows = logs.map(l => {
      const site = sites.find(s => s.id === l.site_id);
      return [`"${site?.name || '—'}"`, `"${site?.program || '—'}"`, `"${l.log_date}"`, l.meals_served, l.target, `"${l.logged_by || ''}"`, `"${(l.notes || '').replace(/"/g, "'")}"`];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `meal_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${logs.length} meal logs`);
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div><div className="page-title">Meal programs</div><div className="page-sub">Sites, daily counts & delivery routes</div></div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🍲 Meals today', value: todayTotal.toString(), delta: 'From all sites' },
          { label: '🏢 Active sites', value: sites.filter(s => s.active).length.toString(), delta: 'Registered sites' },
          { label: '📋 Total logs', value: logs.length.toString(), delta: 'All meal records' },
          { label: '📊 Total served', value: logs.reduce((s, l) => s + l.meals_served, 0).toLocaleString(), delta: 'All time' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Program cards */}
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Programs</span>
      </div>
      <div className="three-col" style={{ marginBottom: 20 }}>
        {programs.map((p, i) => (
          <div key={i} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{sites.filter(s => s.program === p.name).length} site(s) registered</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: p.color }}>{logs.filter(l => sites.find(s => s.id === l.site_id && s.program === p.name)).reduce((s, l) => s + l.meals_served, 0).toLocaleString()} meals total</div>
          </div>
        ))}
      </div>

      <div className="subtabs">
        {(['sites', 'log'] as const).map(t => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'sites' ? '📍 Sites' : '📋 Daily log'}
          </button>
        ))}
      </div>

      {tab === 'sites' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Meal sites</span>
            <div className="flex-gap">
              <button className="btn btn-primary btn-sm" onClick={() => setShowSiteForm(!showSiteForm)}>
                {showSiteForm ? '✕ Cancel' : '+ Add site'}
              </button>
            </div>
          </div>

          {showSiteForm && (
            <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>📍 Add new meal site</div>
              <form onSubmit={handleAddSite}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Site name *</label><input className="form-input" value={siteForm.name} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} placeholder="e.g. Soweto North Kitchen" required /></div>
                  <div className="form-group"><label className="form-label">Area</label>
                    <select className="form-input" value={siteForm.area} onChange={e => setSiteForm({ ...siteForm, area: e.target.value })}>
                      {['Soweto', 'Alexandra', 'Diepsloot', 'Orange Farm', 'Tembisa', 'Sandton', 'Other'].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Program</label>
                    <select className="form-input" value={siteForm.program} onChange={e => setSiteForm({ ...siteForm, program: e.target.value })}>
                      {programs.map(p => <option key={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Daily capacity</label><input className="form-input" type="number" min={1} value={siteForm.capacity} onChange={e => setSiteForm({ ...siteForm, capacity: parseInt(e.target.value) || 100 })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Operating hours</label><input className="form-input" value={siteForm.operating_hours} onChange={e => setSiteForm({ ...siteForm, operating_hours: e.target.value })} placeholder="e.g. 07:00–12:00" /></div>
                  <div className="form-group"><label className="form-label">Operating days</label><input className="form-input" value={siteForm.operating_days} onChange={e => setSiteForm({ ...siteForm, operating_days: e.target.value })} placeholder="e.g. Mon–Sat" /></div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={siteForm.address} onChange={e => setSiteForm({ ...siteForm, address: e.target.value })} placeholder="Full street address" /></div>
                <div className="flex-gap" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSiteForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Add site'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="two-col">
            <div className="table-wrap">
              {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading sites...</div>
                : sites.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>📍 No sites yet — add your first site above!</div>
                : <table>
                  <thead><tr>
                    <th style={{ width: '28%' }}>Site name</th><th style={{ width: '16%' }}>Area</th>
                    <th style={{ width: '20%' }}>Program</th><th style={{ width: '14%' }}>Capacity</th>
                    <th style={{ width: '14%' }}>Total meals</th><th style={{ width: '10%' }}>Status</th>
                  </tr></thead>
                  <tbody>
                    {sites.map(s => (
                      <tr key={s.id} className={sel?.id === s.id ? 'selected' : ''} onClick={() => setSel(s)}>
                        <td style={{ fontWeight: 500, fontSize: 12 }}>{s.name}</td>
                        <td style={{ fontSize: 12 }}>{s.area}</td>
                        <td style={{ fontSize: 11 }}>{s.program}</td>
                        <td style={{ fontSize: 12 }}>{s.capacity}/day</td>
                        <td style={{ fontWeight: 500, color: '#D85A30' }}>{logs.filter(l => l.site_id === s.id).reduce((sum, l) => sum + l.meals_served, 0).toLocaleString()}</td>
                        <td><span className={`pill ${s.active ? 'pill-green' : 'pill-gray'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
            {sel ? (
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{sel.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Site details</div>
                {[['Area', sel.area], ['Program', sel.program], ['Address', sel.address || '—'], ['Hours', sel.operating_hours || '—'], ['Days', sel.operating_days || '—'], ['Capacity', `${sel.capacity} / day`], ['Total meals', logs.filter(l => l.site_id === sel.id).reduce((s, l) => s + l.meals_served, 0).toLocaleString()]].map(([l, v]) => (
                  <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={l === 'Total meals' ? { color: '#D85A30' } : {}}>{v}</span></div>
                ))}
                <div className="flex-gap" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setLogForm({ ...logForm, site_id: sel.id, target: sel.capacity }); setTab('log'); setShowLogForm(true); }}>📋 Log meals</button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#791F1F' }} onClick={async () => {
                    if (confirm(`Remove ${sel.name}?`)) {
                      await supabase.from('meal_sites').delete().eq('id', sel.id);
                      setSel(null); loadData(orgId); showToast(`${sel.name} removed`);
                    }
                  }}>🗑 Remove</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div style={{ textAlign: 'center', color: '#aaa' }}><div style={{ fontSize: 32, marginBottom: 8 }}>👆</div><div style={{ fontSize: 13 }}>Click a site to view details</div></div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'log' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Daily meal log</span>
            <div className="flex-gap">
              <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogForm(!showLogForm)}>
                {showLogForm ? '✕ Cancel' : '📋 Log today\'s meals'}
              </button>
            </div>
          </div>

          {showLogForm && (
            <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>📋 Log meal count</div>
              <form onSubmit={handleLogMeals}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Site *</label>
                    <select className="form-input" value={logForm.site_id} onChange={e => { const site = sites.find(s => s.id === e.target.value); setLogForm({ ...logForm, site_id: e.target.value, target: site?.capacity || 100 }); }} required>
                      <option value="">Select site</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={logForm.log_date} onChange={e => setLogForm({ ...logForm, log_date: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Meals served *</label><input className="form-input" type="number" min={0} value={logForm.meals_served} onChange={e => setLogForm({ ...logForm, meals_served: parseInt(e.target.value) || 0 })} required /></div>
                  <div className="form-group"><label className="form-label">Target</label><input className="form-input" type="number" min={0} value={logForm.target} onChange={e => setLogForm({ ...logForm, target: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Logged by</label><input className="form-input" value={logForm.logged_by} onChange={e => setLogForm({ ...logForm, logged_by: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} placeholder="Any observations..." /></div>
                </div>
                <div className="flex-gap" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowLogForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save log'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-wrap">
            {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading logs...</div>
              : logs.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>📋 No meal logs yet — log today&apos;s meals above!</div>
              : <table>
                <thead><tr>
                  <th style={{ width: '24%' }}>Site</th><th style={{ width: '16%' }}>Program</th>
                  <th style={{ width: '12%' }}>Date</th><th style={{ width: '12%' }}>Served</th>
                  <th style={{ width: '10%' }}>Target</th><th style={{ width: '10%' }}>%</th>
                  <th style={{ width: '16%' }}>Logged by</th>
                </tr></thead>
                <tbody>
                  {logs.map((l, i) => {
                    const site = sites.find(s => s.id === l.site_id);
                    const pct = l.target > 0 ? Math.round(l.meals_served / l.target * 100) : 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, fontSize: 12 }}>{site?.name || '—'}</td>
                        <td style={{ fontSize: 11 }}>{site?.program || '—'}</td>
                        <td style={{ fontSize: 12 }}>{new Date(l.log_date).toLocaleDateString('en-ZA')}</td>
                        <td style={{ fontWeight: 500, color: '#D85A30' }}>{l.meals_served}</td>
                        <td style={{ fontSize: 12 }}>{l.target}</td>
                        <td><span className={`pill ${pct >= 80 ? 'pill-green' : pct >= 50 ? 'pill-amber' : 'pill-red'}`}>{pct}%</span></td>
                        <td style={{ fontSize: 11 }}>{l.logged_by || '—'}</td>
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
