# Laazizi

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
| **My earnings** | Every staff member sees their own services, commission, tips and payslips. |
| **Payroll** | Pay types per person (commission, salary, base + commission, chair rental), weekly/monthly/custom pay runs with commission and tips from recorded sales, prorated salaries, salary advances deducted automatically, bonuses and other deductions, optional statutory deductions (configurable rules with a Kenya template to verify against current KRA rates), approve → pay by M-Pesa/cash/bank with references, printable payslips, CSV export. |
| **Product tour** | Animated spotlight-and-tooltip tour across pages (14 steps for owners/managers, 8 for staff). Starts on first login, pauses if you browse away, replays from the sidebar; keyboard and phone friendly. |
| **Reminders** | SMS (Africa's Talking) or WhatsApp confirmations, reminders and cancellations, with a delivery log. |
| **Reports** | Revenue, staff commission and tips, top services, booking sources, payment methods, no-show rate, top clients. |
| **Data export** | CSV export of clients, appointments and sales. No lock-in. |
| **Services & photos** | Every service needs at least one photo (several allowed, first is the cover) and can have styles with their own price, length and photos. Photos are resized to WebP in the browser and served from crawlable `/img/<id>/<alt>.webp` URLs. Each salon gets a public photo gallery (`/book/<salon>/gallery`) with alt text, captions and structured data, and every photo is in the sitemap. |
| **Booking slip & receipts** | After booking, a slip prints out of the confirmation card (adapted from the `receipt-printer` skill in `.claude/skills`); it never claims payment unless a deposit was received, and it stays on the client's booking link. Sale receipts use the same design. Both print on 80 mm and 58 mm thermal POS printers (page sized to the receipt, black only) and on A4. |
| **Client autofill** | On staff forms, typing a phone or name finds registered clients: an exact phone match fills in by itself, picks show visits, allergies and preferences and preselect the usual service and stylist. Payment fields are never prefilled. The public booking page never looks anyone up; it only remembers a client on their own phone. |
| **Calendar views** | Day (staff columns), week, month, year (busy-day heat map) and any date range (day-by-day list with totals), picked on a calendar or from presets, with a staff filter. |
| **Location** | Sign-up asks for country, county/region (all 47 Kenyan counties), town and street. Network location is recorded automatically for sign-up page visits, attempts and new accounts from free host headers (Vercel `x-vercel-ip-*`, or Cloudflare with "Add visitor location headers" on). IP addresses are stored only as a keyed hash. Salons can correct their location in Settings. |
| **Onboarding** | 5-step setup checklist; opt-in starter menus (hair, barber, nails, spa). |
| **Trial** | 14-day trial countdown. When it ends the salon is locked to the billing page (data kept, online booking paused) until an admin activates them. |

### For you, the platform admin (`/admin`)
- **Overview**: salon count, trials, trials ending soon, paying salons, usage.
- **Salons & trials**: search and filter; **reset trial** (fresh N days), extend by N days, activate or renew on a plan (monthly × N months, annual × N years, or lifetime with no end date; renewals stack on the current paid-until date), mark past-due/suspended/cancelled, internal notes, "open as owner" for support, delete with typed confirmation.
- **Users**: every salon user; reset passwords, enable/disable, change roles.
- **Connections** (Platform → Connections): Web Push status (keys, devices, weekly volume), test to all devices, key rotation, optional own VAPID keys and contact; plus Africa's Talking, WhatsApp, M-Pesa Daraja, messaging provider. Encrypted at rest (AES-256-GCM), shown masked, environment variables used as fallback.
- **SEO & meta**: default title, title template, description, keywords, share image, X handle, Google verification, canonical URL; **per-page overrides** (including `/book/*` with a `{name}` placeholder) with a Google preview, noindex switch, and a sitemap and robots.txt generated from these settings.
- **Platform settings**: name, trial length, monthly / annual / lifetime prices, lifetime places and on/off switch, founding offer, support contacts (shown to locked salons), sign-up switch, admin accounts, password change.
- **Customer map** (Admin → Map): a 3D terrain globe with a pin per salon, coloured by status (paying, lifetime, on trial, trial over/expired, suspended/cancelled), pin height = bookings + sales in the last 30 days, pulse rings on busy salons, hover tooltips and click-to-fly details. Also shows sign-up page visitors who haven't created an account, the sign-up funnel (visited → tried → created), top places, and sign-ups that failed (email, salon name, reason) for follow-up.
- **Audit log**: every admin action.

### Growth & marketing
- **Guides** (`/guides`): 13 practical articles for salon, barbershop and spa owners (pricing and profit, no-shows, M-Pesa, clients, staff, choosing software), each with key points, FAQs and Article/FAQ/Breadcrumb structured data. Content lives in `src/content/guides/`.
- **SEO & AI discovery:** sitemap with all guides, robots.txt that explicitly allows search and AI crawlers, `/llms.txt` + `/llms-full.txt`, Organization/WebSite/SoftwareApplication/FAQ schema on the home page, a text-only social card, Google + Bing verification and social `sameAs` links in Admin → SEO, and an IndexNow script (`npm run indexnow -- https://yourdomain.com`).
- **Launch checklist:** step-by-step submissions for Cloudflare, Vercel, Google Search Console, Bing, IndexNow, Business Profile, directories and AI assistants. See [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).
- **Founding offer:** the first N salons that actually subscribe get X% off for M months (default 50 places, 50%, 6 months; editable in Admin → Settings). Applied automatically when an admin activates a salon; places-left counter on the pricing section and billing page.
- **Plans:** Monthly (KES 2,500), Annual (KES 25,000, two months free) and Lifetime (KES 75,000 once, limited to 25 salons), all editable in Admin → Settings. Shown on the pricing section (with Offer schema), billing page and llms.txt. The founding discount applies to monthly and annual (pro-rated over the discounted months of the year) but not to lifetime.
- **How-to demos** (Admin → Reel studio): 11 short videos filmed on the **real app** with **no added text**. An animated cursor works through the pages (sidebar, links, forms, the browser address bar) while the camera follows it, zooms in on the action and pulls back on page changes. Each demo answers one problem salon owners raised in our research (see `docs/RESEARCH.md`), and together they cover the platform:
  - online booking;
  - deposits against no-shows;
  - calendar and walk-ins;
  - M-Pesa checkout;
  - finance and till reconciliation;
  - client records;
  - reminders;
  - client self-reschedule;
  - reports and daily summary;
  - payroll;
  - services and team setup.

  Each demo has its own look: a background colour, the move it lands with, and a camera tilt. Editing techniques adapted from short-form SaaS editing tutorials:
  - a strong hook in the first second;
  - flat colour with fine grain;
  - a scale "punch" with motion blur on page changes;
  - focus beats that blur the page and lift the key result;
  - synthesised interface sounds (clicks, typing, whooshes), with optional low background music.

  Record one demo or all of them (one MP4 each, 9:16 or 16:9) in desktop Chrome or Edge by choosing "This tab"; the capture is cropped to the stage. Scripts live in `src/components/reel/screen/reels.ts` and target elements by visible text or form label.
  - **Showcase salon:** demos are filmed on a fictional salon ("Amani Hair & Beauty") that the admin creates with one click, so no customer data appears in marketing. It never sends SMS or WhatsApp messages, and it's excluded from admin stats, the customer map, the sitemap and search engines. Every take starts from the same state: what the previous take added is removed, and fresh M-Pesa payments are prepared. Reset or delete it from the Reel studio. Opening the studio signs the browser into it; "Done" restores your own salon login.
  - The text promo (SAY NO MORE, no screens) is still available under "Text promo".

- **Notifications** (`/app/notifications`): new online bookings, deposits, client reschedules and cancellations, M-Pesa payments and failed messages. In the app (web and installed) they arrive as toasts with Laazizi's own synthesised sounds (booking chime, payment "cha-ching", reschedule taps, cancel step-down, alert pulses), with an unread count in the sidebar and on the app icon. When Laazizi is closed they come as Web Push notifications on phones and computers, using the device's own sound (browsers don't allow custom push sounds). Push keys are generated on first use and stored encrypted, or set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (and optionally `VAPID_SUBJECT`, e.g. `mailto:you@domain`). On iPhone, push works once Laazizi is added to the Home Screen; the page walks users through it.
- **Installable app (PWA):** web manifest, service worker (`public/sw.js`), app icons and Apple web-app tags.
- **Brand files** (Admin → Brand, `public/brand/`): the one-line LAAZIZI wordmark as in the header, in vector SVG and HD PNG. Variants: colour, on dark, one-colour ink, one-colour white. Also app icons (light, dark, maskable), profile picture, share card, email header and the blue-and-pink text favicon. Regenerate with `python3 scripts/brand.py && node scripts/brand-png.mjs`.

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
