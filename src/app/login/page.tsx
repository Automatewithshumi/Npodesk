'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 0 }}>
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
              <div style={{ fontSize: 11, color: '#a05030' }}>Johannesburg · Rachel's account</div>
            </div>
          </div>

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
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: loading ? '#e88860' : '#D85A30', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? '⏳ Signing in...' : 'Sign in to NpoDesk'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#aaa', cursor: 'pointer' }}>Forgot your password?</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 12, color: '#bbb' }}>Secure login · Powered by <strong style={{ color: '#D85A30' }}>NpoDesk</strong></div>
          <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>npodesk.co.za · Your data, your control</div>
        </div>

        {/* Demo hint */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '10px 14px', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🎯 Demo mode — use any email & password</div>
          <div style={{ fontSize: 11, color: '#D85A30', fontWeight: 500 }}>Click "Sign in" to explore the full system</div>
        </div>
      </div>
    </div>
  );
}
