'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Donor = { id: string; name: string; type: string; email: string; phone: string; created_at: string; };
type Donation = { id: string; donor_id: string; amount: number; method: string; program: string; notes: string; received_at: string; };

const COLOURS = [
  { bg: '#E6F1FB', tx: '#0C447C' }, { bg: '#EAF3DE', tx: '#27500A' },
  { bg: '#EEEDFE', tx: '#3C3489' }, { bg: '#FAECE7', tx: '#712B13' },
  { bg: '#FAEEDA', tx: '#633806' }, { bg: '#E1F5EE', tx: '#085041' },
];
const ini = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const colourFor = (name: string) => COLOURS[name.charCodeAt(0) % COLOURS.length];

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [sel, setSel] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'crm' | 'form'>('crm');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('');

  const [donorForm, setDonorForm] = useState({ name: '', type: 'Individual', email: '', phone: '' });
  const [donationForm, setDonationForm] = useState({ donor_id: '', amount: '', method: 'EFT', program: 'General fund', notes: '', received_at: new Date().toISOString().split('T')[0] });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (oid: string) => {
    setLoading(true);
    const [dRes, donRes] = await Promise.all([
      supabase.from('donors').select('*').eq('org_id', oid).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('org_id', oid).order('received_at', { ascending: false })
    ]);
    if (dRes.data) setDonors(dRes.data);
    if (donRes.data) setDonations(donRes.data);
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

  const totalDonated = (donorId: string) => donations.filter(d => d.donor_id === donorId).reduce((sum, d) => sum + Number(d.amount), 0);
  const totalRaised = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorForm.name.trim()) { showToast('Please enter a donor name', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('donors').insert({ ...donorForm, org_id: orgId });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast(`${donorForm.name} added as donor!`); setDonorForm({ name: '', type: 'Individual', email: '', phone: '' }); loadData(orgId); }
    setSaving(false);
  };

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) { showToast('Please enter a valid amount', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('donations').insert({
      amount: parseFloat(donationForm.amount),
      method: donationForm.method,
      program: donationForm.program,
      notes: donationForm.notes,
      received_at: donationForm.received_at,
      donor_id: donationForm.donor_id || null,
      org_id: orgId
    });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else {
      showToast(`R${parseFloat(donationForm.amount).toLocaleString()} donation recorded!`);
      setDonationForm({ donor_id: '', amount: '', method: 'EFT', program: 'General fund', notes: '', received_at: new Date().toISOString().split('T')[0] });
      setTab('crm'); loadData(orgId);
    }
    setSaving(false);
  };

  const exportCSV = () => {
    if (donors.length === 0) { showToast('No donors to export yet', 'error'); return; }
    const headers = ['Donor Name', 'Type', 'Email', 'Phone', 'Total Donated (ZAR)', 'Number of Donations', 'Added Date'];
    const rows = donors.map(d => [
      `"${d.name}"`, `"${d.type}"`, `"${d.email || ''}"`, `"${d.phone || ''}"`,
      totalDonated(d.id), donations.filter(don => don.donor_id === d.id).length,
      `"${new Date(d.created_at).toLocaleDateString('en-ZA')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `donors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${donors.length} donors`);
  };

  const tPill = (t: string) => {
    const map: Record<string, string> = { Corporate: 'pill-blue', Individual: 'pill-green', Government: 'pill-purple', Community: 'pill-amber' };
    return <span className={`pill ${map[t] || 'pill-gray'}`}>{t}</span>;
  };

  const filtered = donors.filter(d =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) && (!typeF || d.type === typeF)
  );

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div><div className="page-title">Donor CRM</div><div className="page-sub">Giving history, relationships & receipts</div></div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '👥 Total donors', value: donors.length.toString(), delta: 'All time' },
          { label: '💰 Total raised', value: `R${totalRaised.toLocaleString()}`, delta: 'All donations' },
          { label: '🏢 Corporate', value: donors.filter(d => d.type === 'Corporate').length.toString(), delta: 'Corporate donors' },
          { label: '📊 Donations', value: donations.length.toString(), delta: 'Total records' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="subtabs">
        {(['crm', 'form'] as const).map(t => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'crm' ? '📒 Donor CRM' : '+ Record donation'}
          </button>
        ))}
      </div>

      {tab === 'crm' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Donor directory</span>
            <div className="flex-gap">
              <button className="btn btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('form')}>+ Add donor</button>
            </div>
          </div>
          <div className="toolbar">
            <input placeholder="Search donor..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={typeF} onChange={e => setTypeF(e.target.value)}>
              <option value="">All types</option>
              {['Corporate', 'Individual', 'Community', 'Government'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading donors...</div>
                : filtered.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>💰 No donors yet — add your first one!</div>
                : <table>
                  <thead><tr>
                    <th style={{ width: '32%' }}>Donor</th><th style={{ width: '16%' }}>Type</th>
                    <th style={{ width: '20%' }}>Total given</th><th style={{ width: '16%' }}>Donations</th>
                    <th style={{ width: '16%' }}>Since</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id} className={sel?.id === d.id ? 'selected' : ''} onClick={() => setSel(d)}>
                        <td><div className="name-cell"><div className="av" style={{ background: colourFor(d.name).bg, color: colourFor(d.name).tx }}>{ini(d.name)}</div>{d.name}</div></td>
                        <td>{tPill(d.type)}</td>
                        <td style={{ fontWeight: 500, color: '#27500A' }}>R{totalDonated(d.id).toLocaleString()}</td>
                        <td style={{ fontSize: 12 }}>{donations.filter(don => don.donor_id === d.id).length}</td>
                        <td style={{ fontSize: 11, color: '#888' }}>{new Date(d.created_at).toLocaleDateString('en-ZA')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
            {sel ? (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: colourFor(sel.name).bg, color: colourFor(sel.name).tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(sel.name)}</div>
                  <div><div style={{ fontWeight: 500, fontSize: 14 }}>{sel.name}</div><div style={{ fontSize: 11, color: '#888' }}>{sel.type} donor</div></div>
                </div>
                {[['Total given', `R${totalDonated(sel.id).toLocaleString()}`], ['Donations', donations.filter(d => d.donor_id === sel.id).length.toString()], ['Email', sel.email || '—'], ['Phone', sel.phone || '—'], ['Since', new Date(sel.created_at).toLocaleDateString('en-ZA')]].map(([l, v]) => (
                  <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={l === 'Total given' ? { color: '#27500A' } : {}}>{v}</span></div>
                ))}
                <div style={{ fontSize: 11, color: '#888', fontWeight: 500, margin: '12px 0 8px' }}>Donation history</div>
                {donations.filter(d => d.donor_id === sel.id).slice(0, 5).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)', fontSize: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{d.program} · {d.method}</span>
                    <span style={{ fontWeight: 500, color: '#27500A' }}>R{Number(d.amount).toLocaleString()}</span>
                  </div>
                ))}
                {donations.filter(d => d.donor_id === sel.id).length === 0 && <div style={{ fontSize: 12, color: '#aaa', padding: '8px 0' }}>No donations recorded yet</div>}
                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                  onClick={() => { setDonationForm({ ...donationForm, donor_id: sel.id }); setTab('form'); }}>
                  + Record donation for {sel.name.split(' ')[0]}
                </button>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div style={{ textAlign: 'center', color: '#aaa' }}><div style={{ fontSize: 32, marginBottom: 8 }}>👆</div><div style={{ fontSize: 13 }}>Click a donor to view profile</div></div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'form' && (
        <div className="two-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#D85A30' }}>💰 Record a donation</div>
              <form onSubmit={handleSaveDonation}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Donor</label>
                    <select className="form-input" value={donationForm.donor_id} onChange={e => setDonationForm({ ...donationForm, donor_id: e.target.value })}>
                      <option value="">Anonymous / not listed</option>
                      {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Amount (ZAR) *</label>
                    <input className="form-input" type="number" min="1" placeholder="e.g. 5000" value={donationForm.amount} onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Method</label>
                    <select className="form-input" value={donationForm.method} onChange={e => setDonationForm({ ...donationForm, method: e.target.value })}>
                      {['EFT', 'Cash', 'Food goods', 'In-kind', 'Online', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Date received</label>
                    <input className="form-input" type="date" value={donationForm.received_at} onChange={e => setDonationForm({ ...donationForm, received_at: e.target.value })} />
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Allocated to program</label>
                  <select className="form-input" value={donationForm.program} onChange={e => setDonationForm({ ...donationForm, program: e.target.value })}>
                    {['General fund', 'Hot meals', 'Food parcels', 'School feeding', 'Elderly care', 'Baby nutrition'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Notes / reference</label>
                  <textarea className="form-input" rows={2} value={donationForm.notes} onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })} placeholder="Transaction reference, invoice number..." />
                </div>
                <div className="flex-gap">
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTab('crm')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save donation'}</button>
                </div>
              </form>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>➕ Add new donor</div>
              <form onSubmit={handleSaveDonor}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Donor name *</label>
                    <input className="form-input" value={donorForm.name} onChange={e => setDonorForm({ ...donorForm, name: e.target.value })} placeholder="e.g. Shoprite Foundation" required />
                  </div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-input" value={donorForm.type} onChange={e => setDonorForm({ ...donorForm, type: e.target.value })}>
                      {['Individual', 'Corporate', 'Community', 'Government'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Email</label>
                    <input className="form-input" type="email" value={donorForm.email} onChange={e => setDonorForm({ ...donorForm, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="form-group"><label className="form-label">Phone</label>
                    <input className="form-input" value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} placeholder="07x xxx xxxx" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '⏳...' : '+ Add donor'}</button>
              </form>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Recent donations</div>
            {donations.length === 0 ? <div style={{ textAlign: 'center', color: '#aaa', padding: '1rem', fontSize: 13 }}>No donations recorded yet</div>
              : donations.slice(0, 10).map((d, i) => {
                const donor = donors.find(don => don.id === d.donor_id);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < donations.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>💰</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{donor?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{d.program} · {d.method} · {new Date(d.received_at).toLocaleDateString('en-ZA')}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#27500A' }}>R{Number(d.amount).toLocaleString()}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
