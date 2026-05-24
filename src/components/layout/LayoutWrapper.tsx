'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const isLogin = path === '/login';

  useEffect(() => {
    if (isLogin) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login');
      else setChecking(false);
    });
  }, [path, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14, color: '#888' }}>Loading NpoDesk...</div>
      </div>
    </div>
  );

  return (
    <>
      <Sidebar />
      <main className="main">{children}</main>
    </>
  );
}
