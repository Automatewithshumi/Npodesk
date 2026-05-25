'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [orgId, setOrgId] = useState('');
  const [stats, setStats] = useState({
    beneficiaries: 0, active: 0, volunteers: 0, donors: 0,
    totalDonations: 0, totalMeals: 0, sites: 0, caregivers: 0,
    shifts: 0, totalHours: 0,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async (oid: string) => {
    const [bRes, vRes, dRes, donRes, sRes, shRes, cRes, mlRes] = await Promise.all([
      supabase.from('beneficiaries').select('id, status').eq('org_id', oid),
      supabase.from('volunteers').select('id').eq('org_id', oid),
      supabase.from('donors').select('id').eq('org_id', oid),
      supabase.from('donations').select('amount').eq('org_id', oid),
      supabase.from('meal_sites').select('id').eq('org_id', oid),
      supabase.from('shifts').select('hours').eq('org_id', oid),
      supabase.from('caregivers').select('id').eq('org_id', oid),
      supabase.from('meal_logs').select('meals_served').eq('org_id', oid),
    ]);
    setStats({
      beneficiaries: bRes.data?.length || 0,
      active: bRes.data?.filter(b => b.status === 'Active').length || 0,
      volunteers: vRes.data?.length || 0,
      donors: dRes.data?.length || 0,
      totalDonations: donRes.data?.reduce((s, d) => s + Number(d.amount), 0) || 0,
      totalMeals: mlRes.data?.reduce((s, l) => s + l.meals_served, 0) || 0,
      sites: sRes.data?.length || 0,
      shifts: shRes.data?.length || 0,
      totalHours: shRes.data?.reduce((s, sh) => s + Number(sh.hours), 0) || 0,
      caregivers: cRes.data?.length || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) { setOrgId(userData.org_id); loadStats(userData.org_id); }
      else setLoading(false);
    });
  }, [loadStats]);

  // Export full impact report as CSV
  const exportImpactReport = async () => {
    showToast('Generating impact report...');
    const [bRes, vRes, dRes, donRes, mlRes] = await Promise.all([
      supabase.from('beneficiaries').select('*').eq('org_id', orgId),
      supabase.from('volunteers').select('*').eq('org_id', orgId),
      supabase.from('donors').select('*').eq('org_id', orgId),
      supabase.from('donations').select('*').eq('org_id', orgId),
      supabase.from('meal_logs').select('*').eq('org_id', orgId),
    ]);

    const date = new Date().toLocaleDateString('en-ZA');
    let csv = `PASSIONATE FEEDING SCHEME - IMPACT REPORT\n`;
    csv += `Generated: ${date}\nManaged by NpoDesk (npodesk.co.za)\n\n`;

    csv += `SUMMARY\n`;
    csv += `Metric,Value\n`;
    csv += `Total Beneficiaries,${stats.beneficiaries}\n`;
    csv += `Active Beneficiaries,${stats.active}\n`;
    csv += `Total Volunteers,${stats.volunteers}\n`;
    csv += `Volunteer Hours,${stats.totalHours}\n`;
    csv += `Total Donors,${stats.donors}\n`;
    csv += `Total Raised,R${stats.totalDonations.toLocaleString()}\n`;
    csv += `Meals Served,${stats.totalMeals.toLocaleString()}\n`;
    csv += `Active Sites,${stats.sites}\n\n`;

    csv += `BENEFICIARIES\n`;
    csv += `Full Name,Type,Area,Status,Household Size,Registered\n`;
    bRes.data?.forEach(b => { csv += `"${b.full_name}","${b.type}","${b.area}","${b.status}",${b.household_size},"${new Date(b.registered_at).toLocaleDateString('en-ZA')}"\n`; });

    csv += `\nVOLUNTEERS\n`;
    csv += `Full Name,Role,Area,Status,Joined\n`;
    vRes.data?.forEach(v => { csv += `"${v.full_name}","${v.role}","${v.area}","${v.status}","${new Date(v.joined_at).toLocaleDateString('en-ZA')}"\n`; });

    csv += `\nDONORS\n`;
    csv += `Name,Type,Email,Phone\n`;
    dRes.data?.forEach(d => { csv += `"${d.name}","${d.type}","${d.email || ''}","${d.phone || ''}"\n`; });

    csv += `\nDONATIONS\n`;
    csv += `Amount,Method,Program,Date,Notes\n`;
    donRes.data?.forEach(d => { csv += `R${d.amount},"${d.method}","${d.program}","${new Date(d.received_at).toLocaleDateString('en-ZA')}","${d.notes || ''}"\n`; });

    csv += `\nMEAL LOGS\n`;
    csv += `Date,Meals Served,Target,Logged By\n`;
    mlRes.data?.forEach(l => { csv += `"${l.log_date}",${l.meals_served},${l.target},"${l.logged_by || ''}"\n`; });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `impact_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Impact report downloaded!');
  };

  const exportBeneficiaries = async () => {
    const { data } = await supabase.from('beneficiaries').select('*').eq('org_id', orgId);
    if (!data || data.length === 0) { showToast('No beneficiaries to export', 'error'); return; }
    const headers = ['Full Name', 'ID Number', 'Type', 'Area', 'Phone', 'Household Size', 'Status', 'Program', 'Notes', 'Registered'];
    const rows = data.map(b => [`"${b.full_name}"`, `"${b.id_number || ''}"`, `"${b.type}"`, `"${b.area}"`, `"${b.phone || ''}"`, b.household_size, `"${b.status}"`, `"${b.program || ''}"`, `"${(b.notes || '').replace(/"/g, "'")}"`, `"${new Date(b.registered_at).toLocaleDateString('en-ZA')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `beneficiaries_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${data.length} beneficiaries`);
  };

  const exportVolunteers = async () => {
    const { data } = await supabase.from('volunteers').select('*').eq('org_id', orgId);
    if (!data || data.length === 0) { showToast('No volunteers to export', 'error'); return; }
    const headers = ['Full Name', 'Role', 'Area', 'Phone', 'Status', 'Joined'];
    const rows = data.map(v => [`"${v.full_name}"`, `"${v.role}"`, `"${v.area}"`, `"${v.phone || ''}"`, `"${v.status}"`, `"${new Date(v.joined_at).toLocaleDateString('en-ZA')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `volunteers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${data.length} volunteers`);
  };

  const exportDonors = async () => {
    const [dRes, donRes] = await Promise.all([
      supabase.from('donors').select('*').eq('org_id', orgId),
      supabase.from('donations').select('*').eq('org_id', orgId),
    ]);
    if (!dRes.data || dRes.data.length === 0) { showToast('No donors to export', 'error'); return; }
    const headers = ['Donor Name', 'Type', 'Email', 'Phone', 'Total Donated', 'Donations Count'];
    const rows = dRes.data.map(d => {
      const total = donRes.data?.filter(don => don.donor_id === d.id).reduce((s, don) => s + Number(don.amount), 0) || 0;
      const count = donRes.data?.filter(don => don.donor_id === d.id).length || 0;
      return [`"${d.name}"`, `"${d.type}"`, `"${d.email || ''}"`, `"${d.phone || ''}"`, `R${total}`, count];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `donors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${dRes.data.length} donors`);
  };

  const exportMealLogs = async () => {
    const [lRes, sRes] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('org_id', orgId),
      supabase.from('meal_sites').select('*').eq('org_id', orgId),
    ]);
    if (!lRes.data || lRes.data.length === 0) { showToast('No meal logs to export', 'error'); return; }
    const headers = ['Site', 'Program', 'Date', 'Meals Served', 'Target', '% Achieved', 'Logged By'];
    const rows = lRes.data.map(l => {
      const site = sRes.data?.find(s => s.id === l.site_id);
      const pct = l.target > 0 ? Math.round(l.meals_served / l.target * 100) : 0;
      return [`"${site?.name || '—'}"`, `"${site?.program || '—'}"`, `"${l.log_date}"`, l.meals_served, l.target, `${pct}%`, `"${l.logged_by || ''}"`];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `meal_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`Exported ${lRes.data.length} meal logs`);
  };

  const reports = [
    { icon: '📊', name: 'Full impact report', desc: 'Complete summary of all data — beneficiaries, volunteers, donors, meals and donations. Perfect for funders and stakeholders.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#FAECE7', action: exportImpactReport },
    { icon: '👥', name: 'Beneficiary register', desc: 'Full list of all registered beneficiaries with type, area, household size, status and registration date.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#EAF3DE', action: exportBeneficiaries },
    { icon: '🤝', name: 'Volunteer hours log', desc: 'All volunteers with their roles, areas, status and joining date. For HR records and recognition.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#EEEDFE', action: exportVolunteers },
    { icon: '💰', name: 'Donor statement', desc: 'Full donor list with total amounts given and number of donations. Useful for thank-you letters and CSI reports.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#E6F1FB', action: exportDonors },
    { icon: '🍲', name: 'Meal delivery log', desc: 'Daily meal counts across all sites with targets, achievement percentages and who logged each count.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#E1F5EE', action: exportMealLogs },
    { icon: '📈', name: 'Annual impact report', desc: 'Comprehensive report combining all data sections. Ideal for board meetings and annual funder presentations.', period: 'All time', status: 'Ready', sc: 'pill-green', bg: '#FAEEDA', action: exportImpactReport },
  ];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div><div className="page-title">Reports & analytics</div><div className="page-sub">Real data · Export anytime</div></div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-primary btn-sm" onClick={exportImpactReport}>⬇ Download full report</button>
        </div>
      </div>

      {/* Live stats from database */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading your real data...</div>
      ) : (
        <>
          <div className="metrics-grid">
            {[
              { label: '🍲 Meals served', value: stats.totalMeals.toLocaleString(), delta: 'All time · all sites' },
              { label: '👥 Beneficiaries', value: stats.beneficiaries.toString(), delta: `${stats.active} active` },
              { label: '💰 Funds raised', value: `R${stats.totalDonations.toLocaleString()}`, delta: `From ${stats.donors} donors` },
              { label: '🕐 Volunteer hours', value: stats.totalHours.toString(), delta: `${stats.volunteers} volunteers` },
            ].map((m, i) => (
              <div key={i} className="metric-card">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
                <div className="metric-delta delta-up">{m.delta}</div>
              </div>
            ))}
          </div>

          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Available reports</span>
            <span style={{ fontSize: 12, color: '#888' }}>All reports pull live data from your database</span>
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
                <button className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} onClick={r.action}>
                  ⬇ Download CSV
                </button>
              </div>
            ))}
          </div>

          {/* Impact snapshot */}
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="section-title">Impact snapshot</span>
          </div>
          <div className="two-col">
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>At a glance — real data</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  ['👥', stats.beneficiaries, 'Beneficiaries'],
                  ['✅', stats.active, 'Active'],
                  ['🩺', stats.caregivers, 'Caregivers'],
                  ['🤝', stats.volunteers, 'Volunteers'],
                  ['🕐', stats.totalHours, 'Vol. hours'],
                  ['📅', stats.shifts, 'Shifts'],
                  ['💰', stats.donors, 'Donors'],
                  ['🍲', stats.totalMeals, 'Meals served'],
                  ['🏢', stats.sites, 'Sites'],
                ].map(([icon, val, lbl], i) => (
                  <div key={i} style={{ background: '#FAFAF8', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>How to use reports</div>
              {[
                ['📊', 'Full impact report', 'Send to NDA, DSD or corporate CSI funders as proof of impact'],
                ['👥', 'Beneficiary register', 'Use for SASSA audits, social worker referrals, compliance'],
                ['🤝', 'Volunteer log', 'Use for volunteer recognition, HR records, insurance'],
                ['💰', 'Donor statement', 'Send to donors as Section 18A tax receipts'],
                ['🍲', 'Meal log', 'Use for daily operations tracking and funder reporting'],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={exportImpactReport}>
                ⬇ Download full impact report
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
