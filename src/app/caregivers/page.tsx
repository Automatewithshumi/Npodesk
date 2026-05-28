'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Caregiver = {
  id: string; name: string; area: string; phone: string;
  status: string; since: string; notes: string;
};
type Beneficiary = {
  id: string; full_name: string; type: string; area: string;
  status: string; caregiver_id: string;
};

const COLOURS = [
  { bg: '#EEEDFE', tx: '#3C3489' }, { bg: '#E6F1FB', tx: '#0C447C' },
  { bg: '#E1F5EE', tx: '#085041' }, { bg: '#FAECE7', tx: '#712B13' },
  { bg: '#FAEEDA', tx: '#633806' }, { bg: '#EAF3DE', tx: '#27500A' },
];
const ini = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const colourFor = (name: string) => COLOURS[name.charCodeAt(0) % COLOURS.length];

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

const statusPill = (s: string) => {
  if (s === 'Active') return <span className="pill pill-green">Active</span>;
  if (s === 'New') return <span className="pill pill-blue">New</span>;
  return <span className="pill pill-gray">Inactive</span>;
};

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sel, setSel] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [search, setSearch] = useState('');
  const [areaF, setAreaF] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignBenId, setAssignBenId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [form, setForm] = useState({
    name: '', area: 'Soweto', phone: '', status: 'Active', notes: ''
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (oid: string) => {
    setLoading(true);
    const [cRes, bRes] = await Promise.all([
      supabase.from('caregivers').select('*').eq('org_id', oid).order('name'),
      supabase.from('beneficiaries').select('id, full_name, type, area, status, caregiver_id').eq('org_id', oid),
    ]);
    if (cRes.data) setCaregivers(cRes.data);
    if (bRes.data) setBeneficiaries(bRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadData(userData.org_id); }
      else setLoading(false);
    });
  }, [loadData]);

  const assignedTo = (cgId: string) => beneficiaries.filter(b => b.caregiver_id === cgId);
  const unassigned = beneficiaries.filter(b => !b.caregiver_id);
  const totalAssigned = beneficiaries.filter(b => b.caregiver_id).length;

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Please enter a name', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('caregivers').insert({ ...form, org_id: orgId });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else {
      showToast(`${form.name} added as caregiver!`);
      setShowForm(false);
      setForm({ name: '', area: 'Soweto', phone: '', status: 'Active', notes: '' });
      loadData(orgId);
    }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!assignBenId || !sel) return;
    setAssigning(true);
    const { error } = await supabase.from('beneficiaries')
      .update({ caregiver_id: sel.id }).eq('id', assignBenId);
    if (error) { showToast('Failed to assign', 'error'); }
    else {
      const ben = beneficiaries.find(b => b.id === assignBenId);
      showToast(`${ben?.full_name} assigned to ${sel.name}!`);
      setShowAssignForm(false);
      setAssignBenId('');
      loadData(orgId);
    }
    setAssigning(false);
  };

  const handleUnassign = async (benId: string, benName: string) => {
    if (!confirm(`Remove ${benName} from this caregiver?`)) return;
    const { error } = await supabase.from('beneficiaries')
      .update({ caregiver_id: null }).eq('id', benId);
    if (!error) { showToast(`${benName} unassigned`); loadData(orgId); }
    else showToast('Failed to unassign', 'error');
  };

  const exportCSV = () => {
    if (caregivers.length === 0) { showToast('No caregivers to export', 'error'); return; }
    const headers = ['Name', 'Area', 'Phone', 'Status', 'Assigned Beneficiaries', 'Since'];
    const rows = caregivers.map(c => [
      `"${c.name}"`, `"${c.area}"`, `"${c.phone || ''}"`,
      `"${c.status}"`, assignedTo(c.id).length,
      `"${c.since ? new Date(c.since).toLocaleDateString('en-ZA') : ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `caregivers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${caregivers.length} caregivers`);
  };

  const filtered = caregivers.filter(c =>
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.area.toLowerCase().includes(search.toLowerCase())) &&
    (!areaF || c.area === areaF)
  );

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div>
          <div className="page-title">Caregiver management</div>
          <div className="page-sub">Caregivers collect beneficiary profiles in the field</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🩺 Total caregivers', value: caregivers.length.toString(), delta: 'Registered' },
          { label: '✅ Active', value: caregivers.filter(c => c.status === 'Active').length.toString(), delta: 'Currently active' },
          { label: '👥 Assigned', value: totalAssigned.toString(), delta: 'Beneficiaries assigned' },
          { label: '⏳ Unassigned', value: unassigned.length.toString(), delta: 'Need a caregiver' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.label.includes('Unassigned') && unassigned.length > 0 ? 'delta-warn' : 'delta-up'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Unassigned beneficiaries alert */}
      {unassigned.length > 0 && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #e0c080', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#633806' }}>{unassigned.length} beneficiar{unassigned.length === 1 ? 'y' : 'ies'} not yet assigned to a caregiver</div>
            <div style={{ fontSize: 12, color: '#854F0B' }}>Select a caregiver below and use the Assign button to link them</div>
          </div>
        </div>
      )}

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Caregiver directory</span>
        <div className="flex-gap">
          <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add caregiver'}
          </button>
        </div>
      </div>

      {/* Add caregiver form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>🩺 Add new caregiver</div>
          <form onSubmit={handleAddCaregiver}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Thandi Mokoena" required />
              </div>
              <div className="form-group">
                <label className="form-label">Area</label>
                <select className="form-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                  {['Soul City', 'Senqobile Phase 1', 'Senqobile Phase 2', 'Senqobile Phase 3', 'Senqobile Phase 4', 'Tudor Shaft', 'Extension 10', 'Leswasham', 'Other'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="07x xxx xxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Active', 'New', 'Inactive'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Areas covered, availability, background..." />
            </div>
            <div className="flex-gap" style={{ marginTop: 8 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Add caregiver'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input placeholder="Search caregiver name or area..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={areaF} onChange={e => setAreaF(e.target.value)}>
          <option value="">All areas</option>
          {['Soul City', 'Senqobile Phase 1', 'Senqobile Phase 2', 'Senqobile Phase 3', 'Senqobile Phase 4', 'Tudor Shaft', 'Extension 10', 'Leswasham'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading caregivers...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {caregivers.length === 0 ? '🩺 No caregivers yet — add your first one above!' : 'No results found'}
            </div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '30%' }}>Name</th>
                <th style={{ width: '16%' }}>Area</th>
                <th style={{ width: '14%' }}>Phone</th>
                <th style={{ width: '16%' }}>Assigned</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '12%' }}>Profiles</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className={sel?.id === c.id ? 'selected' : ''} onClick={() => setSel(c)}>
                    <td><div className="name-cell">
                      <div className="av" style={{ background: colourFor(c.name).bg, color: colourFor(c.name).tx }}>{ini(c.name)}</div>
                      {c.name}
                    </div></td>
                    <td style={{ fontSize: 12 }}>{c.area}</td>
                    <td style={{ fontSize: 11, color: '#888' }}>{c.phone || '—'}</td>
                    <td>
                      <span className="pill pill-blue">{assignedTo(c.id).length} assigned</span>
                    </td>
                    <td>{statusPill(c.status)}</td>
                    <td>
                      <span className={`pill ${assignedTo(c.id).length > 0 ? 'pill-green' : 'pill-gray'}`}>
                        {assignedTo(c.id).length} / {assignedTo(c.id).length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Profile panel */}
        {sel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: colourFor(sel.name).bg, color: colourFor(sel.name).tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 14 }}>{ini(sel.name)}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{sel.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Caregiver · {sel.area}</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  ['👥', assignedTo(sel.id).length, 'Assigned'],
                  ['✅', assignedTo(sel.id).filter(b => b.status === 'Active').length, 'Active'],
                  ['🆕', assignedTo(sel.id).filter(b => b.status === 'New').length, 'New'],
                ].map(([icon, val, lbl], i) => (
                  <div key={i} style={{ flex: 1, background: '#FAFAF8', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16 }}>{icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{lbl}</div>
                  </div>
                ))}
              </div>

              {[['Area', sel.area], ['Phone', sel.phone || '—'], ['Status', sel.status]].map(([l, v]) => (
                <div key={l} className="d-row">
                  <span className="d-label">{l}</span>
                  <span className="d-value">{l === 'Status' ? statusPill(v) : v}</span>
                </div>
              ))}
              {sel.notes && (
                <>
                  <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{sel.notes}</div>
                </>
              )}

              <div className="flex-gap" style={{ marginTop: 14 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowAssignForm(!showAssignForm)}>
                  {showAssignForm ? '✕ Cancel' : '+ Assign beneficiary'}
                </button>
                <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#791F1F' }}
                  onClick={async () => {
                    if (confirm(`Remove ${sel.name}? Any beneficiaries assigned will be unlinked.`)) {
                      // First unlink all beneficiaries from this caregiver
                      await supabase.from('beneficiaries').update({ caregiver_id: null }).eq('caregiver_id', sel.id);
                      // Then delete the caregiver
                      const { error } = await supabase.from('caregivers').delete().eq('id', sel.id);
                      if (error) { showToast(`Failed to delete: ${error.message}`, 'error'); }
                      else { setSel(null); loadData(orgId); showToast(`${sel.name} removed successfully`); }
                    }
                  }}>🗑 Remove</button>
              </div>

              {/* Assign form */}
              {showAssignForm && (
                <div style={{ marginTop: 14, padding: '12px', background: '#FAECE7', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#712B13', marginBottom: 8 }}>Assign a beneficiary to {sel.name.split(' ')[0]}</div>
                  <select className="form-input" value={assignBenId} onChange={e => setAssignBenId(e.target.value)} style={{ marginBottom: 8 }}>
                    <option value="">Select beneficiary...</option>
                    <optgroup label="Unassigned">
                      {unassigned.map(b => <option key={b.id} value={b.id}>{b.full_name} — {b.area}</option>)}
                    </optgroup>
                    <optgroup label="Already assigned (reassign)">
                      {beneficiaries.filter(b => b.caregiver_id && b.caregiver_id !== sel.id).map(b => <option key={b.id} value={b.id}>{b.full_name} — {b.area}</option>)}
                    </optgroup>
                  </select>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleAssign} disabled={!assignBenId || assigning}>
                    {assigning ? '⏳ Assigning...' : '✅ Confirm assignment'}
                  </button>
                </div>
              )}
            </div>

            {/* Assigned beneficiaries list */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                Assigned beneficiaries ({assignedTo(sel.id).length})
              </div>
              {assignedTo(sel.id).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '1rem', fontSize: 13 }}>
                  No beneficiaries assigned yet
                </div>
              ) : (
                assignedTo(sel.id).map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                    <div className="av" style={{ background: '#FAECE7', color: '#712B13' }}>{ini(b.full_name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{b.full_name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{b.type} · {b.area}</div>
                    </div>
                    <span className={`pill ${b.status === 'Active' ? 'pill-green' : b.status === 'New' ? 'pill-blue' : 'pill-gray'}`}>{b.status}</span>
                    <button
                      onClick={() => handleUnassign(b.id, b.full_name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: '0 4px' }}
                      title="Remove assignment">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 13 }}>Click a caregiver to view their profile and assigned beneficiaries</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
