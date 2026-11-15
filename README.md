# SpaDesk

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
Bold plum/magenta/coral palette with lime accents, Bricolage Grotesque display type, **lucide** icons only. 3D effects (tilt-with-shine, flip cards, mouse-parallax depth layers, 3D reveals) follow the `3d-animations` skill in `.claude/skills/3d-animations` and respect `prefers-reduced-motion`.

## Stack
Next.js 15 · PostgreSQL + Prisma 6 · Tailwind CSS 4 · framer-motion · lucide-react · jose/bcrypt sessions · Luxon.

## Deploy to Vercel

1. **Import the repo:** on [vercel.com/new](https://vercel.com/new), import this GitHub repository. The framework is detected as Next.js. Vercel runs `npm run vercel-build`, which applies database migrations and then builds.
2. **Add a database before the first build:** in the project, open **Storage → Marketplace → Neon (Postgres)** and connect it to **Production, Preview and Development**. The build accepts `DATABASE_URL`, `POSTGRES_PRISMA_URL` or `POSTGRES_URL`, and runs migrations over the direct (non-pooled) URL when one is provided. Any other Postgres works too; add its URL as `DATABASE_URL` (include `?sslmode=require`). If you see *"No database connection string found"*, the database isn't connected to that environment yet: connect it, then **Redeploy**.
3. **Add environment variables** (Settings → Environment Variables). Generate each secret with `openssl rand -base64 48`:

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | random, 32+ characters |
   | `ENCRYPTION_KEY` | random, 32+ characters. **Keep it forever:** changing it makes saved API keys unreadable |
   | `CRON_SECRET` | random. Vercel sends it to the reminders cron automatically |
   | `ADMIN_SETUP_TOKEN` | random, used once to create your admin account |
   | `APP_URL` | your domain, e.g. `https://spadesk.co.ke` (optional; defaults to the Vercel production URL) |

4. **Deploy**, then open `https://YOUR-APP/admin/setup?token=YOUR_ADMIN_SETUP_TOKEN` and create your platform admin. The page disables itself once an admin exists; you can then delete `ADMIN_SETUP_TOKEN`.
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
