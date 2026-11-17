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
  | { do: "focus"; to: Target; ms?: number }
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

export const REELS: ReelDef[] = [
  {
    id: "landing", title: "Why Darling", problem: "The website: what Darling does for a salon, the prices, and starting a free trial.", start: "/",
    look: { bg: "#ededed", light: true, entry: "rise", tilt: 0.8 },
    steps: [
      { do: "wait", ms: 1600 },
      { do: "move", to: { sel: ".mq" } },
      { do: "scroll", to: { sel: "#features" }, ms: 1300 },
      { do: "click", to: { sel: "#features li button", nth: 1 } },
      { do: "wait", ms: 700 },
      { do: "click", to: { sel: "#features li button", nth: 2 } },
      { do: "wait", ms: 700 },
      { do: "click", to: { sel: "#features li button", nth: 5 } },
      { do: "wait", ms: 900 },
      { do: "scroll", to: { sel: "#complaints" }, ms: 1300 },
      { do: "focus", to: { sel: "#complaints tbody tr", nth: 1 }, ms: 1400 },
      { do: "focus", to: { sel: "#complaints tbody tr", nth: 2 }, ms: 1400 },
      { do: "scroll", to: { sel: "#pricing" }, ms: 1300 },
      { do: "move", to: { text: "Monthly", sel: "#pricing p" } },
      { do: "move", to: { text: "Annual", sel: "#pricing p" } },
      { do: "focus", to: { text: "Founding offer", sel: "#pricing p" }, ms: 1700 },
      { do: "click", to: link("Try it free"), nav: true },
      { do: "type", to: { field: "Salon / spa name" }, text: "Amani Hair & Beauty" },
      { do: "type", to: { field: "Your name" }, text: "Amani Wanjiku" },
      { do: "type", to: { field: "Email" }, text: "amani@example.com", cps: 18 },
      { do: "type", to: { field: "Password" }, text: "a-strong-password", cps: 20 },
      { do: "select", to: { field: "County" }, option: "Nairobi" },
      { do: "type", to: { field: "Town or area" }, text: "Kilimani" },
      { do: "focus", to: btn("Create my salon account"), ms: 1500 },
    ],
  },
  {
    id: "booking", title: "A client books, you're notified", problem: "No more DMs: a client books from the link in your bio and the salon hears it straight away.", start: "/app", phone: "/book/{slug}",
    look: { bg: "#f5d6e4", light: true, entry: "push", tilt: 1 },
    steps: [
      { do: "shot", view: "both", ms: 1400 },
      { do: "shot", view: "phone" },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: 420 },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: -420 },
      { on: P, do: "click", to: btn("Box braids") },
      { on: P, do: "click", to: btn("Knotless") },
      { on: P, do: "day", from: 2 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 1 } },
      { on: P, do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { on: P, do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { on: P, do: "click", to: btn("Confirm booking") },
      { on: P, do: "waitFor", to: { sel: ".bk-paper" } },
      { on: P, do: "focus", to: { sel: ".bk-paper" }, ms: 2200 },
      { do: "shot", view: "desktop" },
      { do: "notify", kind: "booking" },
      { do: "click", to: { sel: ".toast-in button", nth: 0 }, nav: true },
      { do: "focus", to: { text: "Box braids" }, ms: 1500 },
      { do: "nav", label: "Messages" },
      { do: "focus", to: { sel: "tbody tr", nth: 0 }, ms: 1500 },
      { do: "nav", label: "Calendar" },
      { do: "click", to: { text: "week", sel: 'nav[aria-label="Calendar view"] a' }, nav: true },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 3 } },
      { do: "shot", view: "both", ms: 1300 },
    ],
  },
  {
    id: "deposits", title: "Deposits stop no-shows", problem: "Clients pay a small M-Pesa deposit to hold the slot, and move it themselves if plans change.", start: "/app", phone: "/book/{slug}",
    look: { bg: "#1f5277", entry: "swing-left", tilt: 1.1 },
    steps: [
      { do: "nav", label: "Settings" },
      { do: "scroll", to: { field: "Online booking deposit" } },
      { do: "select", to: { field: "Online booking deposit" }, option: "30%" },
      { do: "click", to: btn("Save settings"), nav: true },
      { do: "shot", view: "phone" },
      { on: P, do: "go", path: "/book/{slug}" },
      { on: P, do: "click", to: btn("Silk press") },
      { on: P, do: "day", from: 3 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 2 } },
      { on: P, do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { on: P, do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { on: P, do: "focus", to: { text: "Deposit:" }, ms: 1500 },
      { on: P, do: "type", to: { sel: 'input[name="depositRef"]' }, text: "{depositCode}", cps: 9 },
      { on: P, do: "click", to: btn("Confirm booking") },
      { on: P, do: "waitFor", to: { sel: ".bk-paper" } },
      { on: P, do: "focus", to: { text: "Deposit paid" }, ms: 1800 },
      { do: "shot", view: "desktop" },
      { do: "notify", kind: "payment" },
      { do: "click", to: { sel: ".toast-in button", nth: 0 }, nav: true },
      { do: "focus", to: { text: "Payment", sel: "h2" }, ms: 1500 },
      { do: "shot", view: "phone" },
      { on: P, do: "click", to: { sel: ".bk-link" }, nav: true },
      { on: P, do: "click", to: btn("Reschedule") },
      { on: P, do: "day", from: 4 },
      { on: P, do: "click", to: { sel: ".grid-cols-4 button", nth: 3 } },
      { on: P, do: "click", to: btn("Confirm new time") },
      { on: P, do: "wait", ms: 1000 },
      { do: "shot", view: "desktop" },
      { do: "notify" },
      { do: "shot", view: "both", ms: 1300 },
    ],
  },
  {
    id: "checkout", title: "Checkout: M-Pesa, verified", problem: "Type the M-Pesa code, Safaricom fills in who paid and how much; print the receipt.", start: "/app",
    look: { bg: "#14171c", entry: "push", tilt: 1 },
    steps: [
      { do: "click", to: { sel: 'a[href="/app/appointments/{checkoutAppt}"]' }, nav: true },
      { do: "click", to: link("Check out"), nav: true },
      { do: "type", to: { field: "Tip" }, text: "200" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "click", to: { text: "M-Pesa", sel: '[data-tour="payment"] button' } },
      { do: "type", to: { sel: 'input[aria-label="M-Pesa code"]' }, text: "{mpesaCode}", cps: 9 },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "focus", to: { text: "Confirmed by Safaricom" }, ms: 2000 },
      { do: "click", to: btn("Split payment") },
      { do: "wait", ms: 700 },
      { do: "click", to: btn("Record payment"), nav: true },
      { do: "waitFor", to: { sel: ".rcpt" } },
      { do: "focus", to: { sel: ".rcpt" }, ms: 2000 },
      { do: "select", to: { sel: 'select[aria-label="Printer paper"]' }, option: "80 mm" },
      { do: "click", to: btn("Print receipt") },
      { do: "wait", ms: 700 },
      { do: "nav", label: "Finance" },
      { do: "focus", to: { sel: "tbody tr", nth: 0 }, ms: 1600 },
    ],
  },
  {
    id: "clients", title: "Returning clients, remembered", problem: "Type a number and Darling knows the client: allergies, last stylist, usual service.", start: "/app",
    look: { bg: "#d9468a", entry: "spin", tilt: 1.2 },
    steps: [
      { do: "nav", label: "Calendar" },
      { do: "click", to: link("+ New"), nav: true },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 100" },
      { do: "waitFor", to: { text: "Returning client" } },
      { do: "focus", to: { text: "Returning client" }, ms: 2000 },
      { do: "move", to: { field: "Service" } },
      { do: "set", to: { field: "Date" }, value: "{freeDate}" },
      { do: "set", to: { field: "Time" }, value: "10:00" },
      { do: "click", to: btn("Book appointment"), nav: true },
      { do: "nav", label: "Clients" },
      { do: "type", to: { sel: 'input[name="q"]' }, text: "Jane" },
      { do: "submit", to: { sel: 'input[name="q"]' } },
      { do: "click", to: link("Jane Wambui"), nav: true },
      { do: "focus", to: { text: "Total spent" }, ms: 1500 },
      { do: "focus", to: { text: "Sensitive scalp" }, ms: 1500 },
      { do: "scroll", to: { text: "Appointment history" } },
      { do: "move", to: { sel: 'a[href^="/app/appointments/c"]', nth: 1 } },
      { do: "wait", ms: 800 },
    ],
  },
  {
    id: "dayend", title: "Closing the day", problem: "The till sheet, every M-Pesa payment matched, the numbers, and pay worked out.", start: "/app",
    look: { bg: "#0f2233", entry: "swing-right", tilt: 1 },
    steps: [
      { do: "nav", label: "Sales" },
      { do: "click", to: link("Daily summary"), nav: true },
      { do: "focus", to: { text: "Staff for the day" }, ms: 1500 },
      { do: "scroll", to: { text: "M-Pesa codes to check" } },
      { do: "nav", label: "Finance" },
      { do: "click", to: link("Unmatched"), nav: true },
      { do: "focus", to: { text: "{finCode}" }, ms: 1400 },
      { do: "click", to: { sel: 'a[href="/app/sales/new?mpesa={finCode}"]' }, nav: true },
      { do: "select", to: { sel: "form select", nth: 0 }, option: "Gel manicure" },
      { do: "select", to: { sel: "form select", nth: 1 }, option: "Achieng Atieno" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "click", to: btn("Record payment"), nav: true },
      { do: "nav", label: "Reports" },
      { do: "focus", to: { text: "Revenue", sel: ".label-caps" }, ms: 1300 },
      { do: "scroll", to: { text: "Staff performance & commission" } },
      { do: "nav", label: "Payroll" },
      { do: "click", to: btn("Calculate pay"), nav: true },
      { do: "waitFor", to: btn("Approve") },
      { do: "click", to: btn("Approve") },
      { do: "waitFor", to: link("Payslip") },
      { do: "click", to: link("Payslip"), nav: true },
      { do: "focus", to: { text: "Earnings", sel: ".label-caps" }, ms: 1500 },
    ],
  },
  {
    id: "calendar", title: "Your whole week, month, year", problem: "Day, week, month and year views, any date range, one stylist or everyone.", start: "/app",
    look: { bg: "#e3edf7", light: true, entry: "drop", tilt: 0.9 },
    steps: [
      { do: "nav", label: "Calendar" },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 1 } },
      { do: "click", to: { text: "week", sel: 'nav[aria-label="Calendar view"] a' }, nav: true },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 6 } },
      { do: "click", to: { text: "month", sel: 'nav[aria-label="Calendar view"] a' }, nav: true },
      { do: "wait", ms: 900 },
      { do: "click", to: { text: "year", sel: 'nav[aria-label="Calendar view"] a' }, nav: true },
      { do: "wait", ms: 1000 },
      { do: "click", to: btn("Pick dates") },
      { do: "click", to: btn("Last 30 days"), nav: true },
      { do: "focus", to: { text: "Booked value" }, ms: 1500 },
      { do: "click", to: { text: "Wanjiru", sel: "a" }, nav: true },
      { do: "wait", ms: 900 },
      { do: "click", to: { text: "day", sel: 'nav[aria-label="Calendar view"] a' }, nav: true },
      { do: "wait", ms: 800 },
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
      { do: "click", to: btn("+ Add style") },
      { do: "type", to: { field: "Style name" }, text: "Waist length" },
      { do: "type", to: { field: "Price", nth: 1 }, text: "5500" },
      { do: "click", to: btn("Save service"), nav: true },
      { do: "nav", label: "Dashboard" },
      { do: "click", to: btn("Copy link") },
      { do: "shot", view: "phone" },
      { on: P, do: "go", path: "/book/{slug}" },
      { on: P, do: "swipe", to: { sel: ".svc-rail" }, dx: 600 },
      { on: P, do: "click", to: btn("Knotless braids") },
      { on: P, do: "focus", to: { text: "Waist length" }, ms: 1600 },
      { do: "shot", view: "both", ms: 1300 },
    ],
  },
];

export const fill = (s: string, v: ReelVars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k as keyof ReelVars]) : m));
export const fillTarget = (t: Target, v: ReelVars): Target => ({ ...t, sel: t.sel && fill(t.sel, v), text: t.text && fill(t.text, v) });
