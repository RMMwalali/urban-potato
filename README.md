# Darling

Management platform for salons, barbershops and spas: online booking, client records, M-Pesa checkout, SMS/WhatsApp reminders and reports, replacing paper books and scattered Instagram/WhatsApp DMs. Multi-tenant SaaS with a 14-day free trial and a platform admin panel.

Feature choices are based on real complaints about existing salon software; see [`docs/RESEARCH.md`](docs/RESEARCH.md).

## What's in it

### For salons (`/app`)
| Area | What it does |
|---|---|
| **Calendar & bookings** | Staff columns, click-to-book, walk-in button, double-booking prevention, reschedule, statuses, booking-source tracking (WhatsApp, Instagram, TikTok, walk-in…) |
| **Online booking** (`/book/<salon>`) | No app or account for clients. Only offers staff who perform the service. Optional **M-Pesa deposit** (client pays the salon's own till/paybill/Pochi and enters the code). Buffer time between appointments. |
| **Client self-service** (`/b/<token>`) | Link in every confirmation and reminder: client reschedules or cancels within the salon's cancellation window. |
| **Client records** | Matched by phone. History, spend, no-show count (warning on repeat no-shows), allergies, preferences, notes. Owned by the salon. |
| **Checkout** | Multiple items, discount, tip **assigned to a stylist**, deposit deducted automatically, M-Pesa/cash/card/bank, numbered receipts (print or WhatsApp). |
| **Payments & M-Pesa verification** | Split any bill across cash, M-Pesa, card and bank (cash change calculated). Connect the salon's till/paybill to Safaricom C2B (per-salon Daraja keys, encrypted). Every payment then arrives automatically, and typing a code at checkout **fills in the payer's name and amount**, marked *Verified by Safaricom*. Pochi/personal numbers: paste the M-Pesa SMS and the code, name and amount are read from it (marked unverified). Each code can be used once, so the same payment can't be recorded twice. Settings: accepted methods (untick cash for M-Pesa only) and **"only accept codes confirmed by Safaricom"**. Deposits are verified the same way. |
| **Finance** | Every M-Pesa payment received, with its source (Safaricom / SMS / typed) and what it matched (receipt or deposit). Unmatched payments can be turned into a sale in one click. Takings by method, % verified, add a payment from SMS. |
| **Daily summary** | End-of-day sheet: totals per payment method, per-stylist services, commission and tips, and a list of M-Pesa codes to check against the till statement. |
| **My earnings** | Every staff member sees their own services, commission and tips per month. |
| **Reminders** | SMS (Africa's Talking) or WhatsApp confirmations, reminders and cancellations, with a delivery log. |
| **Reports** | Revenue, staff commission and tips, top services, booking sources, payment methods, no-show rate, top clients. |
| **Data export** | CSV export of clients, appointments and sales. No lock-in. |
| **Onboarding** | 5-step setup checklist; opt-in starter menus (hair, barber, nails, spa). |
| **Trial** | 14-day trial countdown. When it ends the salon is locked to the billing page (data kept, online booking paused) until an admin activates them. |

### For you, the platform admin (`/admin`)
- **Overview**: salon count, trials, trials ending soon, paying salons, usage.
- **Salons & trials**: search and filter; **reset trial** (fresh N days), extend by N days, activate for 1/3/6/12 months, mark past-due/suspended/cancelled, internal notes, "open as owner" for support, delete with typed confirmation.
- **Users**: every salon user; reset passwords, enable/disable, change roles.
- **API keys**: Africa's Talking, WhatsApp, M-Pesa Daraja, messaging provider. Encrypted at rest (AES-256-GCM), shown masked, environment variables used as fallback.
- **SEO & meta**: default title, title template, description, keywords, share image, X handle, Google verification, canonical URL; **per-page overrides** (including `/book/*` with a `{name}` placeholder) with a Google preview, noindex switch, and a sitemap and robots.txt generated from these settings.
- **Platform settings**: name, trial length, price, support contacts (shown to locked salons), sign-up switch, admin accounts, password change.
- **Audit log**: every admin action.

## Design
Minimal and text-led, modelled on an editorial monochrome layout: light grey paper (#ededed), near-black ink (#1c1f24), white panels, thin black rules, small uppercase labels and very large uppercase display type. Blue (#1f5277) is the accent and pink (#d9468a) is used only for small highlights such as the active nav dot. **One font, Geist**, for everything (codes use tabular figures). No icons, no gradients, no images. Motion: lines slide up from masks, sections fade and rise on scroll (1s, `cubic-bezier(0.19, 1, 0.22, 1)`), outlined "lens" circles blur the type beneath them and drift slowly with mouse parallax, and the full-screen menu wipes in. All motion respects `prefers-reduced-motion`.

## Stack
Next.js 15 · Neon Postgres + Prisma 6 (node-postgres adapter) · Tailwind CSS 4 · framer-motion · jose/bcrypt sessions · Luxon.

## Deploy to Vercel

1. **Import the repo:** on [vercel.com/new](https://vercel.com/new), import this GitHub repository. The framework is detected as Next.js. Vercel runs `npm run vercel-build`, which applies database migrations and then builds.
2. **Connect the Neon database** (project `rough-grass-70060214`, branch `production`). Either connect it under **Storage → Neon** in Vercel, or run `neon env pull` locally and add these two variables to Vercel for Production, Preview and Development:
   - `DATABASE_URL`: the **pooled** string (host contains `-pooler`). The app uses it through node-postgres + Prisma's `@prisma/adapter-pg`, with the pool registered via `attachDatabasePool` for Vercel Fluid compute.
   - `DATABASE_URL_UNPOOLED`: the **direct** string. The build uses it for `prisma migrate deploy`; migrations shouldn't go through PgBouncer.

   The build also accepts `POSTGRES_PRISMA_URL` / `POSTGRES_URL`. If you see *"No database connection string found"*, connect the database to that environment and **Redeploy**.
3. **Add environment variables** (Settings → Environment Variables). Generate each secret with `openssl rand -base64 48`:

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | random, 32+ characters |
   | `ENCRYPTION_KEY` | random, 32+ characters. **Keep it forever:** changing it makes saved API keys unreadable |
   | `CRON_SECRET` | random. Vercel sends it to the reminders cron automatically |
   | `ADMIN_SETUP_TOKEN` | random, used once to create your admin account |
   | `APP_URL` | your domain, e.g. `https://spadesk.co.ke` (optional; defaults to the Vercel production URL) |

4. **Deploy, then sign up straight away.** The first account created on the platform automatically becomes the platform admin: log in at `/admin/login` with the same email and password. (Alternatively, `/admin/setup?token=YOUR_ADMIN_SETUP_TOKEN` creates an admin without a salon.) If `AUTH_SECRET`/`ENCRYPTION_KEY` are missing the app falls back to secrets derived from `DATABASE_URL` so sign-up still works, but set them: the fallback changes if the database password changes, which logs everyone out and makes saved API keys unreadable. The reminders cron stays disabled until `CRON_SECRET` is set.
5. In **/admin**, fill in Platform settings (support WhatsApp/phone, price), API keys (Africa's Talking / WhatsApp) and SEO.
6. **Reminders:** `vercel.json` schedules `/api/cron/reminders` once a day, which is the most the Hobby plan allows. For reminders every 15 minutes, either upgrade to Pro and change the schedule to `*/15 * * * *`, or use the included GitHub Action (`.github/workflows/reminders.yml`): add repository secrets `APP_URL` and `CRON_SECRET` and it runs every 15 minutes for free.
7. **M-Pesa C2B:** each salon connects in Settings → Payments. The callback URL uses your `https` domain automatically.

## Local setup

```bash
cp .env.example .env     # set DATABASE_URL, AUTH_SECRET (32+ chars), ENCRYPTION_KEY, APP_URL, CRON_SECRET
npm install
npx prisma migrate deploy
```

Create your platform admin account. Credentials come from the environment and are never stored in code:

```bash
ADMIN_EMAIL=you@yourdomain.com ADMIN_PASSWORD='a-long-unique-password' ADMIN_NAME='Your Name' npm run admin:create
```

```bash
npm run build && npm start   # or: npm run dev
```

Then sign in at `/admin/login` and fill in **Platform settings** (support WhatsApp/phone, price), **API keys** and **SEO**.

The database starts empty: no demo salons, clients or bookings.

## Reminders cron
Call every 10–15 minutes:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/reminders
```

## Notes and next steps
- **Subscription payments** are activated manually by an admin. M-Pesa can't charge recurring subscriptions automatically; the next step is an STK-push "Pay now" on the billing page via Daraja, which activates the salon automatically.
- **M-Pesa C2B** needs a public `https://` APP_URL. Each salon registers its callback in Settings → Payments → *Connect to Safaricom*. Callback paths avoid the word "mpesa", which Safaricom rejects.
- **WhatsApp** reminders outside the 24h window need Meta-approved templates.
- Planned: staff working hours and leave, Swahili, offline/PWA mode, inventory, Airtel Money, rate limiting and password-reset emails.
