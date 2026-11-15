export type TourStep = { path: string; target?: string; title: string; body: string };

const welcome = (name: string): TourStep => ({ path: "/app", title: `Welcome to ${name}`, body: "This quick tour shows where everything lives. It takes about two minutes. Use the buttons, or the arrow keys on a computer." });

export function ownerSteps(name: string): TourStep[] {
  return [
    welcome(name),
    { path: "/app", target: "nav", title: "Everything is in this menu", body: "Calendar, clients, sales, payroll and settings. On a phone, tap Menu to open it." },
    { path: "/app", target: "setup", title: "Get set up in five steps", body: "Add your services, your team, your M-Pesa till and your location. Each step ticks off as you finish it." },
    { path: "/app", target: "new-appointment", title: "Book a client", body: "Use New appointment for phone and DM bookings, or Walk-in when someone comes through the door." },
    { path: "/app", target: "booking-link", title: "Your booking link", body: "Put this in your Instagram, TikTok and WhatsApp bios. Clients book themselves, any time, with no app." },
    { path: "/app/calendar", target: "calendar-grid", title: "The calendar", body: "One column per stylist. Tap any empty slot to book it. Double-bookings are blocked for you." },
    { path: "/app/clients", target: "client-search", title: "Client records", body: "Search by name or phone. Each client keeps their history, allergies, preferences and no-shows." },
    { path: "/app/sales/new", target: "payment", title: "Checkout", body: "Type an M-Pesa code and the payer's name and amount fill in. Split a bill between cash and M-Pesa when you need to." },
    { path: "/app/finance", target: "finance", title: "Finance", body: "Every M-Pesa, cash and card payment, matched to receipts. Payments without a receipt are flagged." },
    { path: "/app/services", target: "services", title: "Services & prices", body: "Your menu. Start from a template, then set your own times and prices." },
    { path: "/app/staff", target: "staff-add", title: "Your team", body: "Add staff, choose which services they do, and set how they're paid: commission, salary, both, or chair rental." },
    { path: "/app/payroll", target: "payroll-new", title: "Payroll", body: "Pick a period and calculate pay. Commission and tips come from recorded sales; advances and deductions are added for you." },
    { path: "/app/settings", target: "payments-settings", title: "Payments & M-Pesa", body: "Connect your till so payments are verified by Safaricom, and choose which payment methods you accept." },
    { path: "/app", target: "tour-button", title: "You're ready", body: "Replay this tour any time from here. Your guides and support contacts are on Plan & billing." },
  ];
}

export function staffSteps(name: string): TourStep[] {
  return [
    welcome(name),
    { path: "/app", target: "nav", title: "Your menu", body: "Calendar, clients, sales and your earnings. On a phone, tap Menu to open it." },
    { path: "/app", target: "new-appointment", title: "Book a client", body: "Use New appointment for phone and DM bookings, or Walk-in when someone arrives." },
    { path: "/app/calendar", target: "calendar-grid", title: "The calendar", body: "Your bookings and your colleagues'. Tap an empty slot to book it." },
    { path: "/app/clients", target: "client-search", title: "Client records", body: "Check allergies and preferences before every service." },
    { path: "/app/sales/new", target: "payment", title: "Checkout", body: "Type the M-Pesa code and the name and amount fill in. Record every sale so your commission counts." },
    { path: "/app/me", target: "my-earnings", title: "Your earnings", body: "Your services, commission, tips and payslips, updated as you work." },
    { path: "/app", target: "tour-button", title: "You're ready", body: "Replay this tour any time from here." },
  ];
}
