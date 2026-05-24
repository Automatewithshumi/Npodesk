'use client';

const reports = [
  { icon: '📊', name: 'Monthly impact report', desc: 'Full summary of meals served, beneficiaries reached, volunteer hours and donations for May 2026. Ready for funders and stakeholders.', period: 'May 2026', status: 'Ready', sc: 'pill-green', bg: '#FAECE7', color: '#D85A30' },
  { icon: '🏛', name: 'NDA funder report', desc: 'Narrative and financial report required by the National Development Agency. Includes program outputs and expenditure breakdown.', period: 'Due 30 May', status: 'Due soon', sc: 'pill-amber', bg: '#E6F1FB', color: '#185FA5' },
  { icon: '👥', name: 'Beneficiary register', desc: 'Full list of all registered beneficiaries with profile status, caregiver, area and meal history. For audit and compliance.', period: 'May 2026', status: 'Ready', sc: 'pill-green', bg: '#EAF3DE', color: '#1D9E75' },
  { icon: '🤝', name: 'Volunteer hours log', desc: 'Detailed breakdown of hours contributed by each volunteer per program and site. For HR records and recognition.', period: 'May 2026', status: 'Ready', sc: 'pill-green', bg: '#EEEDFE', color: '#534AB7' },
  { icon: '💰', name: 'Donor statement', desc: 'Individual giving statements for all donors. Can be sent as PDF receipts with Section 18A tax information.', period: 'May 2026', status: 'Ready', sc: 'pill-green', bg: '#E1F5EE', color: '#085041' },
  { icon: '📈', name: 'Annual impact report', desc: 'Comprehensive year-to-date report for 2026. Charts, narratives and financials. Ideal for board meetings and corporate donors.', period: 'Dec 2026', status: 'In progress', sc: 'pill-blue', bg: '#FAEEDA', color: '#BA7517' },
];

const programs = [
  { name: 'Hot meals', done: 7100, target: 8000, color: '#D85A30' },
  { name: 'Food parcels', done: 2240, target: 2500, color: '#1D9E75' },
  { name: 'School feeding', done: 1480, target: 2000, color: '#185FA5' },
  { name: 'Elderly care', done: 620, target: 800, color: '#534AB7' },
  { name: 'Baby nutrition', done: 280, target: 400, color: '#D4537E' },
  { name: 'Weekend outreach', done: 340, target: 500, color: '#BA7517' },
];

const highlights = [
  { icon: '📈', bg: '#EAF3DE', text: 'Meals served up 18% compared to April 2026' },
  { icon: '👤', bg: '#E6F1FB', text: '143 new beneficiaries registered this month' },
  { icon: '🤝', bg: '#FAECE7', text: '7 new volunteers joined — highest month ever' },
  { icon: '💰', bg: '#EEEDFE', text: 'R62,500 raised — 78% of R80,000 monthly target' },
];

export default function ReportsPage() {
  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Reports & analytics</div>
          <div className="page-sub">Impact summaries & funder-ready exports</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-primary btn-sm">✨ AI-generate report</button>
        </div>
      </div>

      <div className="metrics-grid">
        {[
          { label: '🍲 Meals (YTD 2026)', value: '38,420', delta: '+22% vs 2025', up: true },
          { label: '👥 People reached', value: '2,108', delta: 'Across 5 areas', up: true },
          { label: '💰 Funds raised (YTD)', value: 'R284k', delta: '+31% vs 2025', up: true },
          { label: '🕐 Volunteer hours', value: '5,840', delta: '64 active volunteers', up: true },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-delta delta-up">↑ {m.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">Available reports</span>
      </div>

      <div className="two-col-equal" style={{ marginBottom: 20 }}>
        {reports.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{r.period}</div>
              </div>
              <span className={`pill ${r.sc}`}>{r.status}</span>
            </div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{r.desc}</div>
            <div className="flex-gap">
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>⬇ Download</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>✉ Email</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="section-title">May 2026 impact snapshot</span>
      </div>

      <div className="two-col">
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Program performance</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Meals served vs monthly targets</div>
          {programs.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{p.name}</span>
                <span style={{ color: '#888' }}>{p.done.toLocaleString()} / {p.target.toLocaleString()}</span>
              </div>
              <div className="prog-bg">
                <div className="prog-fill" style={{ width: `${Math.round(p.done / p.target * 100)}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Key impact metrics</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>At a glance — May 2026</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[['9,340','Total meals'],['2,108','Beneficiaries'],['64','Volunteers'],['R62.5k','Raised'],['8','Sites active'],['18','Caregivers']].map(([v, l]) => (
              <div key={l} style={{ background: '#FAFAF8', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{v}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 10 }}>Impact highlights</div>
          {highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < highlights.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: h.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{h.icon}</div>
              <span style={{ fontSize: 12 }}>{h.text}</span>
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
            ⬇ Download full impact report PDF
          </button>
        </div>
      </div>
    </>
  );
}
