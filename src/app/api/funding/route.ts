import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orgName, orgCity, searchType } = await req.json();

    const focusMap: Record<string, string> = {
      feeding: 'community feeding schemes and food security',
      education: 'education and youth development',
      health: 'health and wellness programs',
      shelter: 'housing and shelter services',
      general: 'general community outreach and development',
    };

    const focus = focusMap[searchType] || focusMap.general;

    const prompt = `You are a South African NPO funding research expert. Find REAL, CURRENT, LEGITIMATE funding opportunities for a community NPO called "${orgName}" based in ${orgCity}, South Africa. The NPO focuses on: ${focus}.

Find 8 REAL funding opportunities currently available in South Africa. Include:
- Government grants: NDA, DSD, SASSA, National Lottery Distribution Trust Fund
- Corporate CSI: Shoprite, Pick n Pay, Anglo American, Standard Bank, Nedbank, Discovery, Sasol, MTN, Vodacom
- Foundations: Inyathelo, DG Murray Trust, Tshikululu, Claude Leon Foundation
- International: USAID, EU, Ford Foundation, Bill & Melinda Gates Foundation

For EACH funder provide REAL verified information.

CRITICAL RULES:
1. Only VERIFIED legitimate funders with real official websites
2. NO funders that require upfront fees - these are SCAMS
3. Only official domain emails (no Gmail/Yahoo/Hotmail)
4. Realistic grant amounts and real deadlines

Respond ONLY with valid JSON, no markdown, no explanation, just the JSON:
{
  "summary": "2 sentence overview of SA funding landscape for this NPO type",
  "totalFound": 8,
  "scamsBlocked": 3,
  "funders": [
    {
      "name": "National Development Agency",
      "type": "Government",
      "amount": "R50,000 - R500,000",
      "deadline": "Rolling applications - quarterly review",
      "focus": "Food security, poverty alleviation, community development",
      "description": "The NDA is a government agency that funds NPOs working to eradicate poverty. They support feeding schemes, community gardens and food security projects across South Africa.",
      "howToApply": "1. Register your NPO on the NDA portal at nda.org.za 2. Complete the online grant application form 3. Attach your NPO registration certificate, audited financials and project proposal 4. Submit before the quarterly deadline 5. NDA reviews within 60 days",
      "website": "https://www.nda.org.za",
      "email": "info@nda.org.za",
      "phone": "011 018 5500",
      "verified": true,
      "verifiedReason": "Government agency established by NDA Act No. 108 of 1998, accountable to Parliament",
      "urgency": "medium",
      "logo": "🏛"
    }
  ]
}`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
    }

    const data = await response.json();
    const textContent = data.content
      ?.filter((c: { type: string }) => c.type === 'text')
      ?.map((c: { text: string }) => c.text)
      ?.join('') || '';

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error('Funding agent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
