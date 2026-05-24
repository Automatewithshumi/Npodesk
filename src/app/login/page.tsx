'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}>

        {/* NpoDesk brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>📋</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>NpoDesk</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Community outreach management platform</div>
        </div>

        {/* Login card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.08)', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Client badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAECE7', borderRadius: 10, padding: '10px 14px', marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#D85A30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍲</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#712B13' }}>Passionate Feeding Scheme</div>
              <div style={{ fontSize: 11, color: '#a05030' }}>Johannesburg · Rachel&apos;s account</div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #f0b0b0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#791F1F' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 5 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rachel@passionatefeeding.co.za"
                style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a1a', outline: 'none' }}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 5 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a1a', outline: 'none' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: loading ? '#e88860' : '#D85A30', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Signing in...' : 'Sign in to NpoDesk'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>Forgot your password? Contact your NpoDesk admin</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 12, color: '#bbb' }}>Secure login · Powered by <strong style={{ color: '#D85A30' }}>NpoDesk</strong></div>
          <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>npodesk.co.za · Your data, your control</div>
        </div>
      </div>
    </div>
  );
}
