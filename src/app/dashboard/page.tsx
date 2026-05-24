'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const monthlyData = [
  { month: 'Jan', outreach: 820, centre: 310 },
  { month: 'Feb', outreach: 870, centre: 330 },
  { month: 'Mar', outreach: 920, centre: 360 },
  { month: 'Apr', outreach: 1050, centre: 390 },
  { month: 'May', outreach: 1284, centre: 420 },
];

const breakdown = [
  { name: 'Food aid', value: 38, color: '#D85A30' },
  { name: 'Skills', value: 27, color: '#1D9E75' },
  { name: 'Health', value: 20, color: '#BA7517' },
  { name: 'Housing', value: 15, color: '#639922' },
];

const programs = [
  { name: 'Hot meals', done: 7100, target: 8000, color: '#D85A30' },
  { name: 'Food parcels', done: 2240, target: 2500, color: '#1D9E75' },
  { name: 'School feeding', done: 1480, target: 2000, color: '#185FA5' },
  { name: 'Elderly care', done: 620, target: 800, color: '#534AB7' },
  { name: 'Donor target', done: 62500, target: 80000, color: '#D85A30', label: 'R62.5k / R80k' },
];

const activity = [
  { icon: '👤', bg: '#E6F1FB', text: '3 new volunteers registered for food aid program', time: '2 hours ago' },
  { icon: '💰', bg: '#EAF3DE', text: 'Donation of R5,000 received from Soweto Community Fund', time: '5 hours ago' },
  { icon: '📋', bg: '#FAEEDA', text: 'Skills training session completed — 24 beneficiaries', time: 'Yesterday' },
  { icon: '⚠️', bg: '#FCEBEB', text: 'Housing support program reaching capacity — review needed', time: 'Yesterday' },
  { icon: '❤️', bg: '#E1F5EE', text: 'Health outreach event scheduled for 28 May in Soweto', time: '2 days ago' },
];

export default function Dashboard() {
  return (
    <>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #D85A30 0%, #a8411f 100%)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>👋 Welcome back, Rachel!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Passionate Feeding Scheme · Johannesburg · May 2026</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Managed by</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>NpoDesk</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>npodesk.co.za</div>
        </div>
      </div>

      <div className="topbar">
        <div>
          <div className="page-title">Dashboard overview</div>
          <div className="page-sub">May 2026 · Johannesburg</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <span style={{ fontSize: 12, color: '#888', background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '4px 10px' }}>May 2026</span>
        </div>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🍲 Meals served', value: '9,340', delta: '+18% this month', up: true },
          { label: '👥 Beneficiaries', value: '2,108', delta: '+9% vs last month', up: true },
          { label: '🤝 Active volunteers', value: '87', delta: '+5 this month', up: true },
          { label: '💰 Donations (ZAR)', value: 'R48,200', delta: '+8% vs last month', up: true },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className={`metric-delta ${m.up ? 'delta-up' : 'delta-warn'}`}>↑ {m.delta}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="section-title">Beneficiaries served — monthly trend</div>
          <div className="section-sub">Jan – May 2026</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            {[['#D85A30', 'Outreach'], ['#1D9E75', 'In-centre']].map(([c, l]) => (
              <span key={l} style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="outreach" stackId="a" fill="#D85A30" radius={[0, 0, 0, 0]} />
              <Bar dataKey="centre" stackId="a" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Services breakdown</div>
          <div className="section-sub">By program type</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                {breakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {breakdown.map(d => (
              <span key={d.name} style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                {d.name} {d.value}%
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Program targets</div>
          {programs.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{p.name}</span>
                <span style={{ color: '#888' }}>{p.label || `${p.done.toLocaleString()} / ${p.target.toLocaleString()}`}</span>
              </div>
              <div className="prog-bg">
                <div className="prog-fill" style={{ width: `${Math.round(p.done / p.target * 100)}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Recent activity</div>
          {activity.map((a, i) => (
            <div key={i} className="log-item">
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{a.icon}</div>
              <div>
                <div className="log-text">{a.text}</div>
                <div className="log-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NpoDesk footer */}
      <div style={{ marginTop: 24, padding: '12px 0', borderTop: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#ccc' }}>Passionate Feeding Scheme · Managed on <strong style={{ color: '#D85A30' }}>NpoDesk</strong></span>
        <span style={{ fontSize: 11, color: '#ccc' }}>npodesk.co.za · v1.0</span>
      </div>
    </>
  );
}
