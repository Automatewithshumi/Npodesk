'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '📊', section: null },
  { href: '/beneficiaries', label: 'Beneficiaries', icon: '👥', section: 'PEOPLE' },
  { href: '/caregivers', label: 'Caregivers', icon: '🩺', section: null },
  { href: '/volunteers', label: 'Volunteers', icon: '🤝', section: null },
  { href: '/donors', label: 'Donors', icon: '💰', section: null },
  { href: '/meal-programs', label: 'Meal programs', icon: '🍲', section: 'PROGRAMS' },
  { href: '/documents', label: 'Documents', icon: '📁', section: 'RECORDS' },
  { href: '/reports', label: 'Reports', icon: '📋', section: null },
  { href: '/audit-log', label: 'Audit log', icon: '🔍', section: null },
  { href: '/funding-agent', label: 'Funding Agent 🤖', icon: '💰', section: 'TOOLS' },
  { href: '/settings', label: 'Settings & POPIA', icon: '🛡️', section: 'SYSTEM' },
];

type OrgInfo = {
  name: string;
  city: string;
  primary_colour: string;
};

type UserInfo = {
  full_name: string;
  role: string;
};

const ini = (name: string) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }

      // Get user profile + org in one query
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, role, org_id')
        .eq('id', data.session.user.id)
        .single();

      if (userData?.org_id) {
        setUser({
          full_name: userData.full_name || data.session.user.email?.split('@')[0] || 'Admin',
          role: userData.role || 'admin',
        });

        const { data: orgData } = await supabase
          .from('organisations')
          .select('name, city, primary_colour')
          .eq('id', userData.org_id)
          .single();

        if (orgData) setOrg(orgData);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const orgColour = org?.primary_colour || '#D85A30';
  const orgName = org?.name || 'Loading...';
  const orgCity = org?.city || '';
  const userName = user?.full_name || 'Admin';
  const userRole = user?.role || 'admin';

  let lastSection = '';

  return (
    <aside className="sidebar">
      {/* NpoDesk Brand */}
      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📋</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>NpoDesk</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>npodesk.co.za</div>
          </div>
        </div>

        {/* Dynamic org badge */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: orgColour, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {loading ? '⏳' : ini(orgName)}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>
              {loading ? 'Loading...' : orgName}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
              {orgCity} · {userRole}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <div key={item.href}>
              {showSection && (
                <div className="nav-section">{item.section}</div>
              )}
              <Link
                href={item.href}
                className={`nav-item ${path.startsWith(item.href) ? 'active' : ''}`}
                style={path.startsWith(item.href) ? { borderRightColor: orgColour } : {}}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Bottom user info */}
      <div className="sidebar-bottom">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Logged in as
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: orgColour + '30',
              border: `1.5px solid ${orgColour}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0
            }}>
              {loading ? '?' : ini(userName)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                {loading ? 'Loading...' : userName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                {userRole} · {loading ? '...' : orgName.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              title="Sign out"
            >
              Exit
            </button>
          </div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Powered by NpoDesk</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
