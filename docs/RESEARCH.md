# What salon owners complain about, and what we built in response

Sources: review platforms (Trustpilot, ProductReview, Capterra/G2 snippets) and Reddit (via the Arctic Shift archive).

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

## Reddit (r/hairstylist, r/smallbusiness, r/MassageTherapists, r/Esthetics, r/lashextensions)

reddit.com blocks automated access, so 652 posts and comments were pulled from the Arctic Shift archive of Reddit. Quotes are verbatim archive text with their original permalinks (live pages weren't loaded, so posts may since have been edited). Some threads were written by founders promoting their own tools. **There was no Kenya/M-Pesa content on Reddit.** Counts are rough.

| # | Pain point | Example | Status in SpaDesk |
|---|---|---|---|
| 1 | **No-shows, late cancels, deposits** (by far the biggest, ~167 hits) | "people trying to dispute their deposit with their bank because they cancelled their appointment day of" ([r/lashextensions](https://www.reddit.com/r/lashextensions/comments/1cb0t8v/)) | ✅ M-Pesa deposits verified against Safaricom, policy shown at booking. ⏳ STK-push "pay to hold the slot" with auto-expiry |
| 2 | **Forced client accounts** (Vagaro, StyleSeat, Booksy) | "booking is too difficult, because of the account creation burden" ([r/MassageTherapists](https://www.reddit.com/r/MassageTherapists/comments/1x0qiq3/)) | ✅ Guest booking with name + phone, no app or account |
| 3 | **Fee and price hikes** (GlossGenius, Square) | "went from promising a flat rate to tiered pricing with one month notice" ([r/hairstylist](https://www.reddit.com/r/hairstylist/comments/1x39ty8/can_someone_advise_me_on_the_proscons_of_square/pgnreeo/)) | ✅ One flat price, no processing cut. ⏳ Written price-lock policy |
| 4 | **Marketplaces showing competitors / paid leads that never book** | "331 appearances and 39 profile views. Not one person booked" ([r/hairstylist](https://www.reddit.com/r/hairstylist/comments/1kc5y3f/)) | ✅ Branded booking page with no competitor listings |
| 5 | **Dated, confusing UI** (Vagaro, Meevo) | "functional but the interface is dated and hard for staff to use" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1k6clsc/)) | ✅ Simple day calendar, tap-to-book, mobile layouts |
| 6 | **Glitches, disappearing appointments** | "the appointment disappears from my view" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1smdn0h/)) | ✅ Server-checked slots. ⏳ Per-appointment change history, offline mode |
| 7 | **Business can't edit client records** (Vagaro) | "Once a client logs in online, the business can no longer update or change contact information" ([r/MassageTherapists](https://www.reddit.com/r/MassageTherapists/comments/1mci5qm/)) | ✅ Salon owns and edits every record. ⏳ Merge duplicates |
| 8 | **Reminders silently stop** (Vagaro) | "clients missing their appointments because they no longer receive the reminders" (same thread) | ✅ Delivery log per message and per appointment |
| 9 | **Unhelpful support** | "the customer service agent would just explain what steps I could take to solve the problem myself" (same thread) | ✅ WhatsApp/phone support details shown in the app; admin "open as owner" |
| 10 | **Paper diary + WhatsApp double-booking** | "running her whole bookings on a paper diary + whatsapp and double-books constantly" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1uckotf/)) | ✅ One calendar with clash detection, booking link for WhatsApp. ⏳ WhatsApp booking bot |
| 11 | **Tools that don't talk to each other** | "we'll collect a deposit through Acuity, but Square doesn't recognize it" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1k6clsc/)) | ✅ Booking, deposit, checkout and notes in one app; deposit auto-deducted |
| 12 | **Can't book several services in one visit** (Vagaro) | "makes it look like clients can only book one service at a time" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1smdn0h/)) | ⏳ Not yet: multi-service online booking (checkout already supports multiple items) |
| 13 | **Too expensive / bloated for small salons** | "way too expensive for a single-chair setup or bloated enterprise software" ([r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1uckotf/)) | ✅ One price, unlimited staff, no contract. ⏳ Solo tier |
| 14 | **Booking rules not respected** (Vagaro, StyleSeat) | "clients booking 15 minutes and 45 minutes after even though I don't want that" ([r/MassageTherapists](https://www.reddit.com/r/MassageTherapists/comments/1ae4eaf/)) | ✅ Slot interval + buffer enforced. ⏳ Minimum notice, per-staff hours |
| 15 | **Data lock-in** | "ask what happens to your client data if you leave, whether you can export it as a CSV" ([r/hairstylist](https://www.reddit.com/r/hairstylist/comments/1wej1fh/salon_monster_booking_software/pdaiagp/)) | ✅ CSV export. ⏳ Import from other tools |

**Wished-for features:** pay-to-confirm links to drop into a WhatsApp/Instagram chat; a waitlist for last-minute gaps; digital intake/consent forms; colour formulas on the client profile; WhatsApp auto-replies while the stylist is busy; "from" prices by hair length; packages and memberships; a confirmation that settles "wrong day" disputes (✅ confirmation + self-service link); a booking page that looks professional (✅).

**Not confirmed on Reddit (review sites only):** Fresha's 20% new-client fee, Booksy Boost misattribution, Booksy forcing app downloads, GlossGenius holding funds.

## Kenya and East Africa
- Salons take payment on a shared **Buy Goods till**, on **per-stylist Pochi la Biashara** (chair rental), or a mix of both. **Tips go to the stylist's personal M-Pesa.** Owners reconcile a front-desk log against the till statement each day. → Configurable till/paybill/Pochi, tips assigned per stylist, a daily summary listing M-Pesa codes.
- **Deposits** to stop no-shows are "increasingly common" → optional deposit percentage on online booking.
- Technicians "do not have full visibility of their monthly transactions" → My earnings page.
- WhatsApp is the dominant channel → WhatsApp sharing, WhatsApp receipts, WhatsApp reminders.
- M-Pesa can't do automatic recurring billing → subscriptions are activated manually for now (STK push is next).
- Price expectations seen: KES 2,000–8,000 a month for small salons (vendor-sourced, unverified).

## Not built yet (from the research), in suggested priority order
1. STK-push "pay to hold the slot" deposits with auto-expiry (biggest pain on Reddit)
2. Multi-service online booking (one visit, several services)
3. Staff working hours, days off, minimum booking notice
4. Waitlist to fill cancellations
5. Intake/consent forms and colour formulas on client profiles
6. WhatsApp booking/auto-reply bot
7. Duplicate-client merge, appointment change history, import from other tools
8. Offline mode, Swahili, inventory, Airtel Money, packages/memberships, eTIMS/KRA receipts (needs checking)
