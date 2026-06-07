'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canAccessRoute, UserRole, ROLE_INFO } from '@/lib/rbac';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      if (!data.session) {
        router.replace('/login');
        return;
      }

      // Show the page immediately - don't wait for role
      setState('allowed');

      // Load role in background
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (!mounted) return;
        const role = (userData?.role as UserRole) || 'admin';
        setUserRole(role);

        if (!canAccessRoute(role, pathname)) {
          setState('denied');
          setTimeout(() => router.push('/dashboard'), 2500);
        }
      } catch {
        // Role check failed — keep showing page
      }
    }).catch(() => {
      if (mounted) router.replace('/login');
    });

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>📋</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Loading NpoDesk...</div>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    const info = ROLE_INFO[userRole];
    return (
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Access restricted</div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
                Your role <span style={{ background: info.bg, color: info.colour, padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>{info.label}</span> does not have permission to view this page.
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>Redirecting to dashboard in 3 seconds...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
