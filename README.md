# 🍲 Passionate Feeding Scheme — SaaS Platform

A full community outreach management system built with Next.js 16, Tailwind CSS and Recharts.

---

## ✅ What's included

| Module | Features |
|---|---|
| Dashboard | Live KPIs, meal trends, activity feed, program targets |
| Beneficiaries | Registry, caregiver assignment, meal history, registration form |
| Caregivers | Directory, assigned beneficiaries, profile tracking |
| Volunteers | Roster, weekly schedule, shift management, hours tracking |
| Donors | CRM, giving history, donation capture, thank-you receipts |
| Meal programs | 6 programs, 8 sites, daily counts, delivery route log |
| Reports | 6 report types, impact snapshot, PDF export |

---

## 🚀 Deploy to Vercel in 5 minutes (FREE)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial PFS SaaS"
gh repo create pfs-saas --public --push
```

### Step 2 — Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `pfs-saas` repo
4. Click **"Deploy"** — done!

You'll get a live URL like: `https://pfs-saas.vercel.app`

### Step 3 — Custom domain (optional)
- Buy `passionatefeeding.co.za` at https://afrihost.com (~R150/year)
- In Vercel → Settings → Domains → add your domain
- Follow DNS instructions — live in minutes

---

## 💾 Add a real database (Supabase — free tier)

1. Go to https://supabase.com → create a free project
2. Create tables: `beneficiaries`, `caregivers`, `volunteers`, `donors`, `sites`, `meal_logs`
3. Add your Supabase URL + key to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. Install: `npm install @supabase/supabase-js`
5. Replace mock data in `src/lib/data.ts` with Supabase queries

---

## 🔐 Add authentication (Supabase Auth — free)

```bash
npm install @supabase/auth-helpers-nextjs
```

Supabase Auth gives you:
- Email/password login
- Role-based access (admin, caregiver, volunteer)
- Magic link login (no password needed)

---

## 💰 Monetisation (South Africa)

### PayFast integration (SA payments)
```bash
npm install payfast-sdk
```
- Accepts credit card, EFT, Ozow, SnapScan
- No monthly fees — 3.5% per transaction

### Recommended pricing
| Plan | Price | Who |
|---|---|---|
| Starter | R499/month | 1 site, 500 beneficiaries |
| Growth | R999/month | 3 sites, 2,000 beneficiaries |
| Pro | R1,999/month | Unlimited + reports API |

---

## 🛠 Local development

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

## 📦 Tech stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + custom CSS variables
- **Charts**: Recharts
- **Icons**: Emoji (swap for Lucide React)
- **Database**: Supabase (PostgreSQL) — add when ready
- **Auth**: Supabase Auth — add when ready
- **Hosting**: Vercel (free tier)
- **Payments**: PayFast (SA) or Stripe (international)

---

Built for **Passionate Feeding Scheme** · Johannesburg · 2026
