# SpaDesk

Management platform for beauty parlours and spas: bookings, client records, payments and reminders in one place, replacing paper books and scattered social-media DMs.

Multi-tenant SaaS: each salon signs up, gets its own isolated data and a public booking link (`/book/<salon-slug>`) to put in Instagram / TikTok / Facebook bios and WhatsApp Business profiles.

## Features (v1)

| Area | What it does |
|---|---|
| **Bookings & calendar** | Day view per staff member, click-to-book, double-booking prevention, reschedule, statuses (booked → confirmed → arrived → completed / no-show / cancelled), tracks *where* each booking came from (WhatsApp, Instagram, walk-in…) |
| **Online booking** | Public page per salon: pick service → staff (or "any") → day → free slot → name & phone. Only offers staff who perform that service. Server re-checks the slot before confirming. |
| **Client records** | Auto-created and matched by phone number. Visit history, total spend, no-shows, allergies (shown prominently on appointments), preferences, notes, birthday, marketing opt-in |
| **Payments & sales** | Checkout from an appointment or quick sale; multiple items, discount, tip; M-Pesa (code captured), cash, card, bank. Sequential receipts, print or send via WhatsApp. Staff commission computed per item. |
| **Reminders & messaging** | Booking confirmation, automatic reminder N hours before, cancellation notice, ad-hoc messages. SMS via Africa's Talking or WhatsApp Cloud API. Every message logged with delivery status. |
| **Reports** | Revenue (daily chart), staff performance & commission, top services, booking sources, payment methods, no-show rate, top clients |
| **Roles** | Owner / Manager (services, staff, reports, settings) / Staff (calendar, clients, checkout) |

## Stack

Next.js 15 (App Router, server actions) · PostgreSQL + Prisma 6 · Tailwind CSS 4 · JWT session cookie (jose + bcrypt) · Luxon for timezone-correct scheduling.

## Run locally

```bash
cp .env.example .env          # set DATABASE_URL and a long random AUTH_SECRET
npm install
npx prisma db push            # create tables
npm run db:seed               # optional demo salon
npm run dev
```

Demo login: `demo@spadesk.app` / `password123`. Demo booking page: http://localhost:3000/book/demo-salon

## Reminders

Schedule a call every 10–15 minutes (Vercel Cron, GitHub Actions, crontab):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/reminders
```

## Messaging providers

Set `MESSAGE_PROVIDER`:

- `console` (default): messages are logged and recorded, not delivered. Good for development.
- `africastalking`: SMS. Set `AT_USERNAME`, `AT_API_KEY`, optional `AT_SENDER_ID` (use username `sandbox` to test).
- `whatsapp`: Meta WhatsApp Cloud API. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`. **Note:** business-initiated messages (reminders) must use pre-approved message templates; the current adapter sends free text, which only works inside the 24h customer-service window. Template support is a next step.

## Multi-tenancy

Every table carries `businessId`. Every page/action resolves the tenant from the signed-in user (`requireUser()` in `src/lib/auth.ts`) and scopes all queries by it. Records from other salons return 404.

## Roadmap / next steps

- M-Pesa STK Push (Daraja) so clients pay from their phone and payments reconcile automatically
- WhatsApp message templates + inbound WhatsApp/Instagram inbox
- Staff working hours, breaks and leave (currently business opening hours apply to everyone)
- Deposits for online bookings to further cut no-shows
- Product inventory & retail sales
- Client photos (before/after), consent forms
- Subscription billing for salons, multi-branch support
- Rate limiting on public booking & login, password reset emails, audit log
- Automated tests in CI
