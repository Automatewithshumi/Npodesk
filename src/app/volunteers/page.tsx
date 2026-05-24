'use client';
import { useState } from 'react';
import { VOLUNTEERS, COLOURS, ini } from '@/lib/data';

const shifts = [
  { vol: 'Nomsa Mokoena', prog: 'Hot meals', day: 'Mon', time: '07:00–12:00', status: 'Confirmed', c: 0 },
  { vol: 'Thabo Nkosi', prog: 'Delivery', day: 'Mon', time: '09:00–14:00', status: 'Confirmed', c: 1 },
  { vol: 'Zanele Dlamini', prog: 'School feeding', day: 'Tue', time: '06:30–10:00', status: 'Confirmed', c: 2 },
  { vol: 'Kagiso Sithole', prog: 'Food packing', day: 'Wed', time: '08:00–13:00', status: 'Confirmed', c: 3 },
  { vol: 'Lerato Pietersen', prog: 'Registration', day: 'Wed', time: '09:00–12:00', status: 'Confirmed', c: 4 },
  { vol: 'Busi Khumalo', prog: 'Hot meals', day: 'Thu', time: '07:00–12:00', status: 'Unfilled', c: 0 },
  { vol: 'Sipho Radebe', prog: 'Delivery', day: 'Fri', time: '10:00–15:00', status: 'Confirmed', c: 5 },
  { vol: 'Nomsa Mokoena', prog: 'Hot meals', day: 'Sat', time: '07:00–13:00', status: 'Confirmed', c: 0 },
  { vol: 'Thabo Nkosi', prog: 'Elderly meals', day: 'Sat', time: '09:00–14:00', status: 'Confirmed', c: 1 },
  { vol: 'Ayanda Buthelezi', prog: 'Food packing', day: 'Sun', time: '08:00–11:00', status: 'Unfilled', c: 1 },
];

const unfilled = [
  { shift: 'Hot meals — Thu 07:00', loc: 'Soweto North site' },
  { shift: 'Food packing — Sun 08:00', loc: 'Warehouse, Diepsloot' },
  { shift: 'Delivery run — Fri 14:00', loc: 'Alexandra zone 2' },
  { shift: 'Registration — Sat 09:00', loc: 'Orange Farm' },
  { shift: 'Elderly meals — Wed 11:00', loc: 'Tembisa' },
];

const days = [{ d: 'Mon', h: 42 }, { d: 'Tue', h: 38 }, { d: 'Wed', h: 51 }, { d: 'Thu', h: 29 }, { d: 'Fri', h: 44 }, { d: 'Sat', h: 62 }, { d: 'Sun', h: 18 }];

export default function VolunteersPage() {
  const [tab, setTab] = useState<'roster' | 'schedule'>('roster');
  const [sel, setSel] = useState(0);
  const [search, setSearch] = useState('');
  const [roleF, setRoleF] = useState('');
  const [statusF, setStatusF] = useState('');

  const sPill = (s: string) => {
    if (s === 'Active') return <span className="pill pill-green">Active</span>;
    if (s === 'New') return <span className="pill pill-blue">New</span>;
    return <span className="pill pill-gray">On leave</span>;
  };

  const filtered = VOLUNTEERS.filter(v =>
    (!search || v.name.toLowerCase().includes(search.toLowerCase()) || v.role.toLowerCase().includes(search.toLowerCase())) &&
    (!roleF || v.role === roleF) && (!statusF || v.status === statusF)
  );
  const vol = VOLUNTEERS[sel];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Volunteer management</div>
          <div className="page-sub">Roster, shifts & hours tracking</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🤝 Total volunteers', value: '64', delta: '+7 this month', up: true },
          { label: '🕐 Hours logged (May)', value: '1,284', delta: '+18% vs April', up: true },
          { label: '📅 Shifts this week', value: '38', delta: 'Across 6 programs', up: true },
          { label: '⚠️ Unfilled shifts', value: '5', delta: 'Need cover urgently', up: false },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.up ? 'delta-up' : 'delta-warn'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="subtabs">
        {(['roster', 'schedule'] as const).map(t => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'roster' ? '📋 Roster' : '📅 Weekly schedule'}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Volunteer roster</span>
            <div className="flex-gap">
              <button className="btn btn-sm">⬇ Export</button>
              <button className="btn btn-primary btn-sm">+ Add volunteer</button>
            </div>
          </div>
          <div className="toolbar">
            <input placeholder="Search name or role..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={roleF} onChange={e => setRoleF(e.target.value)}>
              <option value="">All roles</option>
              {['Meal coordinator','Delivery driver','Food packer','School liaison','Registration','Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {['Active','New','On leave'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '30%' }}>Name</th>
                  <th style={{ width: '22%' }}>Role</th>
                  <th style={{ width: '14%' }}>Area</th>
                  <th style={{ width: '14%' }}>Hrs (May)</th>
                  <th style={{ width: '10%' }}>Shifts</th>
                  <th style={{ width: '12%' }}>Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map(v => {
                    const idx = VOLUNTEERS.indexOf(v);
                    return (
                      <tr key={v.name} className={idx === sel ? 'selected' : ''} onClick={() => setSel(idx)}>
                        <td><div className="name-cell"><div className="av" style={{ background: COLOURS[v.c].bg, color: COLOURS[v.c].tx }}>{ini(v.name)}</div>{v.name}</div></td>
                        <td style={{ fontSize: 12 }}>{v.role}</td>
                        <td style={{ fontSize: 12 }}>{v.area}</td>
                        <td style={{ fontWeight: 500, color: '#D85A30' }}>{v.hrs}h</td>
                        <td style={{ fontSize: 12 }}>{v.shifts}</td>
                        <td>{sPill(v.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {vol && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: COLOURS[vol.c].bg, color: COLOURS[vol.c].tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13 }}>{ini(vol.name)}</div>
                    <div><div style={{ fontWeight: 500, fontSize: 14 }}>{vol.name}</div><div style={{ fontSize: 11, color: '#888' }}>{vol.role} · {vol.area}</div></div>
                  </div>
                  {[['Role', vol.role], ['Hours (May)', `${vol.hrs}h logged`], ['Shifts (May)', `${vol.shifts} shifts`], ['Area', vol.area], ['Contact', vol.phone], ['Joined', vol.since]].map(([l, v2]) => (
                    <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={l === 'Hours (May)' ? { color: '#D85A30' } : {}}>{v2}</span></div>
                  ))}
                  <div style={{ fontSize: 11, color: '#888', margin: '10px 0 4px', fontWeight: 500 }}>Notes</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{vol.notes}</div>
                  <div className="flex-gap">
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✏ Edit</button>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>🕐 Log hours</button>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 10 }}>Recent shifts</div>
                  {[['22 May','Hot meals — morning','#D85A30','green'],['20 May','Food packing','#1D9E75','green'],['17 May','Hot meals — morning','#D85A30','green'],['14 May','Registration intake','#BA7517','amber']].map(([d,t,c,s],i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 3 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 12 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                      <span style={{ minWidth: 60, fontSize: 11, color: '#aaa' }}>{d}</span>
                      <span style={{ flex: 1 }}>{t}</span>
                      <span className={`pill ${s === 'green' ? 'pill-green' : 'pill-amber'}`}>{s === 'green' ? 'Done' : 'Partial'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Weekly schedule — 19–25 May 2026</span>
            <button className="btn btn-primary btn-sm">+ Add shift</button>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Volunteer hours by day</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Total scheduled hours per day this week</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
              {days.map(({ d, h }) => (
                <div key={d} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{d}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{h}h</div>
                  <div className="prog-bg" style={{ marginTop: 6 }}>
                    <div className="prog-fill" style={{ width: `${Math.round(h / 62 * 100)}%`, background: '#D85A30' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: '28%' }}>Volunteer</th>
                  <th style={{ width: '22%' }}>Program</th>
                  <th style={{ width: '12%' }}>Day</th>
                  <th style={{ width: '20%' }}>Time</th>
                  <th style={{ width: '18%' }}>Status</th>
                </tr></thead>
                <tbody>
                  {shifts.map((s, i) => (
                    <tr key={i}>
                      <td><div className="name-cell"><div className="av" style={{ background: COLOURS[s.c].bg, color: COLOURS[s.c].tx }}>{ini(s.vol)}</div>{s.vol.split(' ')[0]}</div></td>
                      <td style={{ fontSize: 12 }}>{s.prog}</td>
                      <td style={{ fontSize: 12 }}>{s.day}</td>
                      <td style={{ fontSize: 11, color: '#888' }}>{s.time}</td>
                      <td><span className={`pill ${s.status === 'Confirmed' ? 'pill-green' : 'pill-red'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>⚠️ Unfilled shifts</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Needs urgent cover</div>
              {unfilled.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#FFFBF5', border: '0.5px solid rgba(0,0,0,0.07)', marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{u.shift}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{u.loc}</div>
                  </div>
                  <button className="btn btn-sm" style={{ padding: '3px 8px', fontSize: 11 }}>Cover</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
