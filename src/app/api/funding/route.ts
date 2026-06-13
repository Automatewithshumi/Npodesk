export const dynamic = 'force-dynamic';

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Live search not configured', funders: [] }, { status: 200 });
    }

    const prompt = `Search the web for CURRENT, OPEN funding opportunities, grants and calls for proposals for South African NPOs in 2026, focused on ${focus}. The NPO is "${orgName}" based in ${orgCity}, South Africa.

Find up to 6 REAL, CURRENTLY OPEN opportunities (grants, calls for proposals, CSI funding rounds). Prioritise ones with deadlines in the next 6 months. Only include legitimate funders with real, verifiable official websites - no scams, no upfront-fee schemes.

Respond ONLY with valid JSON, no markdown, no commentary:
{
  "funders": [
    {
      "name": "funder name",
      "type": "Government" | "Corporate CSI" | "Foundation" | "International",
      "amount": "amount range",
      "deadline": "specific date if known, else 'Rolling'",
      "focus": "focus areas",
      "description": "2-3 sentences",
      "howToApply": "step by step instructions, use \\n between steps",
      "website": "https://...",
      "email": "contact email",
      "phone": "contact phone",
      "verified": true,
      "verifiedReason": "why this is legitimate",
      "urgency": "high" | "medium" | "low",
      "logo": "single emoji"
    }
  ]
}`;

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
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Live search unavailable', funders: [] }, { status: 200 });
    }

    const data = await response.json();
    const textContent = (data.content || [])
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('');

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ funders: [] }, { status: 200 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ funders: parsed.funders || [] });

  } catch (err) {
    console.error('Funding live search error:', err);
    // Always return 200 with empty list - never break the page
    return NextResponse.json({ funders: [] }, { status: 200 });
  }
}
