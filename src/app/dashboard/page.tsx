'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Stats = {
  meals: number;
  beneficiaries: number;
  volunteers: number;
  donations: number;
  caregivers: number;
  donors: number;
  sites: number;
  shifts: number;
  documents: number;
  pendingDocs: number;
  newBeneficiaries: number;
  activeBeneficiaries: number;
};

type ActivityItem = {
  icon: string;
  bg: string;
  text: string;
  time: string;
};

type MonthlyData = {
  month: string;
  beneficiaries: number;
  meals: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    meals: 0, beneficiaries: 0, volunteers: 0, donations: 0,
    caregivers: 0, donors: 0, sites: 0, shifts: 0,
    documents: 0, pendingDocs: 0, newBeneficiaries: 0, activeBeneficiaries: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState('');
  const [userName, setUserName] = useState('Rachel');

  const loadDashboard = useCallback(async (oid: string) => {
    const [
      bRes, vRes, dRes, donRes, mlRes, sRes, shRes, docRes, cgRes, auditRes
    ] = await Promise.all([
      supabase.from('beneficiaries').select('id, status, registered_at').eq('org_id', oid),
      supabase.from('volunteers').select('id').eq('org_id', oid),
      supabase.from('donors').select('id').eq('org_id', oid),
      supabase.from('donations').select('amount, received_at').eq('org_id', oid),
      supabase.from('meal_logs').select('meals_served, log_date').eq('org_id', oid),
      supabase.from('meal_sites').select('id').eq('org_id', oid),
      supabase.from('shifts').select('id').eq('org_id', oid),
      supabase.from('documents').select('id, verified').eq('org_id', oid),
      supabase.from('caregivers').select('id').eq('org_id', oid),
      supabase.from('audit_logs').select('action, table_name, created_at').eq('org_id', oid).order('created_at', { ascending: false }).limit(5),
    ]);

    // Build stats
    const benData = bRes.data || [];
    const donData = donRes.data || [];
    const mlData = mlRes.data || [];
    const docData = docRes.data || [];

    setStats({
      beneficiaries: benData.length,
      activeBeneficiaries: benData.filter(b => b.status === 'Active').length,
      newBeneficiaries: benData.filter(b => b.status === 'New').length,
      volunteers: vRes.data?.length || 0,
      donors: dRes.data?.length || 0,
      donations: donData.reduce((s, d) => s + Number(d.amount), 0),
      meals: mlData.reduce((s, l) => s + l.meals_served, 0),
      sites: sRes.data?.length || 0,
      shifts: shRes.data?.length || 0,
      documents: docData.length,
      pendingDocs: docData.filter(d => !d.verified).length,
      caregivers: cgRes.data?.length || 0,
    });

    // Build monthly data from real records (last 6 months)
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const monthNum = d.getMonth();

      const monthBens = benData.filter(b => {
        const bd = new Date(b.registered_at);
        return bd.getMonth() === monthNum && bd.getFullYear() === year;
      }).length;

      const monthMeals = mlData.filter(l => {
        const ld = new Date(l.log_date);
        return ld.getMonth() === monthNum && ld.getFullYear() === year;
      }).reduce((s, l) => s + l.meals_served, 0);

      months.push({ month: monthStr, beneficiaries: monthBens, meals: monthMeals });
    }
    setMonthlyData(months);

    // Build activity feed from audit logs
    const auditData = auditRes.data || [];
    const iconMap: Record<string, { icon: string; bg: string }> = {
      beneficiaries: { icon: '👥', bg: '#E6F1FB' },
      caregivers: { icon: '🩺', bg: '#EEEDFE' },
      volunteers: { icon: '🤝', bg: '#EAF3DE' },
      donors: { icon: '💰', bg: '#FAEEDA' },
      donations: { icon: '💵', bg: '#EAF3DE' },
      meal_sites: { icon: '📍', bg: '#FAECE7' },
      meal_logs: { icon: '🍲', bg: '#FAECE7' },
      documents: { icon: '📁', bg: '#E6F1FB' },
      shifts: { icon: '📅', bg: '#EEEDFE' },
    };

    const actionLabel: Record<string, string> = {
      INSERT: 'added',
      UPDATE: 'updated',
      DELETE: 'removed',
    };

    const tableLabel: Record<string, string> = {
      beneficiaries: 'beneficiary',
      caregivers: 'caregiver',
      volunteers: 'volunteer',
      donors: 'donor',
      donations: 'donation',
      meal_sites: 'meal site',
      meal_logs: 'meal log',
      documents: 'document',
      shifts: 'shift',
    };

    const activityItems: ActivityItem[] = auditData.map(a => {
      const info = iconMap[a.table_name] || { icon: '📋', bg: '#F1EFE8' };
      const action = actionLabel[a.action] || a.action.toLowerCase();
      const table = tableLabel[a.table_name] || a.table_name;
      const timeAgo = getTimeAgo(new Date(a.created_at));
      return {
        icon: info.icon,
        bg: info.bg,
        text: `A ${table} was ${action}`,
        time: timeAgo,
      };
    });

    // If no audit activity yet, show empty state message
    if (activityItems.length === 0) {
      activityItems.push({
        icon: '🎉', bg: '#EAF3DE',
        text: 'System is ready — start adding beneficiaries, caregivers and volunteers!',
        time: 'Just now',
      });
    }

    setActivity(activityItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase
        .from('users').select('org_id, full_name').eq('id', data.session.user.id).single();
      if (userData?.org_id) {
        setOrgId(userData.org_id);
        if (userData.full_name) setUserName(userData.full_name);
        loadDashboard(userData.org_id);
      } else {
        setLoading(false);
      }
    });
  }, [loadDashboard]);

  const getTimeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-ZA');
  };

  const pieData = [
    { name: 'Active', value: stats.activeBeneficiaries || 0, color: '#1D9E75' },
    { name: 'New', value: stats.newBeneficiaries || 0, color: '#185FA5' },
    { name: 'Inactive', value: Math.max(0, stats.beneficiaries - stats.activeBeneficiaries - stats.newBeneficiaries), color: '#E0DDD8' },
  ].filter(d => d.value > 0);

  const hasData = stats.beneficiaries > 0 || stats.meals > 0 || stats.volunteers > 0;

  return (
    <>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #D85A30 0%, #a8411f 100%)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            👋 Welcome back, {userName}!
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            Passionate Feeding Scheme · Johannesburg · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
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
          <div className="page-sub">Live data · {new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● Live</span>
          <button className="btn btn-sm" onClick={() => loadDashboard(orgId)} title="Refresh">🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Loading your live data...</div>
        </div>
      ) : (
        <>
          {/* Empty state for new clients */}
          {!hasData && (
            <div style={{ background: '#EAF3DE', border: '0.5px solid #b0d890', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>🚀</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#27500A', marginBottom: 4 }}>Your system is ready — let's get started!</div>
                <div style={{ fontSize: 13, color: '#3B6D11' }}>Start by adding your <strong>caregivers</strong>, then register your first <strong>beneficiaries</strong>. All numbers will update automatically as you add real data.</div>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="metrics-grid">
            {[
              { label: '🍲 Meals served', value: stats.meals.toLocaleString(), delta: 'All time · all sites', up: true },
              { label: '👥 Beneficiaries', value: stats.beneficiaries.toLocaleString(), delta: `${stats.activeBeneficiaries} active · ${stats.newBeneficiaries} new`, up: true },
              { label: '🤝 Volunteers', value: stats.volunteers.toLocaleString(), delta: `${stats.shifts} shifts logged`, up: true },
              { label: '💰 Donations (ZAR)', value: `R${stats.donations.toLocaleString()}`, delta: `From ${stats.donors} donors`, up: true },
            ].map((m, i) => (
              <div key={i} className="metric-card">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
                <div className="metric-delta delta-up">{m.delta}</div>
              </div>
            ))}
          </div>

          {/* Secondary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
            {[
              { label: '🩺 Caregivers', value: stats.caregivers, sub: 'Field team' },
              { label: '📍 Meal sites', value: stats.sites, sub: 'Active sites' },
              { label: '📁 Documents', value: stats.documents, sub: `${stats.pendingDocs} pending review` },
              { label: '🔍 Audit records', value: '-', sub: 'All actions tracked' },
            ].map((m, i) => (
              <div key={i} style={{ background: '#FAFAF8', border: '0.5px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="two-col" style={{ marginBottom: 14 }}>
            {/* Monthly trend */}
            <div className="card">
              <div className="section-title">Monthly trend</div>
              <div className="section-sub">Beneficiaries registered & meals served over last 6 months</div>
              {monthlyData.every(d => d.beneficiaries === 0 && d.meals === 0) ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 32 }}>📊</div>
                  <div style={{ fontSize: 13 }}>Charts will appear as you add real data</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    {[['#D85A30', 'Beneficiaries'], ['#1D9E75', 'Meals']].map(([c, l]) => (
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
                      <Bar dataKey="beneficiaries" fill="#D85A30" radius={[4, 4, 0, 0]} name="Beneficiaries" />
                      <Bar dataKey="meals" fill="#1D9E75" radius={[4, 4, 0, 0]} name="Meals" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Beneficiary breakdown */}
            <div className="card">
              <div className="section-title">Beneficiary status</div>
              <div className="section-sub">Active vs new vs inactive</div>
              {stats.beneficiaries === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 32 }}>👥</div>
                  <div style={{ fontSize: 13 }}>Register beneficiaries to see breakdown</div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                    {pieData.map(d => (
                      <span key={d.name} style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 50, background: d.color, display: 'inline-block' }} />
                        {d.name}: {d.value}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="two-col">
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Quick stats</div>
              {[
                ['👥', 'Total beneficiaries', stats.beneficiaries, ''],
                ['✅', 'Active beneficiaries', stats.activeBeneficiaries, ''],
                ['🆕', 'New (pending)', stats.newBeneficiaries, ''],
                ['🩺', 'Caregivers', stats.caregivers, ''],
                ['🤝', 'Volunteers', stats.volunteers, ''],
                ['📅', 'Shifts logged', stats.shifts, ''],
                ['💰', 'Total raised', `R${stats.donations.toLocaleString()}`, ''],
                ['🍲', 'Meals served', stats.meals.toLocaleString(), ''],
                ['📍', 'Meal sites', stats.sites, ''],
                ['📁', 'Documents', stats.documents, ''],
              ].map(([icon, label, value, _], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 9 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ fontSize: 16, width: 24 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: value === 0 || value === 'R0' ? '#ccc' : '#1a1a1a' }}>{value}</span>
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

          {/* Footer */}
          <div style={{ marginTop: 24, padding: '12px 0', borderTop: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#ccc' }}>
              Passionate Feeding Scheme · Managed on <strong style={{ color: '#D85A30' }}>NpoDesk</strong>
            </span>
            <span style={{ fontSize: 11, color: '#ccc' }}>npodesk.co.za · v1.0</span>
          </div>
        </>
      )}
    </>
  );
}
