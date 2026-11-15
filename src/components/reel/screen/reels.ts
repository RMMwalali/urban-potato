// Scripts for the screen reels: a cursor drives the real app (the showcase salon) inside a 3D device.
// Targets are found by visible text or form label, so restyling a page doesn't break a reel.

export type Target = { sel?: string; text?: string; field?: string; nth?: number; within?: string };
export type Step =
  | { do: "go"; path: string; ms?: number }
  | { do: "move"; to: Target; ms?: number }
  | { do: "click"; to: Target; nav?: boolean; ms?: number }
  | { do: "type"; to: Target; text: string; cps?: number; ms?: number }
  | { do: "select"; to: Target; option: string; ms?: number }
  | { do: "submit"; to: Target; ms?: number }
  | { do: "scroll"; to: Target; ms?: number }
  | { do: "cam"; zoom?: number; rx?: number; ry?: number; rz?: number; focus?: Target | "center" | "cursor"; ms?: number }
  | { do: "caption"; text: string; sub?: string; ms?: number }
  | { do: "pop"; to: Target; label?: string; ms?: number }
  | { do: "wait"; ms: number }
  | { do: "waitFor"; to: Target; ms?: number };

export type ReelDef = { id: string; title: string; line: string; device: "desktop" | "phone"; start: string; steps: Step[] };
export type ReelVars = { slug: string; manage: string; mpesaCode: string };

export const REELS: ReelDef[] = [
  {
    id: "booking", title: "Online booking", line: "A booking link for your bio. Clients book themselves.", device: "phone", start: "/book/{slug}",
    steps: [
      { do: "caption", text: "Clients book themselves.", sub: "From your Instagram, TikTok or WhatsApp link. No app, no account." },
      { do: "cam", zoom: 1.05, ry: -10, rx: 6, focus: "center", ms: 1400 },
      { do: "click", to: { text: "Silk press", sel: "button" } },
      { do: "scroll", to: { text: "Pick a day & time" } },
      { do: "caption", text: "Only free times show.", sub: "Every slot is re-checked, so double bookings can't happen." },
      { do: "cam", zoom: 1.3, ry: 8, rx: 4, focus: "cursor", ms: 1200 },
      { do: "click", to: { sel: ".overflow-x-auto button", nth: 1 } },
      { do: "waitFor", to: { sel: ".grid-cols-4 button" } },
      { do: "click", to: { sel: ".grid-cols-4 button", nth: 2 } },
      { do: "scroll", to: { field: "Full name" } },
      { do: "type", to: { field: "Full name" }, text: "Naomi Wangari" },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 113" },
      { do: "caption", text: "Booked in seconds.", sub: "Confirmation now, a WhatsApp reminder before the visit." },
      { do: "click", to: { text: "Confirm booking", sel: "button" } },
      { do: "waitFor", to: { text: "You're booked" } },
      { do: "cam", zoom: 1.15, ry: -6, rx: 8, focus: { text: "You're booked" }, ms: 1200 },
      { do: "pop", to: { text: "You're booked" }, ms: 2200 },
    ],
  },
  {
    id: "calendar", title: "Calendar", line: "Every stylist, every chair, one calendar.", device: "desktop", start: "/app/calendar",
    steps: [
      { do: "caption", text: "Every stylist. One calendar.", sub: "Walk-ins and online bookings side by side." },
      { do: "cam", zoom: 1.0, ry: -14, rx: 8, focus: "center", ms: 1600 },
      { do: "cam", zoom: 1.45, ry: 6, rx: 4, focus: { sel: '[data-tour="calendar-grid"]' }, ms: 1400 },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 0 } },
      { do: "move", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 3 } },
      { do: "caption", text: "Every booking, in detail.", sub: "Client, service, deposit, messages and status." },
      { do: "click", to: { sel: '[data-tour="calendar-grid"] a[href^="/app/appointments/c"]', nth: 2 }, nav: true },
      { do: "waitFor", to: { text: "Payment", sel: "h2" } },
      { do: "cam", zoom: 1.25, ry: -8, focus: { text: "Payment", sel: "h2" }, ms: 1200 },
      { do: "pop", to: { text: "Payment", sel: "h2" }, label: "Check out by M-Pesa, cash or card from here", ms: 2000 },
      { do: "caption", text: "Walk-in? Two taps.", sub: "Find the client by phone, pick a service, done." },
      { do: "go", path: "/app/appointments/new?walkin=1" },
      { do: "cam", zoom: 1.5, ry: 8, rx: 4, focus: { field: "Phone number" }, ms: 1200 },
      { do: "type", to: { field: "Phone number" }, text: "0700 000 104" },
      { do: "type", to: { field: "Full name" }, text: "Sharon Wairimu" },
      { do: "select", to: { field: "Service" }, option: "Deep-cleansing facial" },
      { do: "select", to: { field: "Staff" }, option: "Mercy Chebet" },
      { do: "click", to: { text: "Book appointment", sel: "button" }, nav: true },
      { do: "cam", zoom: 1.1, ry: -6, focus: "center", ms: 1400 },
    ],
  },
  {
    id: "checkout", title: "M-Pesa checkout", line: "Type the code. Safaricom fills in the rest.", device: "desktop", start: "/app/sales/new",
    steps: [
      { do: "caption", text: "Checkout in seconds.", sub: "Services, products, tips and split payments." },
      { do: "cam", zoom: 1.0, ry: 12, rx: 8, focus: "center", ms: 1500 },
      { do: "cam", zoom: 1.5, ry: -6, rx: 4, focus: { field: "Client name" }, ms: 1300 },
      { do: "type", to: { field: "Client name" }, text: "Jane Wambui" },
      { do: "select", to: { sel: "form select", nth: 0 }, option: "Box braids" },
      { do: "select", to: { sel: "form select", nth: 1 }, option: "Wanjiru Njeri" },
      { do: "scroll", to: { sel: '[data-tour="payment"]' } },
      { do: "click", to: { text: "M-Pesa", sel: '[data-tour="payment"] button' } },
      { do: "caption", text: "Type the M-Pesa code.", sub: "Safaricom confirms it and fills in the name and amount." },
      { do: "cam", zoom: 1.7, ry: 6, rx: 4, focus: { sel: 'input[aria-label="M-Pesa code"]' }, ms: 1200 },
      { do: "type", to: { sel: 'input[aria-label="M-Pesa code"]' }, text: "{mpesaCode}", cps: 9 },
      { do: "waitFor", to: { text: "Confirmed by Safaricom" } },
      { do: "pop", to: { text: "Confirmed by Safaricom" }, ms: 2400 },
      { do: "caption", text: "Every code works once.", sub: "No fake screenshots. No payment recorded twice." },
      { do: "click", to: { text: "Record payment", sel: "button" }, nav: true },
      { do: "cam", zoom: 1.15, ry: -10, rx: 6, focus: "center", ms: 1500 },
      { do: "wait", ms: 1200 },
    ],
  },
  {
    id: "clients", title: "Client records", line: "History, allergies and spend, owned by the salon.", device: "desktop", start: "/app/clients",
    steps: [
      { do: "caption", text: "Every client, remembered.", sub: "Owned by your salon, not by whoever is on shift." },
      { do: "cam", zoom: 1.0, ry: -12, rx: 8, focus: "center", ms: 1500 },
      { do: "cam", zoom: 1.5, ry: 6, focus: { sel: 'input[name="q"]' }, ms: 1200 },
      { do: "type", to: { sel: 'input[name="q"]' }, text: "Jane" },
      { do: "submit", to: { sel: 'input[name="q"]' } },
      { do: "click", to: { text: "Jane Wambui", sel: "a" }, nav: true },
      { do: "waitFor", to: { text: "Total spent" } },
      { do: "cam", zoom: 1.35, ry: -8, rx: 4, focus: { text: "Total spent" }, ms: 1300 },
      { do: "caption", text: "Allergies before the chair.", sub: "Preferences, notes and no-shows, right there." },
      { do: "pop", to: { text: "Sensitive scalp" }, label: "Allergy on file", ms: 2200 },
      { do: "scroll", to: { text: "Appointment history" } },
      { do: "cam", zoom: 1.3, ry: 8, focus: { text: "Appointment history" }, ms: 1200 },
      { do: "move", to: { text: "Appointment history" } },
      { do: "caption", text: "Every visit, every shilling.", sub: "Export it all to a spreadsheet any time." },
      { do: "wait", ms: 1400 },
    ],
  },
  {
    id: "reminders", title: "Reminders", line: "Confirmations and reminders by SMS or WhatsApp.", device: "desktop", start: "/app/messages",
    steps: [
      { do: "caption", text: "Reminders send themselves.", sub: "By SMS or WhatsApp, at the time you choose." },
      { do: "cam", zoom: 1.0, ry: 12, rx: 8, focus: "center", ms: 1500 },
      { do: "cam", zoom: 1.45, ry: -6, focus: { sel: "tbody tr", nth: 0 }, ms: 1300 },
      { do: "move", to: { sel: "tbody tr td:nth-child(4)", nth: 0 } },
      { do: "pop", to: { sel: "tbody tr td:nth-child(5)", nth: 0 }, label: "Delivered", ms: 1800 },
      { do: "caption", text: "A log for every message.", sub: "So you know reminders really went out." },
      { do: "move", to: { sel: "tbody tr td:nth-child(4)", nth: 3 } },
      { do: "caption", text: "Clients reschedule themselves.", sub: "Every reminder has a link, within your cancellation policy." },
      { do: "go", path: "/b/{manage}" },
      { do: "cam", zoom: 1.25, ry: 8, rx: 6, focus: "center", ms: 1400 },
      { do: "wait", ms: 1800 },
    ],
  },
  {
    id: "reports", title: "Reports", line: "Takings, commission and where clients come from.", device: "desktop", start: "/app/reports",
    steps: [
      { do: "caption", text: "Know your numbers.", sub: "Revenue, no-shows and top services, live." },
      { do: "cam", zoom: 1.0, ry: -12, rx: 8, focus: "center", ms: 1500 },
      { do: "cam", zoom: 1.5, ry: 6, focus: { text: "Revenue" }, ms: 1300 },
      { do: "pop", to: { text: "Revenue", sel: ".label-caps" }, ms: 1800 },
      { do: "scroll", to: { text: "Staff performance & commission" } },
      { do: "caption", text: "Commission and tips, worked out.", sub: "Per stylist, from what was actually charged." },
      { do: "cam", zoom: 1.35, ry: -6, focus: { text: "Staff performance & commission" }, ms: 1300 },
      { do: "scroll", to: { text: "Where bookings come from" } },
      { do: "caption", text: "See what brings clients in.", sub: "Instagram, TikTok, WhatsApp, walk-ins." },
      { do: "cam", zoom: 1.35, ry: 6, focus: { text: "Where bookings come from" }, ms: 1300 },
      { do: "go", path: "/app/sales/day" },
      { do: "caption", text: "A till sheet at closing.", sub: "Cash and M-Pesa totals, codes to check against the statement." },
      { do: "cam", zoom: 1.2, ry: -8, rx: 6, focus: "center", ms: 1400 },
      { do: "wait", ms: 1600 },
    ],
  },
  {
    id: "payroll", title: "Payroll", line: "Commission, tips, advances and payslips.", device: "desktop", start: "/app/payroll",
    steps: [
      { do: "caption", text: "Payroll without arguments.", sub: "Commission, tips and advances from real sales." },
      { do: "cam", zoom: 1.0, ry: 12, rx: 8, focus: "center", ms: 1500 },
      { do: "cam", zoom: 1.45, ry: -6, focus: { sel: '[data-tour="payroll-new"]' }, ms: 1300 },
      { do: "type", to: { field: "Note (optional)" }, text: "November pay" },
      { do: "click", to: { text: "Calculate pay", sel: "button" }, nav: true },
      { do: "waitFor", to: { text: "Approve", sel: "button" } },
      { do: "caption", text: "Worked out for every stylist.", sub: "Salary, commission, tips, advances and deductions." },
      { do: "cam", zoom: 1.3, ry: 8, rx: 4, focus: { text: "Wanjiru Njeri" }, ms: 1300 },
      { do: "pop", to: { text: "Brian Otieno" }, label: "KES 2,000 advance deducted", ms: 2000 },
      { do: "click", to: { text: "Approve", sel: "button" } },
      { do: "waitFor", to: { text: "Payslip", sel: "a" } },
      { do: "click", to: { text: "Payslip", sel: "a" }, nav: true },
      { do: "caption", text: "A payslip for everyone.", sub: "Pay by M-Pesa, cash or bank, with references." },
      { do: "cam", zoom: 1.15, ry: -8, rx: 6, focus: "center", ms: 1400 },
      { do: "wait", ms: 1600 },
    ],
  },
];

export const fill = (s: string, v: ReelVars) => s.replace(/\{slug\}/g, v.slug).replace(/\{manage\}/g, v.manage).replace(/\{mpesaCode\}/g, v.mpesaCode);
