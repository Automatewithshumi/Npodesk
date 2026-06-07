'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canAccessRoute, UserRole, ROLE_INFO } from '@/lib/rbac';
import Sidebar from './Sidebar';

type State = 'loading' | 'allowed' | 'denied';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>('loading');
  const [userRole, setUserRole] = useState<UserRole>('volunteer');
  const roleRef = useRef<UserRole | null>(null);

  useEffect(() => {
    if (roleRef.current !== null) {
      const allowed = canAccessRoute(roleRef.current, pathname);
      setState(allowed ? 'allowed' : 'denied');
      if (!allowed) setTimeout(() => router.push('/dashboard'), 2500);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) { cancelled = true; router.replace('/login'); }
    }, 5000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(timeout);
      if (cancelled) return;
      if (!data.session) { router.replace('/login'); return; }

      let role: UserRole = 'admin';
      try {
        const { data: userData, error } = await supabase
          .from('users').select('role').eq('id', data.session.user.id).single();
        if (!error && userData?.role) role = userData.role as UserRole;
      } catch { role = 'admin'; }

      if (cancelled) return;
      roleRef.current = role;
      setUserRole(role);
      const allowed = canAccessRoute(role, pathname);
      setState(allowed ? 'allowed' : 'denied');
      if (!allowed) setTimeout(() => router.push('/dashboard'), 2500);
    }).catch(() => { clearTimeout(timeout); if (!cancelled) router.replace('/login'); });

    return () => { cancelled = true; clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (state === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>📋</div>
        <div style={{ fontSize: 13, color: '#888' }}>Loading NpoDesk...</div>
      </div>
    </div>
  );

  if (state === 'denied') {
    const info = ROLE_INFO[userRole];
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Access restricted</div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
                Your role <span style={{ background: info.bg, color: info.colour, padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>{info.label}</span> does not have permission.
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>Redirecting to dashboard...</div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">{children}</main>
    </>
  );
}
