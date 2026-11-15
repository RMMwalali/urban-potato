// How-to demos: the real app (the showcase salon) in a browser frame, driven by an animated cursor.
// No added text: only the app's own screens. Each demo answers one problem salon owners told us about
// (docs/RESEARCH.md); together they cover the whole platform. Each has its own look (background, entry
// move, camera tilt) so the set doesn't feel repetitive, while the cursor and frame stay consistent.
// Targets are found by visible text or form label, so restyling a page doesn't break a demo.

export type Target = { sel?: string; text?: string; field?: string; nth?: number; within?: string };
export type Step =
  | { do: "url"; path: string } // type an address in the browser bar and go
  | { do: "nav"; label: string } // click a sidebar item
  | { do: "move"; to: Target; ms?: number }
  | { do: "click"; to: Target; nav?: boolean; ms?: number }
  | { do: "type"; to: Target; text: string; cps?: number }
  | { do: "set"; to: Target; value: string } // date/time/number inputs: click, then set
  | { do: "select"; to: Target; option: string }
  | { do: "submit"; to: Target }
  | { do: "scroll"; to: Target }
  | { do: "focus"; to: Target; ms?: number } // blur the page around the key result and punch in on it
  | { do: "wait"; ms: number }
  | { do: "waitFor"; to: Target; ms?: number }
  | { do: "day"; from: number } // click days from this one on until free times show
  | { do: "file"; to: Target; count?: number }; // pick photos in a photo field (generated artwork for the showcase)

export type Entry = "rise" | "drop" | "swing-left" | "swing-right" | "push" | "spin";
export type Look = { bg: string; light?: boolean; entry: Entry; tilt: number };
export type ReelDef = { id: string; title: string; problem: string; start: string; look: Look; steps: Step[] };
export type ReelVars = { slug: string; manage: string; mpesaCode: string; depositCode: string; finCode: string; smsCode: string; checkoutAppt: string; freeDate: string; smsDate: string; stamp: string };

const btn = (text: string): Target => ({ text, sel: "button" });
const link = (text: string): Target => ({ text, sel: "a" });
const bookSlot = (dayNth: number, slotNth: number): Step[] => [
  { do: "scroll", to: { text: "Pick a day & time" } },
  { do: "day", from: dayNth },
  { do: "click", to: { sel: ".grid-cols-4 button", nth: slotNth } },
];

export const REELS: ReelDef[] = [
  {
    id: "booking", title: "Online booking", problem: "“Clients DM all day and I need a website to take bookings.” A booking link clients use themselves.", start: "/app",
    look: { bg: "#f5d6e4", light: true, entry: "rise", tilt: 1 },
    steps: [
      { do: "move", to: { sel: '[data-tour="booking-link"]' } },
      { do: "click", to: btn("Copy link") },
      { do: "url", path: "/book/{slug}" },
      { do: "click", to: btn("Silk press") },
      ...bookSlot(1, 2),
      { do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { do: "type", to: { field: "Anything we should know" }, text: "Shoulder length, no heat damage please" },
      { do: "click", to: btn("Confirm booking") },
      { do: "waitFor", to: { text: "You're booked" } },
      { do: "focus", to: { text: "You're booked" }, ms: 1800 },
      { do: "url", path: "/app/calendar" },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 1 } },
      { do: "wait", ms: 900 },
    ],
  },
  {
    id: "deposits", title: "Deposits stop no-shows", problem: "“No-shows cost us a day’s takings and card no-show fees fail.” M-Pesa deposits at booking.", start: "/app",
    look: { bg: "#1f5277", entry: "swing-left", tilt: 1.2 },
    steps: [
      { do: "nav", label: "Settings" },
      { do: "scroll", to: { field: "Online booking deposit" } },
      { do: "select", to: { field: "Online booking deposit" }, option: "30%" },
      { do: "click", to: btn("Save settings"), nav: true },
      { do: "url", path: "/book/{slug}" },
      { do: "click", to: btn("Silk press") },
      ...bookSlot(2, 1),
      { do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { do: "focus", to: { text: "Deposit:" }, ms: 1600 },
      { do: "type", to: { sel: 'input[name="depositRef"]' }, text: "{depositCode}", cps: 9 },
      { do: "click", to: btn("Confirm booking") },
      { do: "waitFor", to: { text: "You're booked" } },
      { do: "focus", to: { text: "Deposit paid" }, ms: 1800 },
    ],
  },
  {
    id: "calendar", title: "Calendar & walk-ins", problem: "“Double bookings from a paper book and three WhatsApp chats.” One calendar for every chair.", start: "/app",
    look: { bg: "#ededed", light: true, entry: "drop", tilt: 0.8 },
    steps: [
      { do: "nav", label: "Calendar" },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 0 } },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 3 } },
      { do: "click", to: link("→"), nav: true },
      { do: "wait", ms: 700 },
      { do: "click", to: link("Today"), nav: true },
      { do: "click", to: link("+ New"), nav: true },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 104" },
      { do: "type", to: { field: "Full name" }, text: "Sharon Wairimu" },
      { do: "select", to: { field: "Service" }, option: "Deep-cleansing facial" },
      { do: "select", to: { field: "Staff" }, option: "Mercy Chebet" },
      { do: "select", to: { field: "Booked via" }, option: "Instagram" },
      { do: "set", to: { field: "Date" }, value: "{freeDate}" },
      { do: "set", to: { field: "Time" }, value: "11:00" },
      { do: "click", to: btn("Book appointment"), nav: true },
      { do: "click", to: { text: "Sharon Wairimu", sel: "a" }, nav: true },
      { do: "click", to: btn("Mark confirmed") },
      { do: "wait", ms: 1100 },
      { do: "click", to: btn("Client arrived") },
      { do: "wait", ms: 1200 },
    ],
  },
  {
    id: "checkout", title: "M-Pesa checkout", problem: "“Fake M-Pesa screenshots and payments we can’t match.” Type the code; Safaricom fills in the rest.", start: "/app",
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
      { do: "wait", ms: 1600 },
    ],
  },
  {
    id: "finance", title: "Finance & the till", problem: "“Money goes missing between the till and the books.” Every M-Pesa payment, matched or not.", start: "/app",
    look: { bg: "#0f2233", entry: "swing-right", tilt: 1.1 },
    steps: [
      { do: "nav", label: "Finance" },
      { do: "click", to: link("Unmatched"), nav: true },
      { do: "focus", to: { text: "{finCode}" }, ms: 1500 },
      { do: "click", to: { sel: 'a[href="/app/sales/new?mpesa={finCode}"]' }, nav: true },
      { do: "select", to: { sel: "form select", nth: 0 }, option: "Gel manicure" },
      { do: "select", to: { sel: "form select", nth: 1 }, option: "Achieng Atieno" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "move", to: { text: "Confirmed by Safaricom" } },
      { do: "click", to: btn("Record payment"), nav: true },
      { do: "nav", label: "Finance" },
      { do: "scroll", to: { text: "Add from SMS" } },
      { do: "type", to: { sel: 'textarea[name="sms"]' }, text: "{smsCode} Confirmed. Ksh800.00 received from KEVIN KIPROP 0700000102 on {smsDate}. New M-PESA balance is Ksh14,250.00.", cps: 45 },
      { do: "click", to: btn("Add payment") },
      { do: "wait", ms: 1200 },
      { do: "focus", to: { text: "Takings by method" }, ms: 1600 },
    ],
  },
  {
    id: "clients", title: "Client records", problem: "“When a stylist leaves, the client history leaves with her phone.” Records owned by the salon.", start: "/app",
    look: { bg: "#d9468a", entry: "spin", tilt: 1.3 },
    steps: [
      { do: "nav", label: "Clients" },
      { do: "type", to: { sel: 'input[name="q"]' }, text: "Jane" },
      { do: "submit", to: { sel: 'input[name="q"]' } },
      { do: "click", to: link("Jane Wambui"), nav: true },
      { do: "move", to: { text: "Total spent" } },
      { do: "focus", to: { text: "Sensitive scalp" }, ms: 1600 },
      { do: "scroll", to: { text: "Appointment history" } },
      { do: "move", to: { sel: 'a[href^="/app/appointments/c"]', nth: 1 } },
      { do: "scroll", to: { text: "Book appointment" } },
      { do: "click", to: link("Book appointment"), nav: true },
      { do: "select", to: { field: "Service" }, option: "Silk press" },
      { do: "select", to: { field: "Staff" }, option: "Wanjiru Njeri" },
      { do: "set", to: { field: "Date" }, value: "{freeDate}" },
      { do: "set", to: { field: "Time" }, value: "14:00" },
      { do: "click", to: btn("Book appointment"), nav: true },
      { do: "nav", label: "Clients" },
      { do: "move", to: link("Export CSV") },
      { do: "wait", ms: 900 },
    ],
  },
  {
    id: "reminders", title: "Reminders", problem: "“Reminders silently stopped sending and we only found out from empty chairs.” A log for every message.", start: "/app",
    look: { bg: "#f8f8f8", light: true, entry: "rise", tilt: 0.9 },
    steps: [
      { do: "nav", label: "Settings" },
      { do: "scroll", to: { text: "Reminders & messages" } },
      { do: "select", to: { field: "Channel" }, option: "WhatsApp" },
      { do: "select", to: { field: "Send reminder" }, option: "24 hours" },
      { do: "click", to: btn("Save settings"), nav: true },
      { do: "nav", label: "Messages" },
      { do: "move", to: { sel: "tbody tr td:nth-child(4)", nth: 0 } },
      { do: "focus", to: { sel: "tbody tr td:nth-child(5)", nth: 0 }, ms: 1400 },
      { do: "move", to: { sel: "tbody tr td:nth-child(4)", nth: 2 } },
      { do: "click", to: { sel: "tbody tr td:nth-child(2) a", nth: 0 }, nav: true },
      { do: "scroll", to: { text: "Send a message" } },
      { do: "move", to: { text: "Send a message" } },
      { do: "wait", ms: 1000 },
    ],
  },
  {
    id: "reschedule", title: "Clients reschedule themselves", problem: "“Clients cancel by not turning up because calling is awkward.” A link to move or cancel.", start: "/b/{manage}",
    look: { bg: "#2a0f1f", entry: "drop", tilt: 1.1 },
    steps: [
      { do: "move", to: { text: "Reschedule", sel: "button" } },
      { do: "click", to: btn("Reschedule") },
      { do: "day", from: 2 },
      { do: "click", to: { sel: ".grid-cols-4 button", nth: 3 } },
      { do: "click", to: btn("Confirm new time") },
      { do: "wait", ms: 1400 },
      { do: "url", path: "/app/messages" },
      { do: "focus", to: { sel: "tbody tr", nth: 0 }, ms: 1600 },
    ],
  },
  {
    id: "reports", title: "Reports & daily summary", problem: "“I don’t know which stylist or channel actually makes money.” Numbers from real sales.", start: "/app",
    look: { bg: "#e3edf7", light: true, entry: "swing-left", tilt: 0.9 },
    steps: [
      { do: "nav", label: "Reports" },
      { do: "focus", to: { text: "Revenue", sel: ".label-caps" }, ms: 1300 },
      { do: "scroll", to: { text: "Daily revenue" } },
      { do: "scroll", to: { text: "Staff performance & commission" } },
      { do: "move", to: { text: "Staff performance & commission" } },
      { do: "scroll", to: { text: "Where bookings come from" } },
      { do: "move", to: { text: "Where bookings come from" } },
      { do: "scroll", to: { text: "Top clients" } },
      { do: "nav", label: "Sales" },
      { do: "click", to: link("Daily summary"), nav: true },
      { do: "scroll", to: { text: "Staff for the day" } },
      { do: "scroll", to: { text: "M-Pesa codes to check" } },
      { do: "click", to: link("Previous day"), nav: true },
      { do: "wait", ms: 1200 },
    ],
  },
  {
    id: "payroll", title: "Payroll", problem: "“Every payday is an argument about commission, tips and advances.” Pay worked out from real sales.", start: "/app",
    look: { bg: "#1c1f24", entry: "push", tilt: 1 },
    steps: [
      { do: "nav", label: "Payroll" },
      { do: "scroll", to: { sel: '[data-tour="payroll-advances"]' } },
      { do: "select", to: { field: "Staff" }, option: "Achieng Atieno" },
      { do: "type", to: { field: "Amount" }, text: "1500" },
      { do: "type", to: { field: "Note", nth: 1 }, text: "Transport" },
      { do: "click", to: btn("Record advance") },
      { do: "wait", ms: 1000 },
      { do: "scroll", to: { sel: '[data-tour="payroll-new"]' } },
      { do: "type", to: { field: "Note (optional)" }, text: "November pay" },
      { do: "click", to: btn("Calculate pay"), nav: true },
      { do: "waitFor", to: btn("Approve") },
      { do: "move", to: { text: "Wanjiru Njeri" } },
      { do: "focus", to: { text: "Achieng Atieno" }, ms: 1500 },
      { do: "click", to: btn("Approve") },
      { do: "waitFor", to: link("Payslip") },
      { do: "click", to: link("Payslip"), nav: true },
      { do: "wait", ms: 1600 },
    ],
  },
  {
    id: "setup", title: "Services & team", problem: "“Setting up software takes weeks.” Add a service and a stylist in a minute.", start: "/app",
    look: { bg: "#4f9cf0", entry: "swing-right", tilt: 1.2 },
    steps: [
      { do: "nav", label: "Services" },
      { do: "move", to: { sel: "main li", nth: 0 } },
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
      { do: "focus", to: { text: "Knotless braids", sel: "main li" }, ms: 1300 },
      { do: "nav", label: "Staff" },
      { do: "click", to: link("+ Add staff member"), nav: true },
      { do: "type", to: { field: "Name" }, text: "Faith Kerubo" },
      { do: "type", to: { field: "Email" }, text: "faith.{stamp}@showcase.invalid", cps: 22 },
      { do: "type", to: { field: "Job title" }, text: "Stylist" },
      { do: "set", to: { field: "Commission" }, value: "30" },
      { do: "type", to: { field: "Temporary password" }, text: "welcome-2026", cps: 20 },
      { do: "click", to: btn("Save"), nav: true },
      { do: "focus", to: { text: "Faith Kerubo" }, ms: 1400 },
    ],
  },
];

export const fill = (s: string, v: ReelVars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k as keyof ReelVars]) : m));
export const fillTarget = (t: Target, v: ReelVars): Target => ({ ...t, sel: t.sel && fill(t.sel, v), text: t.text && fill(t.text, v) });
