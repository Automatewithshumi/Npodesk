'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/beneficiaries', label: 'Beneficiaries', icon: '👥' },
  { href: '/volunteers', label: 'Volunteers', icon: '🤝' },
  { href: '/donors', label: 'Donors', icon: '💰' },
  { href: '/meal-programs', label: 'Meal programs', icon: '🍲' },
  { href: '/reports', label: 'Reports', icon: '📋' },
];

export default function Sidebar() {
  const path = usePathname();
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
        {/* Client org */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🍲</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>Passionate Feeding Scheme</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Johannesburg · Rachel</div>
          </div>
        </div>
      </div>

      <div className="nav-section">Main menu</div>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${path.startsWith(item.href) ? 'active' : ''}`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Logged in as</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#633806', flexShrink: 0 }}>RC</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Rachel</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Admin · Passionate FS</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Powered by NpoDesk</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
