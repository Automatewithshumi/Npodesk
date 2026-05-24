'use client';
import { useState } from 'react';
import { DONORS, COLOURS, ini } from '@/lib/data';

const recentDonations = [
  { name: 'Shoprite Foundation', type: 'Corporate', amount: 'R15,000', method: 'Food goods', c: 0 },
  { name: 'Pick n Pay CSI', type: 'Corporate', amount: 'R12,000', method: 'Food goods', c: 1 },
  { name: 'Sandton Church', type: 'Community', amount: 'R8,200', method: 'In-kind', c: 2 },
  { name: 'Sipho Radebe', type: 'Individual', amount: 'R5,000', method: 'EFT', c: 3 },
  { name: 'Ayanda Khumalo', type: 'Individual', amount: 'R2,500', method: 'EFT', c: 4 },
  { name: 'NDA Grant', type: 'Government', amount: 'R19,800', method: 'EFT', c: 5 },
];

export default function DonorsPage() {
  const [tab, setTab] = useState<'crm' | 'form'>('crm');
  const [sel, setSel] = useState(0);
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('');

  const tPill = (t: string) => {
    const map: Record<string, string> = { Corporate: 'pill-blue', Individual: 'pill-green', Government: 'pill-purple', Community: 'pill-amber' };
    return <span className={`pill ${map[t] || 'pill-gray'}`}>{t}</span>;
  };

  const filtered = DONORS.filter(d =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!typeF || d.type === typeF)
  );
  const donor = DONORS[sel];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Donor CRM</div>
          <div className="page-sub">Giving history, relationships & receipts</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '👥 Total donors', value: '47', delta: '+5 this month', up: true },
          { label: '💰 Raised (May)', value: 'R62,500', delta: '+14% vs April', up: true },
          { label: '🏢 Corporate donors', value: '12', delta: 'R42,000 total', up: true },
          { label: '🎯 Monthly target', value: '78%', delta: 'R62.5k of R80k', up: true },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">{m.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="prog-bg">
          <div className="prog-fill" style={{ width: '78%', background: '#D85A30' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
          <span>R62,500 raised</span><span>Target: R80,000</span>
        </div>
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
              <button className="btn btn-sm">⬇ Export</button>
              <button className="btn btn-primary btn-sm">+ Add donor</button>
            </div>
          </div>
          <div className="toolbar">
            <input placeholder="Search donor or organisation..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={typeF} onChange={e => setTypeF(e.target.value)}>
              <option value="">All types</option>
              {['Corporate','Individual','Community','Government'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '32%' }}>Donor</th>
                  <th style={{ width: '16%' }}>Type</th>
                  <th style={{ width: '18%' }}>Total given</th>
                  <th style={{ width: '18%' }}>Last gift</th>
                  <th style={{ width: '16%' }}>Method</th>
                </tr></thead>
                <tbody>
                  {filtered.map(d => {
                    const idx = DONORS.indexOf(d);
                    return (
                      <tr key={d.name} className={idx === sel ? 'selected' : ''} onClick={() => setSel(idx)}>
                        <td><div className="name-cell">
                          <div className={`av ${d.corp ? '' : ''}`} style={{ background: COLOURS[d.c].bg, color: COLOURS[d.c].tx, borderRadius: d.corp ? 6 : '50%' }}>{ini(d.name)}</div>
                          {d.name}
                        </div></td>
                        <td>{tPill(d.type)}</td>
                        <td style={{ fontWeight: 500, color: '#27500A' }}>{d.total}</td>
                        <td style={{ fontSize: 12 }}>{d.last}</td>
                        <td style={{ fontSize: 12 }}>{d.method}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {donor && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: donor.corp ? 8 : '50%', background: COLOURS[donor.c].bg, color: COLOURS[donor.c].tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(donor.name)}</div>
                  <div><div style={{ fontWeight: 500, fontSize: 14 }}>{donor.name}</div><div style={{ fontSize: 11, color: '#888' }}>{donor.type} donor</div></div>
                </div>
                {[['Total given', donor.total], ['Frequency', donor.freq], ['Method', donor.method], ['Contact', donor.contact], ['Since', donor.since], ['Last gift', donor.last]].map(([l, v]) => (
                  <div key={l} className="d-row">
                    <span className="d-label">{l}</span>
                    <span className="d-value" style={l === 'Total given' ? { color: '#27500A' } : { fontSize: 12 }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{donor.notes}</div>
                <div className="flex-gap">
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✉ Thank you</button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>📊 Impact report</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'form' && (
        <div className="two-col">
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Record a donation</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Donor name / organisation</label><input className="form-input" placeholder="e.g. Shoprite Foundation" /></div>
              <div className="form-group"><label className="form-label">Donor type</label><select className="form-input"><option>Corporate</option><option>Individual</option><option>Community</option><option>Government</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Amount (ZAR)</label><input className="form-input" type="number" placeholder="e.g. 5000" /></div>
              <div className="form-group"><label className="form-label">Donation method</label><select className="form-input"><option>EFT</option><option>Cash</option><option>Food goods</option><option>In-kind</option><option>Online</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date received</label><input className="form-input" type="date" /></div>
              <div className="form-group"><label className="form-label">Allocated to program</label><select className="form-input"><option>General fund</option><option>Hot meals</option><option>Food parcels</option><option>School feeding</option><option>Elderly care</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Reference / notes</label><textarea className="form-input" rows={3} placeholder="Transaction reference, invoice number, or notes..." /></div>
            <div className="form-group"><label className="form-label">Send thank-you receipt?</label><select className="form-input"><option>Yes — email receipt</option><option>Yes — WhatsApp</option><option>No receipt needed</option></select></div>
            <div className="flex-gap" style={{ marginTop: 4 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTab('crm')}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>💾 Save & receipt</button>
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>May 2026 donations</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Recent contributions</div>
            {recentDonations.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < recentDonations.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: COLOURS[d.c].bg, color: COLOURS[d.c].tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>{ini(d.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{d.type} · {d.method}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#27500A' }}>{d.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
