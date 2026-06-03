'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'mfa'>('login');
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    // Check if MFA is required
    if (data.session?.user) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factors?.totp?.filter((f: any) => f.status === 'verified') || [];

      if (verifiedFactors.length > 0) {
        // MFA required — show code input
        setFactorId(verifiedFactors[0].id);
        setStep('mfa');
        setLoading(false);
        return;
      }
    }

    // No MFA — go straight to dashboard
    router.push('/dashboard');
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) { setError('Please enter the 6-digit code from your authenticator app'); return; }
    setVerifying(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) { setError(`Challenge failed: ${challengeError.message}`); setVerifying(false); return; }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError('Wrong code. Please check your authenticator app and try again.');
        setMfaCode('');
        setVerifying(false);
        return;
      }

      // MFA verified — go to dashboard
      router.push('/dashboard');
    } catch {
      setError('Verification failed. Please try again.');
      setVerifying(false);
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

          {/* Error message */}
          {error && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #f0b0b0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#791F1F' }}>
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1 — Email & Password */}
          {step === 'login' && (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>Sign in to your account</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>Enter your email and password to continue</div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 5 }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@organisation.co.za"
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
                  {loading ? '⏳ Signing in...' : 'Sign in to NpoDesk →'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 — MFA Code */}
          {step === 'mfa' && (
            <>
              {/* MFA header */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>Two-factor authentication</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                  Open your authenticator app and enter the 6-digit code for NpoDesk
                </div>
              </div>

              <form onSubmit={handleMFAVerify}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>6-digit code</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000 000"
                    maxLength={6}
                    autoFocus
                    style={{ width: '100%', fontSize: 28, fontWeight: 600, padding: '14px', borderRadius: 10, border: `2px solid ${mfaCode.length === 6 ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`, background: '#fff', color: '#1a1a1a', outline: 'none', textAlign: 'center', letterSpacing: 12, transition: 'border-color 0.2s' }}
                    required
                  />
                  <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 }}>
                    {mfaCode.length}/6 digits entered
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || mfaCode.length !== 6}
                  style={{ width: '100%', padding: '11px', borderRadius: 8, background: mfaCode.length === 6 ? '#1D9E75' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
                >
                  {verifying ? '⏳ Verifying...' : '✅ Verify & sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('login'); setMfaCode(''); setError(''); }}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'transparent', color: '#888', fontSize: 13, border: '0.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', marginTop: 10 }}
                >
                  ← Back to login
                </button>
              </form>

              <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 12px', marginTop: 14, fontSize: 11, color: '#0C447C', lineHeight: 1.6 }}>
                💡 Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone to find your code. Codes refresh every 30 seconds.
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>Forgot your password? Contact your NpoDesk admin</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 12, color: '#bbb' }}>Secure login · Powered by <strong style={{ color: '#D85A30' }}>NpoDesk</strong></div>
          <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>npodesk.co.za · 🛡️ POPIA Compliant</div>
        </div>
      </div>
    </div>
  );
}
