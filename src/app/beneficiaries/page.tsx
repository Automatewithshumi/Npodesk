'use client';
import { useState } from 'react';
import { BENEFICIARIES, CAREGIVERS, COLOURS, ini } from '@/lib/data';

const statusPill = (s: string) => {
  const map: Record<string, string> = { Active: 'pill-green', New: 'pill-blue', Inactive: 'pill-gray' };
  return <span className={`pill ${map[s] || 'pill-gray'}`}>{s}</span>;
};

export default function BeneficiariesPage() {
  const [tab, setTab] = useState<'beneficiaries' | 'caregivers'>('beneficiaries');
  const [selBen, setSelBen] = useState(0);
  const [selCg, setSelCg] = useState(0);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [typeF, setTypeF] = useState('');

  const filteredBens = BENEFICIARIES.filter(b =>
    (!search || b.name.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()) || b.area.toLowerCase().includes(search.toLowerCase()) || b.cg.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF || b.status === statusF) && (!typeF || b.type === typeF)
  );

  const ben = BENEFICIARIES[selBen];
  const cg = CAREGIVERS.find(c => c.id === ben?.cgId) || CAREGIVERS[0];
  const cgSelected = CAREGIVERS[selCg];
  const cgBens = BENEFICIARIES.filter(b => b.cgId === cgSelected?.id);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Beneficiary management</div>
          <div className="page-sub">Profiles, caregivers & meal history</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <span style={{ fontSize: 12, color: '#888', background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '4px 10px' }}>May 2026</span>
        </div>
      </div>

      <div className="metrics-grid">
        {[
          { label: '👥 Total registered', value: '2,108', delta: '+143 this month', up: true },
          { label: '✅ Active', value: '1,864', delta: '88% of total', up: true },
          { label: '🩺 Caregivers', value: '18', delta: '+2 this month', up: true },
          { label: '⏳ Pending profiles', value: '34', delta: 'Awaiting visit', up: false },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.up ? 'delta-up' : 'delta-warn'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="subtabs">
        {(['beneficiaries', 'caregivers'] as const).map(t => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'beneficiaries' ? '👥 Beneficiaries' : '🩺 Caregivers'}
          </button>
        ))}
      </div>

      {tab === 'beneficiaries' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Beneficiary registry</span>
            <div className="flex-gap">
              <button className="btn btn-sm">⬇ Export</button>
              <button className="btn btn-primary btn-sm">+ Register beneficiary</button>
            </div>
          </div>
          <div className="toolbar">
            <input placeholder="Search name, ID or area..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {['Active','New','Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={typeF} onChange={e => setTypeF(e.target.value)}>
              <option value="">All types</option>
              {['Adult','Child','Elderly','Disabled'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '35%' }}>Name</th>
                  <th style={{ width: '14%' }}>ID</th>
                  <th style={{ width: '13%' }}>Type</th>
                  <th style={{ width: '20%' }}>Caregiver</th>
                  <th style={{ width: '10%' }}>Area</th>
                  <th style={{ width: '12%' }}>Status</th>
                </tr></thead>
                <tbody>
                  {filteredBens.map((b) => {
                    const idx = BENEFICIARIES.indexOf(b);
                    return (
                      <tr key={b.id} className={idx === selBen ? 'selected' : ''} onClick={() => setSelBen(idx)}>
                        <td><div className="name-cell">
                          <div className="av" style={{ background: COLOURS[b.c].bg, color: COLOURS[b.c].tx }}>{ini(b.name)}</div>
                          {b.name}
                        </div></td>
                        <td style={{ fontSize: 11, color: '#888' }}>{b.id}</td>
                        <td style={{ fontSize: 12 }}>{b.type}</td>
                        <td><div className="name-cell">
                          <div className="av" style={{ background: '#EEEDFE', color: '#3C3489', fontSize: 8 }}>{ini(b.cg)}</div>
                          <span style={{ fontSize: 11 }}>{b.cg.split(' ')[0]}</span>
                        </div></td>
                        <td style={{ fontSize: 11 }}>{b.area}</td>
                        <td>{statusPill(b.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {ben && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: COLOURS[ben.c].bg, color: COLOURS[ben.c].tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(ben.name)}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{ben.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{ben.id} · {ben.area}</div>
                    </div>
                  </div>
                  {[['Type', ben.type], ['Household', ben.hh], ['Area', ben.area], ['Contact', ben.phone], ['Registered', ben.reg], ['Status', ben.status]].map(([l, v]) => (
                    <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value">{l === 'Status' ? statusPill(v) : v}</span></div>
                  ))}
                  <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{ben.notes}</div>
                  <div className="flex-gap">
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✏ Edit</button>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>🖨 Print card</button>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 8 }}>🩺 Assigned caregiver</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#FAFAF8', border: '0.5px solid rgba(0,0,0,0.07)', cursor: 'pointer', marginBottom: 12 }}
                    onClick={() => { setTab('caregivers'); setSelCg(CAREGIVERS.findIndex(c => c.id === ben.cgId)); }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEEDFE', color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>{ini(cg.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{cg.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{cg.id} · {cg.area} · {cg.assigned} beneficiaries</div>
                    </div>
                    <span style={{ fontSize: 14, color: '#aaa' }}>›</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8 }}>Meal history</div>
                  {[['22 May 2026','Hot meal — outreach','green'],['19 May 2026','Food parcel','green'],['15 May 2026','Hot meal — outreach','green'],['12 May 2026','Food parcel','amber']].map(([date,desc,c],i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 3 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 12 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c === 'green' ? '#1D9E75' : '#BA7517', flexShrink: 0 }} />
                      <span style={{ minWidth: 80, fontSize: 11, color: '#aaa' }}>{date}</span>
                      <span style={{ flex: 1 }}>{desc}</span>
                      <span className={`pill ${c === 'green' ? 'pill-green' : 'pill-amber'}`}>{c === 'green' ? 'Collected' : 'Missed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'caregivers' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Caregiver directory</span>
            <button className="btn btn-primary btn-sm">+ Add caregiver</button>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '30%' }}>Name</th>
                  <th style={{ width: '14%' }}>CG ID</th>
                  <th style={{ width: '18%' }}>Area</th>
                  <th style={{ width: '14%' }}>Assigned</th>
                  <th style={{ width: '14%' }}>Profiles</th>
                  <th style={{ width: '12%' }}>Pending</th>
                </tr></thead>
                <tbody>
                  {CAREGIVERS.map((c, i) => (
                    <tr key={c.id} className={i === selCg ? 'selected' : ''} onClick={() => setSelCg(i)}>
                      <td><div className="name-cell"><div className="av" style={{ background: '#EEEDFE', color: '#3C3489' }}>{ini(c.name)}</div>{c.name}</div></td>
                      <td style={{ fontSize: 11, color: '#888' }}>{c.id}</td>
                      <td style={{ fontSize: 12 }}>{c.area}</td>
                      <td style={{ fontWeight: 500 }}>{c.assigned}</td>
                      <td><span className={`pill ${c.profiles === c.assigned ? 'pill-green' : 'pill-amber'}`}>{c.profiles}/{c.assigned}</span></td>
                      <td><span className={`pill ${c.pending > 0 ? 'pill-amber' : 'pill-green'}`}>{c.pending}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cgSelected && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#EEEDFE', color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(cgSelected.name)}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{cgSelected.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{cgSelected.id} · Caregiver · {cgSelected.area}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[['Assigned', cgSelected.assigned], ['Profiles', cgSelected.profiles], ['Pending', cgSelected.pending]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, background: '#FAFAF8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 500, color: l === 'Pending' && Number(v) > 0 ? '#BA7517' : '#1a1a1a' }}>{v}</div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {[['Area', cgSelected.area], ['Contact', cgSelected.phone], ['Since', cgSelected.since]].map(([l, v]) => (
                  <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value">{v}</span></div>
                ))}
                <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{cgSelected.notes}</div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8 }}>Assigned beneficiaries ({cgBens.length})</div>
                {cgBens.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                    <div className="av" style={{ background: COLOURS[b.c].bg, color: COLOURS[b.c].tx }}>{ini(b.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{b.id} · {b.type}</div>
                    </div>
                    {statusPill(b.status)}
                  </div>
                ))}
                <div className="flex-gap" style={{ marginTop: 12 }}>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✏ Edit</button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>🔄 Reassign</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
