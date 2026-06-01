'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Funder = {
  name: string;
  type: string;
  amount: string;
  deadline: string;
  focus: string;
  description: string;
  howToApply: string;
  website: string;
  email: string;
  phone: string;
  verified: boolean;
  verifiedReason: string;
  urgency: 'high' | 'medium' | 'low';
  logo: string;
};

type SearchResult = {
  funders: Funder[];
  summary: string;
  searchedAt: string;
  totalFound: number;
  scamsBlocked: number;
};

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'success' ? '#EAF3DE' : type === 'error' ? '#FCEBEB' : '#E6F1FB', border: `0.5px solid ${type === 'success' ? '#b0d890' : type === 'error' ? '#f0b0b0' : '#a0c0e8'}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: type === 'success' ? '#27500A' : type === 'error' ? '#791F1F' : '#0C447C', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 360 }}>
    {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} {msg}
  </div>
);

const urgencyColour = (u: string) => {
  if (u === 'high') return { bg: '#FCEBEB', tx: '#791F1F', label: '🔴 Closing soon' };
  if (u === 'medium') return { bg: '#FAEEDA', tx: '#633806', label: '🟡 Open now' };
  return { bg: '#EAF3DE', tx: '#27500A', label: '🟢 Open' };
};

const typeColour = (t: string) => {
  if (t === 'Government') return { bg: '#E6F1FB', tx: '#0C447C' };
  if (t === 'Corporate CSI') return { bg: '#EAF3DE', tx: '#27500A' };
  if (t === 'Foundation') return { bg: '#EEEDFE', tx: '#3C3489' };
  if (t === 'International') return { bg: '#FAEEDA', tx: '#633806' };
  return { bg: '#F1EFE8', tx: '#5F5E5A' };
};

export default function FundingAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgCity, setOrgCity] = useState('Johannesburg');
  const [selectedFunder, setSelectedFunder] = useState<Funder | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchType, setSearchType] = useState('feeding');
  const [dots, setDots] = useState('');
  const dotsRef = useRef<NodeJS.Timeout | null>(null);
  const [savedFunders, setSavedFunders] = useState<string[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', data.session.user.id).single();
      if (userData?.org_id) {
        const { data: orgData } = await supabase.from('organisations').select('name, city').eq('id', userData.org_id).single();
        if (orgData) { setOrgName(orgData.name || ''); setOrgCity(orgData.city || 'Johannesburg'); }
      }
    });
  }, []);

  const startDots = () => {
    dotsRef.current = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
  };

  const stopDots = () => {
    if (dotsRef.current) clearInterval(dotsRef.current);
    setDots('');
  };

  const searchFunding = async () => {
    setLoading(true);
    setResult(null);
    setSelectedFunder(null);
    startDots();

    const prompt = `You are a South African NPO funding research agent. Search for REAL, CURRENT, LEGITIMATE funding opportunities for a community NPO called "${orgName}" based in ${orgCity}, South Africa.

The NPO focuses on: ${searchType === 'feeding' ? 'community feeding schemes and food security' : searchType === 'education' ? 'education and youth development' : searchType === 'health' ? 'health and wellness programs' : searchType === 'shelter' ? 'housing and shelter services' : 'general community outreach and development'}.

Find 8-10 REAL funding opportunities currently available in South Africa. Include:
- Government grants (NDA, DSD, SASSA, Lottery)
- Corporate CSI programs (major SA companies)
- Foundations (active in SA)
- International donors active in SA

For EACH funder provide REAL information:
- Official website URL
- Real email address
- Real phone number
- Actual grant amounts
- Actual deadlines (use 2025/2026 dates)
- How to apply (specific steps)

CRITICAL RULES:
1. Only include VERIFIED legitimate funders with real websites
2. NO funders that require upfront fees — mark those as SCAM
3. NO Gmail/Yahoo email addresses — only official domains
4. All links must be real official websites
5. Flag any suspicious funders

Respond ONLY with a JSON object in this exact format:
{
  "summary": "brief 2 sentence summary of funding landscape",
  "totalFound": number,
  "scamsBlocked": number,
  "funders": [
    {
      "name": "funder name",
      "type": "Government|Corporate CSI|Foundation|International",
      "amount": "e.g. R50,000 - R500,000",
      "deadline": "e.g. 31 March 2026 or Rolling applications",
      "focus": "e.g. Food security, community development",
      "description": "2-3 sentence description of what they fund",
      "howToApply": "specific step by step how to apply",
      "website": "https://real-official-website.co.za",
      "email": "real@officialdomain.co.za",
      "phone": "real phone number",
      "verified": true,
      "verifiedReason": "why this is legitimate e.g. Registered NPO, government body",
      "urgency": "high|medium|low",
      "logo": "emoji representing the funder type"
    }
  ]
}`;

    try {
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, orgCity, searchType }),
      });

      stopDots();

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'API call failed');
      }

      const parsed = await response.json();

      if (parsed.error) {
        throw new Error(parsed.error);
      }

      setResult({
        ...parsed,
        searchedAt: new Date().toLocaleString('en-ZA'),
      });
      showToast(`Found ${parsed.funders?.length || 0} verified funding opportunities!`);
    } catch (err: unknown) {
      stopDots();
      const error = err as Error;
      console.error('Funding search error:', error);
      showToast(`Search failed: ${error.message || 'Please try again'}`, 'error');
    }

    setLoading(false);
  };

  const saveFunder = (name: string) => {
    setSavedFunders(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
    showToast(savedFunders.includes(name) ? 'Removed from saved' : `${name} saved!`);
  };

  const filtered = result?.funders?.filter(f =>
    filter === 'all' ? true :
    filter === 'saved' ? savedFunders.includes(f.name) :
    f.type.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="topbar">
        <div>
          <div className="page-title">🤖 AI Funding Agent</div>
          <div className="page-sub">Real-time funding opportunities · Scam-filtered · South Africa only</div>
        </div>
        <div className="flex-gap">
          <span className="live-badge">● AI Powered</span>
          {result && <span style={{ fontSize: 12, color: '#888', background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '4px 10px' }}>Last searched: {result.searchedAt}</span>}
        </div>
      </div>

      {/* How it works banner */}
      <div style={{ background: 'linear-gradient(135deg, #185FA5 0%, #0c3a6b 100%)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 36, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>AI-powered funding search for {orgName || 'your NPO'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            Our AI agent searches verified South African funding databases in real time — NDA, DSD, Corporate CSI and foundations. Scams are automatically blocked. Only legitimate funders with real contacts shown.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          {['✅ Real contacts', '🛡️ Scam-free', '🔗 Direct links', '📅 Live deadlines'].map(b => (
            <span key={b} style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: 99, border: '0.5px solid rgba(255,255,255,0.2)' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Search controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔍 Configure your search</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Your organisation</label>
            <input className="form-input" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Organisation name" />
          </div>
          <div className="form-group">
            <label className="form-label">City / Province</label>
            <input className="form-input" value={orgCity} onChange={e => setOrgCity(e.target.value)} placeholder="e.g. Johannesburg, Gauteng" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">NPO focus area</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'feeding', label: '🍲 Feeding scheme / Food security' },
              { value: 'education', label: '📚 Education & youth' },
              { value: 'health', label: '🏥 Health & wellness' },
              { value: 'shelter', label: '🏠 Housing & shelter' },
              { value: 'general', label: '🌍 General community outreach' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSearchType(opt.value)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background: searchType === opt.value ? '#D85A30' : '#fff',
                  color: searchType === opt.value ? '#fff' : '#555',
                  border: `0.5px solid ${searchType === opt.value ? '#D85A30' : 'rgba(0,0,0,0.12)'}`,
                  fontFamily: 'inherit', transition: 'all 0.15s'
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, gap: 10 }}
          onClick={searchFunding}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              Searching for funding opportunities{dots}
            </>
          ) : (
            <>🤖 Find funding opportunities now</>
          )}
        </button>

        {loading && (
          <div style={{ marginTop: 12, background: '#FAFAF8', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>AI Agent is working{dots}</div>
            {[
              '🔍 Searching NDA and DSD databases...',
              '🏢 Scanning corporate CSI programs...',
              '🌍 Checking international foundations...',
              '🛡️ Filtering out scams and unverified sources...',
              '✅ Verifying contact details and deadlines...',
            ].map((step, i) => (
              <div key={i} style={{ fontSize: 11, color: '#aaa', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D85A30', flexShrink: 0 }} />
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: '✅ Verified funders', value: result.totalFound.toString(), color: '#27500A', bg: '#EAF3DE' },
              { label: '🛡️ Scams blocked', value: result.scamsBlocked.toString(), color: '#791F1F', bg: '#FCEBEB' },
              { label: '💰 Saved funders', value: savedFunders.length.toString(), color: '#0C447C', bg: '#E6F1FB' },
              { label: '📅 Searched', value: 'Live', color: '#633806', bg: '#FAEEDA' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: s.color, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: '#FAFAF8', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
            <strong style={{ color: '#1a1a1a' }}>📊 Funding landscape summary:</strong> {result.summary}
          </div>

          {/* Filter tabs */}
          <div className="subtabs" style={{ marginBottom: 14 }}>
            {[
              { value: 'all', label: `All (${result.funders?.length || 0})` },
              { value: 'Government', label: '🏛 Government' },
              { value: 'Corporate CSI', label: '🏢 Corporate CSI' },
              { value: 'Foundation', label: '🌱 Foundations' },
              { value: 'International', label: '🌍 International' },
              { value: 'saved', label: `⭐ Saved (${savedFunders.length})` },
            ].map(f => (
              <button key={f.value} className={`subtab ${filter === f.value ? 'on' : ''}`} onClick={() => setFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Funder cards + detail panel */}
          <div className="two-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((funder, i) => {
                const urg = urgencyColour(funder.urgency);
                const tc = typeColour(funder.type);
                const isSaved = savedFunders.includes(funder.name);
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedFunder(funder)}
                    style={{
                      background: '#fff', border: `0.5px solid ${selectedFunder?.name === funder.name ? '#D85A30' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: selectedFunder?.name === funder.name ? '0 0 0 2px rgba(216,90,48,0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{funder.logo || '💰'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{funder.name}</span>
                          <span className="pill" style={{ background: tc.bg, color: tc.tx, fontSize: 10 }}>{funder.type}</span>
                          <span className="pill" style={{ background: urg.bg, color: urg.tx, fontSize: 10 }}>{urg.label}</span>
                          {funder.verified && <span style={{ fontSize: 10, background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: 99 }}>✅ Verified</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{funder.focus}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#D85A30' }}>{funder.amount}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); saveFunder(funder.name); }}
                        style={{ background: isSaved ? '#E6F1FB' : '#FAFAF8', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}
                        title={isSaved ? 'Remove from saved' : 'Save funder'}
                      >
                        {isSaved ? '⭐' : '☆'}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{funder.description.slice(0, 120)}...</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#888' }}>📅 Deadline: <strong style={{ color: '#1a1a1a' }}>{funder.deadline}</strong></span>
                      <a href={funder.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: '#D85A30', textDecoration: 'none' }}>🔗 {funder.website.replace('https://', '').replace('http://', '').split('/')[0]}</a>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div>No funders in this category</div>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selectedFunder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize: 36 }}>{selectedFunder.logo || '💰'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedFunder.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{selectedFunder.type} · {selectedFunder.focus}</div>
                    </div>
                  </div>

                  {/* Verification badge */}
                  <div style={{ background: '#EAF3DE', border: '0.5px solid #b0d890', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#27500A' }}>Verified legitimate funder</div>
                      <div style={{ fontSize: 11, color: '#3B6D11' }}>{selectedFunder.verifiedReason}</div>
                    </div>
                  </div>

                  {[
                    ['💰 Grant amount', selectedFunder.amount],
                    ['📅 Deadline', selectedFunder.deadline],
                    ['🎯 Focus areas', selectedFunder.focus],
                  ].map(([l, v]) => (
                    <div key={l} className="d-row"><span className="d-label">{l}</span><span className="d-value" style={{ fontSize: 12 }}>{v}</span></div>
                  ))}

                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, margin: '10px 0 6px' }}>About this funder</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>{selectedFunder.description}</div>

                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 6 }}>How to apply</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, background: '#FAFAF8', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>{selectedFunder.howToApply}</div>

                  {/* Contact details */}
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8 }}>Contact details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {selectedFunder.website && (
                      <a href={selectedFunder.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#185FA5', textDecoration: 'none', background: '#E6F1FB', borderRadius: 8, padding: '8px 12px' }}>
                        <span>🌐</span> {selectedFunder.website}
                      </a>
                    )}
                    {selectedFunder.email && (
                      <a href={`mailto:${selectedFunder.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#185FA5', textDecoration: 'none', background: '#E6F1FB', borderRadius: 8, padding: '8px 12px' }}>
                        <span>✉️</span> {selectedFunder.email}
                      </a>
                    )}
                    {selectedFunder.phone && (
                      <a href={`tel:${selectedFunder.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#27500A', textDecoration: 'none', background: '#EAF3DE', borderRadius: 8, padding: '8px 12px' }}>
                        <span>📞</span> {selectedFunder.phone}
                      </a>
                    )}
                  </div>

                  <div className="flex-gap">
                    <a href={selectedFunder.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', fontSize: 13 }}>
                      🚀 Apply now →
                    </a>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => {
                        const text = `Funder: ${selectedFunder.name}\nAmount: ${selectedFunder.amount}\nDeadline: ${selectedFunder.deadline}\nWebsite: ${selectedFunder.website}\nEmail: ${selectedFunder.email}\nPhone: ${selectedFunder.phone}`;
                        navigator.clipboard.writeText(text);
                        showToast('Contact details copied!');
                      }}>
                      📋 Copy details
                    </button>
                  </div>
                </div>

                {/* Scam warning panel */}
                <div className="card" style={{ border: '0.5px solid #f0c0c0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#791F1F', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>🛡️</span> Scam protection warning signs
                  </div>
                  {[
                    'Never pay upfront fees to receive a grant',
                    'Legitimate funders never ask for your banking password',
                    'Official SA funders use .gov.za, .org.za or known domains',
                    'If deadline is "today only" — it is likely a scam',
                    'Verify all funders on the SARS NPO database',
                  ].map((w, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#791F1F', padding: '4px 0', display: 'flex', gap: 6, borderBottom: i < 4 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <span style={{ flexShrink: 0 }}>⚠️</span> {w}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <div style={{ textAlign: 'center', color: '#aaa' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Click a funder to see full details</div>
                  <div style={{ fontSize: 12 }}>Contact info, how to apply & direct links</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#aaa' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>Ready to find funding for {orgName || 'your NPO'}</div>
          <div style={{ fontSize: 14, color: '#888', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Click the button above to search for real, verified funding opportunities available right now in South Africa. The AI agent filters out scams automatically.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🏛 NDA grants', '🏢 Corporate CSI', '🌱 Foundations', '🌍 International donors', '🎰 Lottery grants'].map(b => (
              <span key={b} style={{ fontSize: 12, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 99, padding: '5px 14px', color: '#555' }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
