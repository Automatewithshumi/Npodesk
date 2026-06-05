'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 360 }}>
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

  // ─── PDF EXPORT ───────────────────────────────────────────────
  const exportPDF = async (reportType: string) => {
    showToast(`Generating ${reportType} PDF...`);

    const [bRes, vRes, dRes, donRes, mlRes, sRes, cgRes] = await Promise.all([
      supabase.from('beneficiaries').select('*').eq('org_id', orgId),
      supabase.from('volunteers').select('*').eq('org_id', orgId),
      supabase.from('donors').select('*').eq('org_id', orgId),
      supabase.from('donations').select('*').eq('org_id', orgId),
      supabase.from('meal_logs').select('*').eq('org_id', orgId),
      supabase.from('meal_sites').select('*').eq('org_id', orgId),
      supabase.from('caregivers').select('*').eq('org_id', orgId),
    ]);

    // Dynamically import jsPDF to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const date = new Date().toLocaleDateString('en-ZA');
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header ──
    doc.setFillColor(216, 90, 48);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Passionate Feeding Scheme', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportType} · Generated: ${date}`, 14, 20);
    doc.text('Managed by NpoDesk · npodesk.co.za', pageW - 14, 20, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    let y = 36;

    // ── Summary stats ──
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Impact Summary', 14, y); y += 6;

    const summaryData = [
      ['Total Beneficiaries', stats.beneficiaries.toString(), 'Active Beneficiaries', stats.active.toString()],
      ['Total Volunteers', stats.volunteers.toString(), 'Volunteer Hours', stats.totalHours.toString()],
      ['Total Donors', stats.donors.toString(), `Total Raised`, `R${stats.totalDonations.toLocaleString()}`],
      ['Meals Served', stats.totalMeals.toLocaleString(), 'Active Sites', stats.sites.toString()],
      ['Caregivers', stats.caregivers.toString(), 'Total Shifts', stats.shifts.toString()],
    ];

    autoTable(doc, {
      startY: y,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [250, 236, 231], textColor: [113, 43, 19] },
        1: { fontStyle: 'bold' },
        2: { fontStyle: 'bold', fillColor: [250, 236, 231], textColor: [113, 43, 19] },
        3: { fontStyle: 'bold' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Beneficiaries section ──
    if (reportType === 'Full Impact Report' || reportType === 'Beneficiary Register') {
      if (bRes.data && bRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Beneficiaries (${bRes.data.length})`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Full Name', 'Type', 'Area', 'Household', 'Status', 'Registered']],
          body: bRes.data.map(b => [b.full_name, b.type, b.area, b.household_size, b.status, new Date(b.registered_at).toLocaleDateString('en-ZA')]),
          theme: 'striped',
          headStyles: { fillColor: [216, 90, 48], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Caregivers section ──
    if (reportType === 'Full Impact Report' || reportType === 'Beneficiary Register') {
      if (cgRes.data && cgRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Caregivers (${cgRes.data.length})`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Name', 'Area', 'Phone', 'Status', 'Assigned Beneficiaries']],
          body: cgRes.data.map(c => {
            const assigned = bRes.data?.filter(b => b.caregiver_id === c.id).length || 0;
            return [c.name, c.area, c.phone || '—', c.status, assigned];
          }),
          theme: 'striped',
          headStyles: { fillColor: [83, 74, 183], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Volunteers section ──
    if (reportType === 'Full Impact Report' || reportType === 'Volunteer Hours Log') {
      if (vRes.data && vRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Volunteers (${vRes.data.length})`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Full Name', 'Role', 'Area', 'Phone', 'Status', 'Joined']],
          body: vRes.data.map(v => [v.full_name, v.role, v.area, v.phone || '—', v.status, new Date(v.joined_at).toLocaleDateString('en-ZA')]),
          theme: 'striped',
          headStyles: { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Donors section ──
    if (reportType === 'Full Impact Report' || reportType === 'Donor Statement') {
      if (dRes.data && dRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Donors (${dRes.data.length})`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Donor Name', 'Type', 'Email', 'Total Donated', 'Donations']],
          body: dRes.data.map(d => {
            const total = donRes.data?.filter(don => don.donor_id === d.id).reduce((s, don) => s + Number(don.amount), 0) || 0;
            const count = donRes.data?.filter(don => don.donor_id === d.id).length || 0;
            return [d.name, d.type, d.email || '—', `R${total.toLocaleString()}`, count];
          }),
          theme: 'striped',
          headStyles: { fillColor: [24, 95, 165], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Donations section ──
    if (reportType === 'Full Impact Report' || reportType === 'Donor Statement') {
      if (donRes.data && donRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Donation records (${donRes.data.length})`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Donor', 'Amount', 'Method', 'Program', 'Date']],
          body: donRes.data.map(d => {
            const donor = dRes.data?.find(don => don.id === d.donor_id);
            return [donor?.name || 'Anonymous', `R${Number(d.amount).toLocaleString()}`, d.method, d.program, new Date(d.received_at).toLocaleDateString('en-ZA')];
          }),
          theme: 'striped',
          headStyles: { fillColor: [24, 95, 165], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Meal logs section ──
    if (reportType === 'Full Impact Report' || reportType === 'Meal Delivery Log') {
      if (mlRes.data && mlRes.data.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(216, 90, 48);
        doc.text(`Meal logs (${mlRes.data.length} records)`, 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Site', 'Program', 'Date', 'Served', 'Target', '% Achieved', 'Logged by']],
          body: mlRes.data.map(l => {
            const site = sRes.data?.find(s => s.id === l.site_id);
            const pct = l.target > 0 ? Math.round(l.meals_served / l.target * 100) : 0;
            return [site?.name || '—', site?.program || '—', l.log_date, l.meals_served, l.target, `${pct}%`, l.logged_by || '—'];
          }),
          theme: 'striped',
          headStyles: { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ── Footer on every page ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(`Passionate Feeding Scheme · Managed by NpoDesk (npodesk.co.za) · Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' });
    }

    const fileName = `${reportType.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    showToast(`${reportType} PDF downloaded!`);
  };

  // ─── CSV EXPORTS ──────────────────────────────────────────────
  const exportCSV = async (type: string) => {
    showToast(`Generating ${type} CSV...`);
    let csv = '';
    let filename = '';

    if (type === 'beneficiaries') {
      const { data } = await supabase.from('beneficiaries').select('*').eq('org_id', orgId);
      if (!data?.length) { showToast('No beneficiaries to export', 'error'); return; }
      csv = ['Full Name,ID Number,Type,Area,Phone,Household Size,Status,Program,Notes,Registered'].join('\n') + '\n';
      csv += data.map(b => `"${b.full_name}","${b.id_number || ''}","${b.type}","${b.area}","${b.phone || ''}",${b.household_size},"${b.status}","${b.program || ''}","${(b.notes || '').replace(/"/g, "'")}","${new Date(b.registered_at).toLocaleDateString('en-ZA')}"`).join('\n');
      filename = `beneficiaries_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'volunteers') {
      const { data } = await supabase.from('volunteers').select('*').eq('org_id', orgId);
      if (!data?.length) { showToast('No volunteers to export', 'error'); return; }
      csv = 'Full Name,Role,Area,Phone,Status,Joined\n';
      csv += data.map(v => `"${v.full_name}","${v.role}","${v.area}","${v.phone || ''}","${v.status}","${new Date(v.joined_at).toLocaleDateString('en-ZA')}"`).join('\n');
      filename = `volunteers_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'donors') {
      const [dRes, donRes] = await Promise.all([
        supabase.from('donors').select('*').eq('org_id', orgId),
        supabase.from('donations').select('*').eq('org_id', orgId),
      ]);
      if (!dRes.data?.length) { showToast('No donors to export', 'error'); return; }
      csv = 'Donor Name,Type,Email,Phone,Total Donated,Donations Count\n';
      csv += dRes.data.map(d => {
        const total = donRes.data?.filter(don => don.donor_id === d.id).reduce((s, don) => s + Number(don.amount), 0) || 0;
        return `"${d.name}","${d.type}","${d.email || ''}","${d.phone || ''}",R${total},${donRes.data?.filter(don => don.donor_id === d.id).length || 0}`;
      }).join('\n');
      filename = `donors_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'meals') {
      const [lRes, sRes] = await Promise.all([
        supabase.from('meal_logs').select('*').eq('org_id', orgId),
        supabase.from('meal_sites').select('*').eq('org_id', orgId),
      ]);
      if (!lRes.data?.length) { showToast('No meal logs to export', 'error'); return; }
      csv = 'Site,Program,Date,Meals Served,Target,% Achieved,Logged By\n';
      csv += lRes.data.map(l => {
        const site = sRes.data?.find(s => s.id === l.site_id);
        const pct = l.target > 0 ? Math.round(l.meals_served / l.target * 100) : 0;
        return `"${site?.name || '—'}","${site?.program || '—'}","${l.log_date}",${l.meals_served},${l.target},${pct}%,"${l.logged_by || ''}"`;
      }).join('\n');
      filename = `meal_logs_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`CSV downloaded!`);
  };

  const reports = [
    {
      icon: '📊', name: 'Full impact report',
      desc: 'Everything in one PDF — beneficiaries, caregivers, volunteers, donors, meals. Perfect for NDA, DSD and CSI funders.',
      bg: '#FAECE7', status: 'Ready',
      pdfAction: () => exportPDF('Full Impact Report'),
      csvAction: () => exportCSV('beneficiaries'),
    },
    {
      icon: '👥', name: 'Beneficiary register',
      desc: 'Full list of all registered beneficiaries with caregiver, type, area, household size and status.',
      bg: '#EAF3DE', status: 'Ready',
      pdfAction: () => exportPDF('Beneficiary Register'),
      csvAction: () => exportCSV('beneficiaries'),
    },
    {
      icon: '🤝', name: 'Volunteer hours log',
      desc: 'All volunteers with roles, areas, hours, shifts and joining dates. For HR records and recognition.',
      bg: '#EEEDFE', status: 'Ready',
      pdfAction: () => exportPDF('Volunteer Hours Log'),
      csvAction: () => exportCSV('volunteers'),
    },
    {
      icon: '💰', name: 'Donor statement',
      desc: 'Full donor list with total amounts, donation counts and contact details. Useful for Section 18A receipts.',
      bg: '#E6F1FB', status: 'Ready',
      pdfAction: () => exportPDF('Donor Statement'),
      csvAction: () => exportCSV('donors'),
    },
    {
      icon: '🍲', name: 'Meal delivery log',
      desc: 'Daily meal counts across all sites with targets, achievement % and who logged each count.',
      bg: '#E1F5EE', status: 'Ready',
      pdfAction: () => exportPDF('Meal Delivery Log'),
      csvAction: () => exportCSV('meals'),
    },
    {
      icon: '📈', name: 'Annual impact report',
      desc: 'Comprehensive full-organisation report. Ideal for board meetings, AGMs and annual funder presentations.',
      bg: '#FAEEDA', status: 'Ready',
      pdfAction: () => exportPDF('Full Impact Report'),
      csvAction: () => exportCSV('beneficiaries'),
    },
  ];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div><div className="page-title">Reports & analytics</div><div className="page-sub">Real data · PDF & CSV export</div></div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-sm" onClick={() => exportCSV('beneficiaries')}>⬇ CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => exportPDF('Full Impact Report')}>📄 Download PDF report</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>⏳ Loading your data...</div>
      ) : (
        <>
          <div className="metrics-grid">
            {[
              { label: '🍲 Meals served', value: stats.totalMeals.toLocaleString(), delta: 'All time' },
              { label: '👥 Beneficiaries', value: stats.beneficiaries.toString(), delta: `${stats.active} active` },
              { label: '💰 Funds raised', value: `R${stats.totalDonations.toLocaleString()}`, delta: `${stats.donors} donors` },
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
            <span style={{ fontSize: 12, color: '#888' }}>Each report has PDF and CSV export</span>
          </div>

          <div className="two-col-equal" style={{ marginBottom: 20 }}>
            {reports.map((r, i) => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>All time · real data</div>
                  </div>
                  <span className="pill pill-green">{r.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{r.desc}</div>
                <div className="flex-gap">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={r.pdfAction}>
                    📄 PDF
                  </button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={r.csvAction}>
                    ⬇ CSV
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="two-col">
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Impact snapshot — live data</div>
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
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>How to use your reports</div>
              {[
                ['📊', 'Full impact PDF', 'Send to NDA, DSD, SASSA or corporate CSI as proof of impact'],
                ['👥', 'Beneficiary register', 'Use for social worker referrals, SASSA audits, compliance'],
                ['🤝', 'Volunteer log', 'For volunteer recognition, HR records, insurance purposes'],
                ['💰', 'Donor statement', 'Send as Section 18A tax receipts to individual donors'],
                ['🍲', 'Meal log', 'Daily operations tracking and monthly funder reporting'],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                onClick={() => exportPDF('Full Impact Report')}>
                📄 Download full impact PDF
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
