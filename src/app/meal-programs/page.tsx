'use client';
import { useState } from 'react';
import { SITES } from '@/lib/data';

const programs = [
  { icon: '🔥', name: 'Hot meals', sub: 'Daily community kitchen', done: 7100, target: 8000, days: 'Mon–Sat · 07:00–12:00', color: '#D85A30', bg: '#FAECE7' },
  { icon: '📦', name: 'Food parcels', sub: 'Weekly take-home hampers', done: 2240, target: 2500, days: 'Every Monday', color: '#1D9E75', bg: '#EAF3DE' },
  { icon: '🏫', name: 'School feeding', sub: 'Learner breakfast program', done: 1480, target: 2000, days: 'Mon–Fri · 06:30', color: '#185FA5', bg: '#E6F1FB' },
  { icon: '♿', name: 'Elderly care', sub: 'Home delivery for elderly', done: 620, target: 800, days: 'Tue & Thu', color: '#534AB7', bg: '#EEEDFE' },
  { icon: '👶', name: 'Baby nutrition', sub: 'Infant & toddler meals', done: 280, target: 400, days: 'Wed · 09:00', color: '#D4537E', bg: '#FBEAF0' },
  { icon: '🌍', name: 'Weekend outreach', sub: 'Informal settlement drive', done: 340, target: 500, days: 'Sat & Sun', color: '#BA7517', bg: '#FAEEDA' },
];

const dailyLog = [
  { site: 'Soweto North Kitchen', prog: 'Hot meals', target: 200, served: 148, missed: 52, loggedBy: 'Nomsa M.', status: 'Logged' },
  { site: 'Diepsloot Feeding', prog: 'Hot meals', target: 120, served: 94, missed: 26, loggedBy: 'Zanele D.', status: 'Logged' },
  { site: 'Alexandra Hub', prog: 'Food parcels', target: 100, served: 82, missed: 18, loggedBy: 'Thabo N.', status: 'Logged' },
  { site: 'Tembisa Care', prog: 'Elderly meals', target: 60, served: 41, missed: 19, loggedBy: 'Lerato P.', status: 'Logged' },
  { site: 'Orange Farm School', prog: 'School meals', target: 150, served: 112, missed: 38, loggedBy: 'Kagiso S.', status: 'Logged' },
  { site: 'Soweto South', prog: 'Weekend outreach', target: 80, served: 68, missed: 12, loggedBy: 'Sipho R.', status: 'Logged' },
  { site: 'Sandton Church', prog: 'Baby nutrition', target: 40, served: 28, missed: 12, loggedBy: 'Ayanda B.', status: 'Logged' },
  { site: 'Diepsloot School 2', prog: 'School meals', target: 100, served: 0, missed: 0, loggedBy: '—', status: 'Pending' },
];

const routeLog = [
  { time: '07:00', event: 'Food collected from warehouse', c: '#27500A' },
  { time: '07:45', event: 'Arrived Soweto North Kitchen', c: '#D85A30' },
  { time: '08:00', event: 'Meal service started', c: '#D85A30' },
  { time: '11:30', event: '148 meals served — closing', c: '#185FA5' },
  { time: '12:00', event: 'Site cleanup complete', c: '#534AB7' },
];

export default function MealProgramsPage() {
  const [tab, setTab] = useState<'sites' | 'log'>('sites');
  const [selProg, setSelProg] = useState(0);
  const [selSite, setSelSite] = useState(0);

  const site = SITES[selSite];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Meal programs</div>
          <div className="page-sub">Sites, daily counts & delivery routes</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🍲 Meals today', value: '412', delta: '+24 vs yesterday', up: true },
          { label: '🏢 Active sites', value: '8', delta: 'Across 5 areas', up: true },
          { label: '🚚 Deliveries today', value: '6', delta: '4 completed · 2 en route', up: true },
          { label: '📦 Food stock', value: '68%', delta: 'Reorder needed soon', up: false },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.up ? 'delta-up' : 'delta-warn'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Programs overview</span>
        <button className="btn btn-primary btn-sm">+ Add program</button>
      </div>

      <div className="three-col" style={{ marginBottom: 20 }}>
        {programs.map((p, i) => (
          <div key={i} onClick={() => setSelProg(i)} style={{ background: '#fff', border: `1.5px solid ${selProg === i ? p.color : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, padding: '1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{p.sub}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>🕐 {p.days}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888' }}>{p.done.toLocaleString()} / {p.target.toLocaleString()}</span>
              <span className="pill pill-green">Active</span>
            </div>
            <div className="prog-bg"><div className="prog-fill" style={{ width: `${Math.round(p.done / p.target * 100)}%`, background: p.color }} /></div>
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
        <div className="two-col">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th style={{ width: '28%' }}>Site name</th>
                <th style={{ width: '16%' }}>Area</th>
                <th style={{ width: '18%' }}>Program</th>
                <th style={{ width: '12%' }}>Today</th>
                <th style={{ width: '12%' }}>Capacity</th>
                <th style={{ width: '14%' }}>Status</th>
              </tr></thead>
              <tbody>
                {SITES.map((s, i) => (
                  <tr key={i} className={i === selSite ? 'selected' : ''} onClick={() => setSelSite(i)}>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{s.name}</td>
                    <td style={{ fontSize: 12 }}>{s.area}</td>
                    <td style={{ fontSize: 11 }}>{s.program}</td>
                    <td style={{ fontWeight: 500, color: '#D85A30' }}>{s.today}</td>
                    <td style={{ fontSize: 11, color: '#888' }}>{s.capacity}</td>
                    <td><span className={`pill ${s.today > 0 ? 'pill-green' : 'pill-amber'}`}>{s.today > 0 ? 'Open' : 'Pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {site && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{site.name}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Site details</div>
              {[['Address', site.address], ['Hours', site.hours], ['Days', site.days], ['Volunteers', `${site.volunteers} assigned`], ["Today's count", `${site.today} meals`], ['Capacity', `${site.capacity} / day`]].map(([l, v]) => (
                <div key={l} className="d-row">
                  <span className="d-label">{l}</span>
                  <span className="d-value" style={l === "Today's count" ? { color: '#D85A30' } : {}}>{v}</span>
                </div>
              ))}
              <div className="flex-gap" style={{ marginTop: 12, marginBottom: 14 }}>
                <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>📋 Log count</button>
                <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✏ Edit</button>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8 }}>Today&apos;s delivery route</div>
              {routeLog.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < routeLog.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                  <span style={{ minWidth: 48, fontSize: 11, color: '#aaa' }}>{r.time}</span>
                  <span>{r.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'log' && (
        <>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Daily meal log — 23 May 2026</span>
            <button className="btn btn-primary btn-sm">📋 Log today</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th style={{ width: '24%' }}>Site</th>
                <th style={{ width: '16%' }}>Program</th>
                <th style={{ width: '10%' }}>Target</th>
                <th style={{ width: '10%' }}>Served</th>
                <th style={{ width: '10%' }}>Missed</th>
                <th style={{ width: '14%' }}>Logged by</th>
                <th style={{ width: '12%' }}>Status</th>
              </tr></thead>
              <tbody>
                {dailyLog.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{d.site}</td>
                    <td style={{ fontSize: 11 }}>{d.prog}</td>
                    <td style={{ fontSize: 12 }}>{d.target}</td>
                    <td style={{ fontWeight: 500, color: '#D85A30' }}>{d.served || '—'}</td>
                    <td style={{ fontSize: 12, color: d.missed > 20 ? '#BA7517' : '#888' }}>{d.missed || '—'}</td>
                    <td style={{ fontSize: 11 }}>{d.loggedBy}</td>
                    <td><span className={`pill ${d.status === 'Logged' ? 'pill-green' : 'pill-amber'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
