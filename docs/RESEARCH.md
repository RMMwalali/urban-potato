# What salon owners complain about, and what we built in response

Research done November 2026 from public reviews. Sources were read directly where possible. Capterra, G2 and the App Store blocked automated reading, so items from those sites come from search snippets and are marked *(snippet)*. Kenyan market evidence comes mostly from vendor blogs and should be confirmed by talking to salon owners.

## Review platforms (Trustpilot, ProductReview, Capterra, G2, app stores)

Ranked roughly by how often each came up.

| # | Complaint | Example (source) | Our response |
|---|---|---|---|
| 1 | **Hidden fees and marketplace commission** | Fresha: "20% 'finders fee' for all new clients, even if they find you through facebook, instagram or google" (productreview.com.au). Booksy: charged for clients "claiming they were boost clients when they weren't" (Trustpilot) | Flat monthly price, 0% commission, no per-stylist fees |
| 2 | **Payouts held for weeks** | GlossGenius: "held over $18,000 of our business funds for nearly a month"; Square: "holding $10,861 of our money"; Vagaro: "4 weeks without payment" (Trustpilot) | We never touch the money: clients pay the salon's own M-Pesa till, paybill or Pochi |
| 3 | **Bot-only or absent support** | Phorest: "The only contact is through a chat bot." (Trustpilot) | Support WhatsApp and phone shown in the app; admin can open any salon as its owner to help |
| 4 | **Price creep, "free" plans removed** | Fresha: "it says it's free forever. But that's not the case." | One published price, managed in admin settings |
| 5 | **Charges after cancelling** | Booksy: "still taking money out of my account" | Manual activation for now; no stored cards |
| 6 | **No-show fees fail** | Booksy: cancellation fee doesn't work because "client have an expired card" | M-Pesa deposits at booking (no card needed), no-show counts and warnings |
| 7 | **Bugs and failed bookings** | SimplyBook.me: "Every 3rd order fails" | Server re-checks every slot; test suite covers the booking flow |
| 8 | **Expensive or unreliable SMS** | Phorest *(snippet)*; Timely: unreliable confirmations | Delivery log of every message with status and error |
| 9 | **Hard to set up** | Phorest: "50% of services were setup wrong" | 5-step onboarding checklist, one-click starter menus |
| 10 | **Weak reporting** | GlossGenius *(snippet)*, Zenoti | Reports, daily summary, per-stylist earnings |
| 11 | **US-centric locale** | Setmore: "USA centric, especially, currency time, date settings" | KES, Africa/Nairobi, +254 phone handling by default, all configurable |
| 12 | **Losing client history when leaving** | Vagaro: "client history isn't something they transfer" *(snippet)* | CSV export of clients, bookings and sales |

**Most praised features:** automated reminders (the most common positive theme in Capterra's analysis), scheduling and online booking, in-app no-show charging, human support, and staff access from their phones.

## Kenya and East Africa
- Salons take payment on a shared **Buy Goods till**, on **per-stylist Pochi la Biashara** (chair rental), or a mix of both. **Tips go to the stylist's personal M-Pesa.** Owners reconcile a front-desk log against the till statement each day. → Configurable till/paybill/Pochi, tips assigned per stylist, a daily summary listing M-Pesa codes.
- **Deposits** to stop no-shows are "increasingly common" → optional deposit percentage on online booking.
- Technicians "do not have full visibility of their monthly transactions" → My earnings page.
- WhatsApp is the dominant channel → WhatsApp sharing, WhatsApp receipts, WhatsApp reminders.
- M-Pesa can't do automatic recurring billing → subscriptions are activated manually for now (STK push is next).
- Price expectations seen: KES 2,000–8,000 a month for small salons (vendor-sourced, unverified).

## Not built yet (from the research)
Offline mode, Swahili, inventory and stock shrinkage, staff working hours and leave, waitlist, Airtel Money, eTIMS/KRA receipts (needs checking), automatic M-Pesa verification via Daraja.
