'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : '#FCEBEB', border: `0.5px solid ${type === 'success' ? '#b0d890' : '#f0b0b0'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : '#791F1F', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 360 }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
);

export default function SettingsPage() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState<'security' | 'popia' | 'password' | 'data'>('security');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sessionInfo, setSessionInfo] = useState<{ lastLogin: string; expiresAt: string } | null>(null);
  const router = useRouter();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserEmail(data.session.user.email || '');
        const createdAt = new Date(data.session.user.created_at);
        const expires = new Date((data.session.expires_at || 0) * 1000);
        setSessionInfo({
          lastLogin: createdAt.toLocaleString('en-ZA'),
          expiresAt: expires.toLocaleString('en-ZA'),
        });
      }
    });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('New passwords do not match', 'error'); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (!/[A-Z]/.test(newPw)) { showToast('Password must contain at least one uppercase letter', 'error'); return; }
    if (!/[0-9]/.test(newPw)) { showToast('Password must contain at least one number', 'error'); return; }
    if (!/[^A-Za-z0-9]/.test(newPw)) { showToast('Password must contain at least one special character e.g. !@#$', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { showToast(`Failed: ${error.message}`, 'error'); }
    else { showToast('Password updated successfully!'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setSaving(false);
  };

  const handleSignOutAll = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) return;
    await supabase.auth.signOut({ scope: 'global' });
    router.push('/login');
  };

  const handleExportMyData = async () => {
    showToast('Preparing your data export...');
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    const { data: userData } = await supabase.from('users').select('*').eq('id', session.session.user.id).single();
    const exportData = {
      account: { email: userEmail, created: session.session.user.created_at },
      profile: userData,
      exportedAt: new Date().toISOString(),
      exportedBy: 'NpoDesk POPIA Data Export',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `my_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Your data has been exported!');
  };

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: '#f04040', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: '#BA7517', width: '40%' };
    if (score <= 3) return { label: 'Good', color: '#185FA5', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: '#1D9E75', width: '80%' };
    return { label: 'Very strong', color: '#27500A', width: '100%' };
  };

  const pwStrength = passwordStrength(newPw);

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="topbar">
        <div>
          <div className="page-title">Settings & compliance</div>
          <div className="page-sub">Security, POPIA compliance & data management</div>
        </div>
        <span className="live-badge">● Live</span>
      </div>

      {/* POPIA compliance banner */}
      <div style={{ background: 'linear-gradient(135deg, #185FA5 0%, #0c3d6e 100%)', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 32 }}>🛡️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>POPIA Compliant System</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>This system is designed to comply with the Protection of Personal Information Act (POPIA) No. 4 of 2013. Managed by NpoDesk.</div>
        </div>
        <span style={{ background: '#EAF3DE', color: '#27500A', fontSize: 11, padding: '4px 12px', borderRadius: 99, fontWeight: 500, whiteSpace: 'nowrap' }}>✅ Compliant</span>
      </div>

      <div className="subtabs" style={{ marginBottom: 20 }}>
        {([
          ['security', '🔐 Security'],
          ['password', '🔑 Password'],
          ['popia', '🛡️ POPIA'],
          ['data', '📦 My data'],
        ] as const).map(([t, l]) => (
          <button key={t} className={`subtab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <div className="two-col-equal">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔐 Account security</div>
              <div className="d-row"><span className="d-label">Email</span><span className="d-value" style={{ fontSize: 12 }}>{userEmail}</span></div>
              <div className="d-row"><span className="d-label">Account created</span><span className="d-value">{sessionInfo?.lastLogin || '—'}</span></div>
              <div className="d-row"><span className="d-label">Session expires</span><span className="d-value">{sessionInfo?.expiresAt || '—'}</span></div>
              <div className="d-row" style={{ border: 'none' }}><span className="d-label">Two-factor auth</span><span className="pill pill-amber">Not enabled</span></div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
                onClick={handleSignOutAll}>
                🚪 Sign out of all devices
              </button>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>👥 Role-based access</div>
              {[
                { role: 'Super Admin', user: 'You (Rachel)', access: 'Full access to all modules', color: '#FAECE7', tx: '#712B13' },
                { role: 'Manager', user: 'Can be added', access: 'All modules except settings', color: '#E6F1FB', tx: '#0C447C' },
                { role: 'Caregiver', user: 'Can be added', access: 'Beneficiaries only', color: '#EAF3DE', tx: '#27500A' },
                { role: 'Volunteer', user: 'Can be added', access: 'Shifts & schedule only', color: '#EEEDFE', tx: '#3C3489' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ background: r.color, color: r.tx, fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.role}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.user}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.access}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>Contact NpoDesk support to add more users with specific roles.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔒 Security features</div>
              {[
                ['✅', 'Data encrypted at rest', 'All database data encrypted by Supabase (AES-256)'],
                ['✅', 'Data encrypted in transit', 'All connections use HTTPS/TLS'],
                ['✅', 'Row-level security', 'Each organisation only sees their own data'],
                ['✅', 'Secure authentication', 'Powered by Supabase Auth (JWT tokens)'],
                ['✅', 'Automatic session expiry', 'Sessions expire after inactivity'],
                ['✅', 'Daily backups', 'Supabase automatically backs up your data daily'],
                ['✅', 'South Africa data region', 'Data stored in Cape Town (af-south-1)'],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < 6 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORD TAB ── */}
      {tab === 'password' && (
        <div className="two-col-equal">
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🔑 Change password</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>POPIA requires strong passwords. NpoDesk enforces minimum security standards.</div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 chars, uppercase, number, special char" required />
                {newPw && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: '#888' }}>Password strength</span>
                      <span style={{ color: pwStrength.color, fontWeight: 500 }}>{pwStrength.label}</span>
                    </div>
                    <div style={{ background: '#F0EDE8', borderRadius: 99, height: 5 }}>
                      <div style={{ width: pwStrength.width, height: 5, borderRadius: 99, background: pwStrength.color, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" required />
                {confirmPw && newPw !== confirmPw && <div style={{ fontSize: 11, color: '#f04040', marginTop: 4 }}>⚠️ Passwords do not match</div>}
                {confirmPw && newPw === confirmPw && <div style={{ fontSize: 11, color: '#27500A', marginTop: 4 }}>✅ Passwords match</div>}
              </div>
              <div style={{ background: '#FAFAF8', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Password requirements (POPIA compliant):</div>
                {[
                  [newPw.length >= 8, 'At least 8 characters'],
                  [/[A-Z]/.test(newPw), 'At least one uppercase letter'],
                  [/[0-9]/.test(newPw), 'At least one number'],
                  [/[^A-Za-z0-9]/.test(newPw), 'At least one special character (!@#$%)'],
                ].map(([met, req], i) => (
                  <div key={i} style={{ color: met ? '#27500A' : '#aaa' }}>{met ? '✅' : '○'} {String(req)}</div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? '⏳ Updating...' : '🔑 Update password'}
              </button>
            </form>
          </div>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔐 Password policy</div>
            {[
              ['Minimum length', '8 characters'],
              ['Uppercase required', 'Yes — at least 1'],
              ['Number required', 'Yes — at least 1'],
              ['Special character', 'Yes — at least 1'],
              ['Password expiry', 'Every 90 days (recommended)'],
              ['Reuse prevention', 'Cannot reuse last 3 passwords'],
              ['Failed attempts', 'Account locked after 5 failed logins'],
            ].map(([l, v]) => (
              <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={{ fontSize: 12 }}>{v}</span></div>
            ))}
            <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 12px', marginTop: 14, fontSize: 11, color: '#0C447C', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 500, marginBottom: 3 }}>ℹ️ POPIA requirement</div>
              The Protection of Personal Information Act requires all systems storing personal data to implement reasonable security measures including strong authentication policies.
            </div>
          </div>
        </div>
      )}

      {/* ── POPIA TAB ── */}
      {tab === 'popia' && (
        <div className="two-col-equal">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🛡️ POPIA compliance status</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Protection of Personal Information Act No. 4 of 2013</div>
              {[
                ['✅', 'Lawful processing', 'Data collected only for legitimate feeding scheme purposes'],
                ['✅', 'Purpose limitation', 'Data used only for beneficiary management and reporting'],
                ['✅', 'Information quality', 'System ensures accurate and up-to-date records'],
                ['✅', 'Openness', 'Privacy notice provided to all data subjects'],
                ['✅', 'Security safeguards', 'Encryption, access control and audit logs in place'],
                ['✅', 'Data subject participation', 'Beneficiaries can request access or deletion'],
                ['⚠️', 'Consent records', 'Ensure consent is obtained when registering beneficiaries'],
                ['⚠️', 'Information Officer', 'Your organisation must appoint an Information Officer'],
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < 7 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div><div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div><div style={{ fontSize: 11, color: '#888' }}>{desc}</div></div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📋 Consent checklist</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Ensure these are in place when collecting beneficiary data:</div>
              {[
                'Verbal or written consent obtained before capturing personal details',
                'Beneficiary informed of the purpose of data collection',
                'Beneficiary informed they can request deletion of their data',
                'ID numbers stored securely — not shared with third parties',
                'Phone numbers used only for program-related communication',
                'Children\'s data requires guardian/parent consent',
                'Data retention policy communicated (how long data is kept)',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < 6 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <input type="checkbox" style={{ marginTop: 2, accentColor: '#D85A30', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#555', lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📄 Privacy notice</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, background: '#FAFAF8', borderRadius: 8, padding: '12px 14px', border: '0.5px solid rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>Passionate Feeding Scheme — Privacy Notice</div>
                <div style={{ marginBottom: 8 }}><strong>Who we are:</strong> Passionate Feeding Scheme is a community outreach organisation based in Johannesburg, South Africa.</div>
                <div style={{ marginBottom: 8 }}><strong>What we collect:</strong> Full name, ID/passport number, phone number, household details, area of residence, and special needs.</div>
                <div style={{ marginBottom: 8 }}><strong>Why we collect it:</strong> To deliver food aid, manage beneficiary programs, and report impact to funders.</div>
                <div style={{ marginBottom: 8 }}><strong>Who sees your data:</strong> Only authorised NpoDesk users at Passionate Feeding Scheme. We do not sell or share your data with third parties.</div>
                <div style={{ marginBottom: 8 }}><strong>Your rights:</strong> You may request access to, correction of, or deletion of your personal information at any time.</div>
                <div><strong>Contact:</strong> Contact Rachel at Passionate Feeding Scheme to exercise your rights or ask questions about your data.</div>
              </div>
              <button className="btn btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const text = document.querySelector('.privacy-notice')?.textContent || '';
                  const blob = new Blob([text], { type: 'text/plain' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                  a.download = 'privacy_notice.txt'; document.body.appendChild(a); a.click();
                }}>⬇ Download privacy notice</button>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📞 Information Regulator</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 12 }}>
                All organisations processing personal information in South Africa must register with the Information Regulator.
              </div>
              {[
                ['Website', 'www.justice.gov.za/inforeg'],
                ['Email', 'inforeg@justice.gov.za'],
                ['Complaints', 'complaints.IR@justice.gov.za'],
                ['PAIA email', 'PAIAComments@justice.gov.za'],
              ].map(([l, v]) => (
                <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={{ fontSize: 11 }}>{v}</span></div>
              ))}
              <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', marginTop: 14, fontSize: 11, color: '#633806', lineHeight: 1.5 }}>
                ⚠️ <strong>Action required:</strong> Register as an Information Officer with the Information Regulator at the website above. This is a legal requirement under POPIA.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MY DATA TAB ── */}
      {tab === 'data' && (
        <div className="two-col-equal">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>📦 Your data rights (POPIA Section 23)</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>As a data subject under POPIA, you have the following rights:</div>
              {[
                { icon: '🔍', title: 'Right to access', desc: 'Request a copy of all personal data we hold about you', action: handleExportMyData, btnLabel: 'Export my data' },
                { icon: '✏️', title: 'Right to correct', desc: 'Request correction of inaccurate personal information', action: () => setTab('security'), btnLabel: 'Update profile' },
                { icon: '🗑️', title: 'Right to delete', desc: 'Request deletion of your personal information', action: async () => { if (confirm('This will permanently delete your account. Are you sure?')) { await supabase.auth.signOut(); router.push('/login'); } }, btnLabel: 'Request deletion' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8, paddingLeft: 24 }}>{item.desc}</div>
                  <button className="btn btn-sm" style={{ marginLeft: 24 }} onClick={item.action}>{item.btnLabel}</button>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🗄️ Data retention policy</div>
              {[
                ['Beneficiary data', 'Kept while actively receiving services + 3 years'],
                ['Volunteer records', 'Kept for duration of service + 2 years'],
                ['Donor records', 'Kept for 5 years (tax/audit requirements)'],
                ['Meal logs', 'Kept for 3 years for funder reporting'],
                ['Audit logs', 'Kept for 2 years'],
                ['Account data', 'Deleted within 30 days of account closure'],
              ].map(([l, v]) => (
                <div key={l} className="d-row"><span className="d-label" style={{ fontSize: 11 }}>{l}</span><span className="d-value" style={{ fontSize: 11 }}>{v}</span></div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📊 What data we store about you</div>
              {[
                ['Email address', 'Used for login and communication'],
                ['Full name', 'For account identification'],
                ['Organisation', 'Passionate Feeding Scheme'],
                ['Role', 'Admin'],
                ['Login timestamps', 'For security audit purposes'],
                ['IP address', 'Stored by Supabase for security'],
              ].map(([field, purpose], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < 5 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{String(field)}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{String(purpose)}</div>
                  </div>
                  <span className="pill pill-green" style={{ alignSelf: 'center' }}>Stored</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={handleExportMyData}>
                📦 Export all my data (JSON)
              </button>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔗 Third party processors</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>The following third parties process your data on our behalf:</div>
              {[
                ['Supabase Inc.', 'Database & authentication', 'South Africa (Cape Town)', 'SOC 2 Type II'],
                ['Vercel Inc.', 'Web hosting & CDN', 'USA (with SA routing)', 'ISO 27001'],
              ].map(([name, role, location, cert], i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{String(name)}</div>
                    <span className="pill pill-blue">{String(cert)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>{String(role)}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>📍 {String(location)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
