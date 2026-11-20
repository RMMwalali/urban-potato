import "server-only";
import type { Lead } from "@prisma/client";
import { db } from "./db";
import { appUrl } from "./url";
import { foundingOffer } from "./offer";
import { getSettings } from "./platform";

export const LEAD_STATUSES = [
  { id: "NEW", label: "New" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "REPLIED", label: "Replied" },
  { id: "DEMO", label: "Demo / setup" },
  { id: "TRIAL", label: "On trial" },
  { id: "PAYING", label: "Paying" },
  { id: "NOT_INTERESTED", label: "Not interested" },
  { id: "DO_NOT_CONTACT", label: "Do not contact" },
] as const;
export const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.id === s)?.label ?? s;

export type Templates = { whatsapp: string; instagram: string; emailSubject: string; email: string; followUp: string };
export const DEFAULT_TEMPLATES: Templates = {
  // Short, personal, and leading with something made for them (their own booking page), not a pitch.
  whatsapp:
    "Hi {name}! I'm {sender}, the founder of {brand}. I made a booking page for {name}, so your clients can pick a time and pay a deposit by M-Pesa without the back-and-forth in DMs. Here it is: {preview}\n\nIf you like it, I can switch it on for you today, free for {trial} days.\n\n(Reply STOP and I won't message again.)",
  instagram:
    "Hi {name}! I'm {sender}, the founder of {brand}. I made a booking page for your salon: clients pick a time and pay a deposit by M-Pesa, no DMs. Have a look: {preview}\nWant me to switch it on for you? Free for {trial} days.\n(Reply STOP and I won't message again.)",
  emailSubject: "I made a booking page for {name}",
  email:
    "Hi {name} team,\n\nI'm {sender}, the founder of {brand}. I noticed you take bookings {how}, so I made a booking page for {name} to show what your clients would see: {preview}\n\nWith it, clients choose a service, a stylist and a free time themselves, can pay a deposit by M-Pesa, and get a reminder the day before. Every client's history stays with the salon, and there's no commission: {price} a month, and {offer}.\n\nIf you like it, it takes about two minutes to make it yours with your real services and prices, free for {trial} days: {link}\n\nHappy to set it up with you over a 10-minute call.\n\nThanks,\n{sender}\nFounder, {brand}\n\nIf you'd rather not hear from us again, just reply and say so.",
  followUp:
    "Hi {name}, it's {sender}, the founder of {brand}, again. Did you get a chance to look at the booking page I made for you? {preview}\nHappy to set it up with you in 10 minutes. No worries if not, reply STOP and I'll leave you be.",
};

export async function getTemplates(): Promise<Templates> {
  const row = await db.platformSetting.findUnique({ where: { key: "outreach" } }).catch(() => null);
  return { ...DEFAULT_TEMPLATES, ...((row?.value ?? {}) as Partial<Templates>) };
}

function how(method?: string | null) {
  const m = (method ?? "").toLowerCase();
  if (/whats\s?app|wa\.me/.test(m)) return "on WhatsApp";
  if (/\bdm\b|direct message|instagram|insta/.test(m)) return "through Instagram DMs";
  if (/call|phone|07\d|\+254/.test(m)) return "by phone";
  return "through DMs and calls";
}

export const signupLink = (lead: Pick<Lead, "id">) => `${appUrl()}/signup?ref=lead_${lead.id}`;
/** The booking page we made for this lead, to open the conversation with. */
export const previewLink = (lead: Pick<Lead, "id">) => `${appUrl()}/try/${lead.id}`;

/** Fill a template for one lead. */
export async function render(template: string, lead: Lead, sender: string) {
  const [{ general }, offer] = await Promise.all([getSettings(), foundingOffer()]);
  const vars: Record<string, string> = {
    name: lead.name, area: lead.area ?? lead.city ?? "", how: how(lead.bookingMethod), sender: sender.split(" ")[0], brand: general.siteName,
    price: `${general.currency} ${general.monthlyPrice.toLocaleString()}`, trial: String(general.trialDays), link: signupLink(lead), preview: previewLink(lead),
    offer: offer.enabled && offer.left > 0 ? `the first ${offer.slots} salons get ${offer.percent}% off for ${offer.months} months (${offer.left} places left)` : "there's no commission on your clients",
  };
  return template.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

export const digits = (p?: string | null) => (p ?? "").replace(/\D/g, "").replace(/^0(?=7|1)/, "254");

export async function linkLeadToSignup(ref: string | null | undefined, businessId: string) {
  const id = ref?.startsWith("lead_") ? ref.slice(5) : null;
  if (!id) return;
  const lead = await db.lead.findUnique({ where: { id } }).catch(() => null);
  if (!lead || lead.status === "PAYING") return;
  await db.lead.update({ where: { id }, data: { businessId, status: "TRIAL", activity: { create: { kind: "status", text: "Signed up from the outreach link: free trial started", actor: "system" } } } });
}
