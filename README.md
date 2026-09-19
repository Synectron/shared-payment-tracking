# Settora

Track shared card and UPI spend with friends. Make a group, pick a **currency**, send an invite link or email, log charges, claim repayments. Nothing counts as paid until the **receiver approves**.

## Stack

- Next.js (App Router) on Vercel
- Supabase Auth (magic link) + Postgres + RLS + Storage
- Resend for outbound email from `contact@mail.opuskiln.com` (avoids Supabase’s ~2 emails/hour free-tier cap)

## Setup

1. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:43123
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxx
EMAIL_FROM=Settora <contact@mail.opuskiln.com>
```

2. In [Resend](https://resend.com): verify the **subdomain** `mail.opuskiln.com` (not the root domain) and create an API key.

3. In Supabase Dashboard → Authentication → URL configuration, add:
   - Site URL: `http://localhost:43123` (and your Vercel URL in production)
   - Redirect URLs: `http://localhost:43123/auth/callback` and `https://YOUR_DOMAIN/auth/callback`

4. Apply SQL migrations in `supabase/migrations/` (already applied on the Settora project).

5. Run:

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

## Email (custom domain)

With `SUPABASE_SERVICE_ROLE_KEY` + `RESEND_API_KEY` set:

- **Sign-in** uses `admin.generateLink` and sends the magic link via Resend (no Supabase OTP email)
- **Group invites** can be emailed from People → Email invite

Without those keys, sign-in falls back to Supabase’s built-in email (rate-limited).

## Currency

When you create a group, pick INR, USD, EUR, GBP, AED, SGD, AUD, or CAD. Every amount in that group formats in that currency.

## How invites work

- Each group has an **invite code** and link: `/join/<code>`
- Share the link or code, or email a custom invite
- Members can copy the link or regenerate the code under People

## Spends (instances)

- Whoever **pays** creates a **spend** in the group (party, dinner, trip…)
- That person is automatically the **receiver / approver**
- Optionally **upload the bill**
- Others claim they paid back → creator approves or rejects
