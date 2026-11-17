// Owner-centred demos on real screens. Each one follows a complete workflow the way a salon owner lives it,
// often on two devices: the client's phone and the salon's laptop. No added text: only the app's own screens.
// Targets are found by visible text or form label, so restyling a page doesn't break a demo.

export type Dev = "desktop" | "phone";
export type Target = { sel?: string; text?: string; field?: string; nth?: number; within?: string };
type S =
  | { do: "url"; path: string } // desktop: type an address in the browser bar and go
  | { do: "go"; path: string } // load a page directly (e.g. the phone opening a link)
  | { do: "nav"; label: string } // click a sidebar item
  | { do: "move"; to: Target; ms?: number }
  | { do: "click"; to: Target; nav?: boolean; ms?: number }
  | { do: "type"; to: Target; text: string; cps?: number }
  | { do: "set"; to: Target; value: string }
  | { do: "select"; to: Target; option: string }
  | { do: "submit"; to: Target }
  | { do: "scroll"; to: Target; ms?: number }
  | { do: "swipe"; to: Target; dx: number } // phone: drag a carousel sideways
  | { do: "focus"; to: Target; ms?: number } // lift one thing out of the page for a moment
  | { do: "read"; to: Target; ms?: number } // hold on a result, framed whole, long enough to take in
  | { do: "shot"; view: Dev | "both"; ms?: number } // camera: frame one device, or both side by side
  | { do: "notify"; kind?: "booking" | "payment" } // the salon's laptop receives the live notification
  | { do: "wait"; ms: number }
  | { do: "waitFor"; to: Target; ms?: number }
  | { do: "day"; from: number }
  | { do: "file"; to: Target; count?: number };
export type Step = S & { on?: Dev };

export type Entry = "rise" | "drop" | "swing-left" | "swing-right" | "push" | "spin";
export type Look = { bg: string; light?: boolean; entry: Entry; tilt: number };
export type ReelDef = { id: string; title: string; problem: string; start: string; phone?: string; look: Look; steps: Step[] };
export type ReelVars = { slug: string; manage: string; mpesaCode: string; depositCode: string; finCode: string; smsCode: string; checkoutAppt: string; freeDate: string; smsDate: string; stamp: string };

const btn = (text: string): Target => ({ text, sel: "button" });
const link = (text: string): Target => ({ text, sel: "a" });
const P = "phone" as const;

// Pacing rule: every result the viewer should understand gets a "read" (3.5 s or more, longer for anything
// with several lines). Actions in between stay brisk.
const CAL = '[data-tour="calendar-grid"]';
const VIEW = (v: string): Target => ({ text: v, sel: 'nav[aria-label="Calendar view"] a' });

export const REELS: ReelDef[] = [
  {
    id: "landing", title: "Why Laazizi", problem: "The website: what Laazizi does for a salon, how it compares, the prices, and starting a free trial.", start: "/",
    look: { bg: "#ededed", light: true, entry: "rise", tilt: 0.8 },
    steps: [
      { do: "wait", ms: 2200 },
      { do: "move", to: { sel: ".mq" }, ms: 1400 },
      { do: "wait", ms: 1200 },
      { do: "scroll", to: { sel: "#features" }, ms: 1300 },
      { do: "click", to: { sel: "#features li button", nth: 0 } },
      { do: "read", to: { sel: "#features .bg-panel" }, ms: 3600 },
      { do: "click", to: { sel: "#features li button", nth: 1 } },
      { do: "read", to: { sel: "#features .bg-panel" }, ms: 3600 },
      { do: "click", to: { sel: "#features li button", nth: 2 } },
      { do: "read", to: { sel: "#features .bg-panel" }, ms: 3600 },
      { do: "click", to: { sel: "#features li button", nth: 5 } },
      { do: "read", to: { sel: "#features .bg-panel" }, ms: 3600 },
      { do: "scroll", to: { sel: "#compare" }, ms: 1300 },
      { do: "read", to: { sel: "#compare .mt-16" }, ms: 7000 },
      { do: "scroll", to: { sel: "#pricing" }, ms: 1300 },
      { do: "read", to: { sel: "#pricing .mt-14.grid" }, ms: 4500 },
      { do: "focus", to: { text: "Founding offer", sel: "#pricing p" }, ms: 2800 },
      { do: "click", to: link("Try it free"), nav: true },
      { do: "type", to: { field: "Salon / spa name" }, text: "Amani Hair & Beauty" },
      { do: "type", to: { field: "Your name" }, text: "Amani Wanjiku" },
      { do: "type", to: { field: "Email" }, text: "amani@example.com", cps: 18 },
      { do: "type", to: { field: "Password" }, text: "a-strong-password", cps: 20 },
      { do: "select", to: { field: "County" }, option: "Nairobi" },
      { do: "type", to: { field: "Town or area" }, text: "Kilimani" },
      { do: "read", to: { sel: "form" }, ms: 3200 },
      { do: "focus", to: btn("Create my salon account"), ms: 2400 },
    ],
  },
  {
    id: "booking", title: "A client books, you're notified", problem: "No more DMs: a client books from the link in your bio, gets a booking slip and a confirmation, and the salon hears it straight away.", start: "/app", phone: "/book/{slug}",
    look: { bg: "#f5d6e4", light: true, entry: "push", tilt: 1 },
    steps: [
      { do: "shot", view: "both", ms: 2000 },
      // the client, on her phone, from the link in the salon's Instagram bio
      { do: "shot", view: "phone", ms: 1200 },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: 420 },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: -420 },
      { on: P, do: "click", to: btn("Box braids") },
      { on: P, do: "read", to: { text: "Knotless", sel: "button" }, ms: 2200 },
      { on: P, do: "click", to: btn("Knotless") },
      { on: P, do: "day", from: 2 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 1 } },
      { on: P, do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { on: P, do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { on: P, do: "type", to: { field: "Anything we should know" }, text: "Waist length please" },
      { on: P, do: "click", to: btn("Confirm booking") },
      { on: P, do: "wait", ms: 2600 },
      { on: P, do: "read", to: { sel: ".bk-paper" }, ms: 5500 },
      { on: P, do: "focus", to: { sel: ".bk-link" }, ms: 2200 },
      // meanwhile, at the salon
      { do: "shot", view: "desktop", ms: 800 },
      { do: "notify", kind: "booking" },
      { do: "read", to: { sel: ".toast-in" }, ms: 2600 },
      { do: "click", to: { sel: ".toast-in button", nth: 0 }, nav: true },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4500 },
      { do: "scroll", to: { text: "Messages", sel: "h2" } },
      { do: "read", to: { text: "Messages", sel: "h2" }, ms: 400 },
      { do: "read", to: { sel: "main section.card li", nth: 0 }, ms: 4500 },
      { do: "nav", label: "Calendar" },
      { do: "click", to: VIEW("week"), nav: true },
      { do: "read", to: { sel: CAL }, ms: 2600 },
      { do: "focus", to: { text: "Naomi", sel: `${CAL} a` }, ms: 2600 },
      { do: "shot", view: "both", ms: 2200 },
    ],
  },
  {
    id: "deposits", title: "Deposits stop no-shows", problem: "Clients pay a small M-Pesa deposit to hold the slot, and move the booking themselves if plans change.", start: "/app", phone: "/book/{slug}",
    look: { bg: "#1f5277", entry: "swing-left", tilt: 1.1 },
    steps: [
      { do: "nav", label: "Settings" },
      { do: "scroll", to: { field: "Online booking deposit" } },
      { do: "select", to: { field: "Online booking deposit" }, option: "30%" },
      { do: "read", to: { field: "Online booking deposit" }, ms: 1800 },
      { do: "click", to: btn("Save settings"), nav: true },
      { do: "shot", view: "phone", ms: 1000 },
      { on: P, do: "go", path: "/book/{slug}" },
      { on: P, do: "click", to: btn("Silk press") },
      { on: P, do: "day", from: 3 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 2 } },
      { on: P, do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { on: P, do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { on: P, do: "read", to: { text: "Deposit:", sel: "p" }, ms: 400 },
      { on: P, do: "read", to: { sel: ".bg-petal\\/30" }, ms: 4000 },
      { on: P, do: "type", to: { sel: 'input[name="depositRef"]' }, text: "{depositCode}", cps: 9 },
      { on: P, do: "click", to: btn("Confirm booking") },
      { on: P, do: "wait", ms: 2600 },
      { on: P, do: "read", to: { sel: ".bk-paper" }, ms: 5000 },
      { do: "shot", view: "desktop", ms: 800 },
      { do: "notify", kind: "payment" },
      { do: "read", to: { sel: ".toast-in" }, ms: 2400 },
      { do: "click", to: { sel: ".toast-in button", nth: 0 }, nav: true },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4500 },
      // plans change: the client moves it herself, no calls, no DMs
      { do: "shot", view: "phone", ms: 1000 },
      { on: P, do: "click", to: { sel: ".bk-link" }, nav: true },
      { on: P, do: "read", to: { sel: "main" }, ms: 3000 },
      { on: P, do: "click", to: btn("Reschedule") },
      { on: P, do: "day", from: 4 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 3 } },
      { on: P, do: "click", to: btn("Confirm new time") },
      { on: P, do: "read", to: { text: "Moved to", sel: "p" }, ms: 3500 },
      { do: "shot", view: "desktop", ms: 800 },
      { do: "notify" },
      { do: "read", to: { sel: ".toast-in" }, ms: 3000 },
      { do: "shot", view: "both", ms: 2200 },
    ],
  },
  {
    id: "checkout", title: "Checkout: M-Pesa, verified", problem: "Type the M-Pesa code and Safaricom confirms who paid and how much. Then a receipt, printed or on WhatsApp.", start: "/app",
    look: { bg: "#14171c", entry: "push", tilt: 1 },
    steps: [
      { do: "read", to: { text: "Today's schedule", sel: ".label-caps" }, ms: 300 },
      { do: "click", to: { sel: 'a[href="/app/appointments/{checkoutAppt}"]' }, nav: true },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 3800 },
      { do: "click", to: link("Check out"), nav: true },
      { do: "type", to: { field: "Tip" }, text: "200" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "click", to: { text: "M-Pesa", sel: '[data-tour="payment"] button' } },
      { do: "type", to: { sel: 'input[aria-label="M-Pesa code"]' }, text: "{mpesaCode}", cps: 9 },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "read", to: { sel: '[data-tour="payment"]' }, ms: 4500 },
      { do: "click", to: btn("Split payment") },
      { do: "read", to: { sel: '[data-tour="payment"]' }, ms: 2800 },
      { do: "click", to: btn("Record payment"), nav: true },
      { do: "read", to: { sel: ".rcpt" }, ms: 7000 },
      { do: "select", to: { sel: 'select[aria-label="Printer paper"]' }, option: "80 mm" },
      { do: "read", to: { sel: ".rcpt" }, ms: 3500 },
      { do: "click", to: btn("Print receipt") },
      { do: "wait", ms: 900 },
      { do: "nav", label: "Finance" },
      { do: "read", to: { text: "M-Pesa payments received", sel: "h2" }, ms: 300 },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4500 },
    ],
  },
  {
    id: "clients", title: "Returning clients, remembered", problem: "Type a number and Laazizi knows the client: allergies, preferences, what she spends and how often she comes.", start: "/app",
    look: { bg: "#d9468a", entry: "spin", tilt: 1.2 },
    steps: [
      { do: "nav", label: "Calendar" },
      { do: "click", to: link("+ New"), nav: true },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 100" },
      { do: "waitFor", to: { text: "Returning client" } },
      { do: "read", to: { text: "Returning client" }, ms: 4500 },
      { do: "move", to: { field: "Service" } },
      { do: "set", to: { field: "Date" }, value: "{freeDate}" },
      { do: "set", to: { field: "Time" }, value: "10:00" },
      { do: "click", to: btn("Book appointment"), nav: true },
      { do: "focus", to: { text: "Jane", sel: `${CAL} a` }, ms: 2800 },
      { do: "nav", label: "Clients" },
      { do: "type", to: { sel: 'input[name="q"]' }, text: "Jane" },
      { do: "submit", to: { sel: 'input[name="q"]' } },
      { do: "click", to: link("Jane Wambui"), nav: true },
      { do: "read", to: { text: "Total spent", sel: ".label-caps" }, ms: 300 },
      { do: "read", to: { sel: "main .grid", nth: 0 }, ms: 3800 },
      { do: "scroll", to: { text: "Profile", sel: "h2" } },
      { do: "read", to: { sel: "main section.card.text-sm" }, ms: 4500 },
      { do: "click", to: { text: "Edit", sel: "a" }, nav: true },
      { do: "set", to: { sel: 'textarea[name="preferences"]' }, value: "Prefers Wanjiru. Knotless, waist length." },
      { do: "type", to: { sel: 'textarea[name="preferences"]' }, text: " Next time: bohemian." },
      { do: "click", to: { text: "Save", sel: "form button" }, nav: true },
      { do: "scroll", to: { text: "Profile", sel: "h2" } },
      { do: "read", to: { sel: "main section.card.text-sm" }, ms: 3500 },
      { do: "scroll", to: { text: "Appointment history", sel: "h2" } },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4500 },
    ],
  },
  {
    id: "dayend", title: "Closing the day", problem: "The till sheet, every M-Pesa payment matched, the numbers, and everyone's pay worked out.", start: "/app",
    look: { bg: "#0f2233", entry: "swing-right", tilt: 1 },
    steps: [
      { do: "nav", label: "Sales" },
      { do: "click", to: link("Daily summary"), nav: true },
      { do: "read", to: { text: "Collected today" }, ms: 300 },
      { do: "read", to: { sel: "main .grid", nth: 0 }, ms: 3800 },
      { do: "read", to: { text: "Staff for the day", sel: "h2" }, ms: 300 },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4000 },
      { do: "nav", label: "Finance" },
      { do: "click", to: link("Unmatched"), nav: true },
      { do: "focus", to: { text: "{finCode}" }, ms: 2600 },
      { do: "click", to: { sel: 'a[href="/app/sales/new?mpesa={finCode}"]' }, nav: true },
      { do: "select", to: { sel: "form select", nth: 0 }, option: "Gel manicure" },
      { do: "select", to: { sel: "form select", nth: 1 }, option: "Achieng Atieno" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "read", to: { sel: '[data-tour="payment"]' }, ms: 3500 },
      { do: "click", to: btn("Record payment"), nav: true },
      { do: "read", to: { sel: ".rcpt" }, ms: 3500 },
      { do: "nav", label: "Reports" },
      { do: "read", to: { sel: "main .grid", nth: 0 }, ms: 3800 },
      { do: "scroll", to: { text: "Staff performance & commission" } },
      { do: "read", to: { text: "Staff performance & commission", sel: "h2" }, ms: 300 },
      { do: "read", to: { sel: "main section.card", nth: 1 }, ms: 4500 },
      { do: "nav", label: "Payroll" },
      { do: "click", to: btn("Calculate pay"), nav: true },
      { do: "waitFor", to: btn("Approve") },
      { do: "read", to: { sel: "main ul.border-t-2" }, ms: 5000 },
      { do: "click", to: btn("Approve") },
      { do: "waitFor", to: link("Payslip") },
      { do: "click", to: link("Payslip"), nav: true },
      { do: "read", to: { sel: "main div.border-t-2.bg-panel" }, ms: 6500 },
    ],
  },
  {
    id: "calendar", title: "Your whole week, month, year", problem: "Day, week, month and year views, any date range, one stylist or everyone.", start: "/app",
    look: { bg: "#e3edf7", light: true, entry: "drop", tilt: 0.9 },
    steps: [
      { do: "nav", label: "Calendar" },
      { do: "read", to: { sel: CAL }, ms: 3000 },
      { do: "move", to: { sel: `${CAL} a[href^="/app/appointments/c"]`, nth: 1 } },
      { do: "click", to: VIEW("week"), nav: true },
      { do: "read", to: { sel: CAL }, ms: 3200 },
      { do: "click", to: { sel: `${CAL} a[href^="/app/appointments/c"]`, nth: 4 }, nav: true },
      { do: "read", to: { sel: "main section.card", nth: 0 }, ms: 4000 },
      { do: "nav", label: "Calendar" },
      { do: "click", to: VIEW("month"), nav: true },
      { do: "read", to: { sel: CAL }, ms: 3200 },
      { do: "click", to: VIEW("year"), nav: true },
      { do: "read", to: { sel: CAL }, ms: 3200 },
      { do: "click", to: btn("Pick dates") },
      { do: "click", to: btn("Last 30 days"), nav: true },
      { do: "read", to: { text: "Booked value" }, ms: 3500 },
      { do: "click", to: { text: "Wanjiru", sel: "a" }, nav: true },
      { do: "read", to: { sel: CAL }, ms: 3000 },
      { do: "click", to: VIEW("day"), nav: true },
      { do: "read", to: { sel: CAL }, ms: 3000 },
    ],
  },
  {
    id: "setup", title: "Set up in minutes", problem: "Add a service with photos and styles, and it's on your booking link straight away.", start: "/app", phone: "/book/{slug}",
    look: { bg: "#4f9cf0", entry: "swing-right", tilt: 1.2 },
    steps: [
      { do: "nav", label: "Services" },
      { do: "click", to: link("+ Add service"), nav: true },
      { do: "type", to: { field: "Service name" }, text: "Knotless braids" },
      { do: "type", to: { field: "Category" }, text: "Braids & locs" },
      { do: "set", to: { field: "Minutes" }, value: "240" },
      { do: "type", to: { field: "Price" }, text: "4500" },
      { do: "file", to: { text: "+ Add photos", sel: "button" }, count: 3 },
      { do: "waitFor", to: { sel: "figure img" } },
      { do: "read", to: { sel: "figure", nth: 0 }, ms: 400 },
      { do: "click", to: btn("+ Add style") },
      { do: "type", to: { field: "Style name" }, text: "Waist length" },
      { do: "type", to: { field: "Price", nth: 1 }, text: "5500" },
      { do: "read", to: { sel: "form" }, ms: 3500 },
      { do: "click", to: btn("Save service"), nav: true },
      { do: "nav", label: "Staff" },
      { do: "click", to: link("+ Add staff member"), nav: true },
      { do: "type", to: { field: "Name" }, text: "Faith Kerubo" },
      { do: "type", to: { field: "Email" }, text: "faith.{stamp}@showcase.invalid", cps: 22 },
      { do: "type", to: { field: "Job title" }, text: "Braider" },
      { do: "set", to: { field: "Commission" }, value: "30" },
      { do: "type", to: { field: "Temporary password" }, text: "welcome-2026", cps: 20 },
      { do: "click", to: btn("Save"), nav: true },
      { do: "focus", to: { text: "Faith Kerubo" }, ms: 2600 },
      { do: "nav", label: "Dashboard" },
      { do: "read", to: { text: "Your booking link", sel: ".label-caps" }, ms: 300 },
      { do: "read", to: { sel: "section.bg-ink" }, ms: 3500 },
      { do: "click", to: btn("Copy link") },
      { do: "shot", view: "phone", ms: 1000 },
      { on: P, do: "go", path: "/book/{slug}" },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: 600 },
      { on: P, do: "click", to: btn("Knotless braids") },
      { on: P, do: "read", to: { text: "Waist length", sel: "button" }, ms: 3500 },
      { do: "shot", view: "both", ms: 2200 },
    ],
  },
];

export const fill = (s: string, v: ReelVars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k as keyof ReelVars]) : m));
export const fillTarget = (t: Target, v: ReelVars): Target => ({ ...t, sel: t.sel && fill(t.sel, v), text: t.text && fill(t.text, v) });
