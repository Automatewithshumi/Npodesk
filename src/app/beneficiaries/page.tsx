'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Beneficiary = {
  id: string;
  full_name: string;
  type: string;
  area: string;
  status: string;
  phone: string;
  household_size: number;
  notes: string;
  registered_at: string;
  id_number: string;
};

type Caregiver = {
  id: string;
  name: string;
  area: string;
};

const COLOURS = [
  { bg: '#FAECE7', tx: '#712B13' }, { bg: '#E6F1FB', tx: '#0C447C' },
  { bg: '#E1F5EE', tx: '#085041' }, { bg: '#EEEDFE', tx: '#3C3489' },
  { bg: '#FAEEDA', tx: '#633806' }, { bg: '#EAF3DE', tx: '#27500A' },
];
const ini = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const colourFor = (name: string) => COLOURS[name.charCodeAt(0) % COLOURS.length];

const statusPill = (s: string) => {
  const map: Record<string, string> = { Active: 'pill-green', New: 'pill-blue', Inactive: 'pill-gray' };
  return <span className={`pill ${map[s] || 'pill-gray'}`}>{s}</span>;
};

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Beneficiary | null>(null);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [orgId, setOrgId] = useState('');

  // Form state
  const [form, setForm] = useState({
    full_name: '', id_number: '', type: 'Adult', area: '',
    phone: '', household_size: 1, status: 'New',
    caregiver_id: '', notes: '', program: 'Hot meals + food parcels'
  });

  const loadData = useCallback(async (oid: string) => {
    const [bRes, cRes] = await Promise.all([
      supabase.from('beneficiaries').select('*').eq('org_id', oid).order('registered_at', { ascending: false }),
      supabase.from('caregivers').select('*').eq('org_id', oid)
    ]);
    if (bRes.data) setBeneficiaries(bRes.data);
    if (cRes.data) setCaregivers(cRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadData(userData.org_id); }
    });
  }, [loadData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('beneficiaries').insert({
      ...form, org_id: orgId,
      caregiver_id: form.caregiver_id || null,
    });
    if (!error) {
      setSuccess(`✅ ${form.full_name} registered successfully!`);
      setShowForm(false);
      setForm({ full_name: '', id_number: '', type: 'Adult', area: '', phone: '', household_size: 1, status: 'New', caregiver_id: '', notes: '', program: 'Hot meals + food parcels' });
      loadData(orgId);
      setTimeout(() => setSuccess(''), 4000);
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'ID Number', 'Type', 'Area', 'Phone', 'Household Size', 'Status', 'Registered'];
    const rows = beneficiaries.map(b => [b.full_name, b.id_number || '', b.type, b.area, b.phone, b.household_size, b.status, new Date(b.registered_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'beneficiaries.csv'; a.click();
  };

  const filtered = beneficiaries.filter(b =>
    (!search || b.full_name.toLowerCase().includes(search.toLowerCase()) || b.area?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF || b.status === statusF) && (!typeF || b.type === typeF)
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Beneficiary management</div>
          <div className="page-sub">{beneficiaries.length} registered · May 2026</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '👥 Total registered', value: beneficiaries.length.toString(), delta: 'All time' },
          { label: '✅ Active', value: beneficiaries.filter(b => b.status === 'Active').length.toString(), delta: 'Currently active' },
          { label: '🆕 New', value: beneficiaries.filter(b => b.status === 'New').length.toString(), delta: 'Pending activation' },
          { label: '🩺 Caregivers', value: caregivers.length.toString(), delta: 'Assigned' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #b0d890', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#27500A', fontWeight: 500 }}>
          {success}
        </div>
      )}

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Beneficiary registry</span>
        <div className="flex-gap">
          <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Register beneficiary'}
          </button>
        </div>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid #D85A30' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: '#D85A30' }}>📝 Register new beneficiary</div>
          <form onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full name *</label><input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Nomsa Dlamini" required /></div>
              <div className="form-group"><label className="form-label">ID / Passport number</label><input className="form-input" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} placeholder="SA ID or passport" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Type *</label>
                <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['Adult', 'Child', 'Elderly', 'Disabled'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Household size</label><input className="form-input" type="number" min={1} value={form.household_size} onChange={e => setForm({ ...form, household_size: parseInt(e.target.value) })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Area / Township *</label>
                <select className="form-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required>
                  <option value="">Select area</option>
                  {['Soweto', 'Alexandra', 'Diepsloot', 'Orange Farm', 'Tembisa', 'Sandton', 'Other'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contact number</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="07x xxx xxxx" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Assign caregiver</label>
                <select className="form-input" value={form.caregiver_id} onChange={e => setForm({ ...form, caregiver_id: e.target.value })}>
                  <option value="">No caregiver yet</option>
                  {caregivers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.area}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Program enrollment</label>
                <select className="form-input" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                  {['Hot meals only', 'Food parcels only', 'Hot meals + food parcels', 'School feeding', 'Elderly care'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes / special needs</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Dietary requirements, medical needs, household notes..." /></div>
            <div className="flex-gap" style={{ marginTop: 8 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save & register'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input placeholder="Search name or area..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          {['Active', 'New', 'Inactive'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          {['Adult', 'Child', 'Elderly', 'Disabled'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading beneficiaries...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {beneficiaries.length === 0 ? '👥 No beneficiaries yet — register your first one above!' : 'No results found'}
            </div>
          ) : (
            <table>
              <thead><tr>
                <th style={{ width: '35%' }}>Name</th>
                <th style={{ width: '13%' }}>Type</th>
                <th style={{ width: '18%' }}>Area</th>
                <th style={{ width: '18%' }}>Registered</th>
                <th style={{ width: '16%' }}>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className={sel?.id === b.id ? 'selected' : ''} onClick={() => setSel(b)}>
                    <td><div className="name-cell"><div className="av" style={{ background: colourFor(b.full_name).bg, color: colourFor(b.full_name).tx }}>{ini(b.full_name)}</div>{b.full_name}</div></td>
                    <td style={{ fontSize: 12 }}>{b.type}</td>
                    <td style={{ fontSize: 12 }}>{b.area}</td>
                    <td style={{ fontSize: 11, color: '#888' }}>{new Date(b.registered_at).toLocaleDateString('en-ZA')}</td>
                    <td>{statusPill(b.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {sel ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: colourFor(sel.full_name).bg, color: colourFor(sel.full_name).tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(sel.full_name)}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{sel.full_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{sel.area}</div>
              </div>
            </div>
            {[
              ['Type', sel.type],
              ['Household', `${sel.household_size} members`],
              ['Area', sel.area],
              ['Contact', sel.phone || '—'],
              ['ID Number', sel.id_number || '—'],
              ['Registered', new Date(sel.registered_at).toLocaleDateString('en-ZA')],
              ['Status', sel.status],
            ].map(([l, v]) => (
              <div key={l} className="d-row">
                <span className="d-label">{l}</span>
                <span className="d-value">{l === 'Status' ? statusPill(v) : v}</span>
              </div>
            ))}
            {sel.notes && <>
              <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{sel.notes}</div>
            </>}
            <div className="flex-gap" style={{ marginTop: 14 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                onClick={async () => {
                  const newStatus = sel.status === 'Active' ? 'Inactive' : 'Active';
                  await supabase.from('beneficiaries').update({ status: newStatus }).eq('id', sel.id);
                  setSel({ ...sel, status: newStatus });
                  loadData(orgId);
                }}>
                🔄 Toggle status
              </button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                onClick={async () => {
                  if (confirm(`Remove ${sel.full_name}?`)) {
                    await supabase.from('beneficiaries').delete().eq('id', sel.id);
                    setSel(null); loadData(orgId);
                  }
                }}>
                🗑 Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 13 }}>Click a beneficiary to view their profile</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
