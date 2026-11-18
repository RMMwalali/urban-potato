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
  whatsapp:
    "Hi {name}, I'm {sender}, the founder of {brand}. I noticed you take bookings {how}. {brand} gives you a booking link for your Instagram and WhatsApp bio: clients choose a stylist and a free time themselves, pay deposits by M-Pesa and get reminders, so fewer no-shows and less time in DMs.\n\nIt's built in Kenya, {price} a month, and {offer}. Try it free for {trial} days, no card needed: {link}\n\nHappy to set it up with you in 10 minutes. If it's not for you, reply STOP and I won't message again.",
  instagram:
    "Hi {name}! I'm {sender}, the founder of {brand}. Your clients could book you without the back-and-forth in DMs: one link in your bio, they pick a stylist and time, pay a deposit by M-Pesa, and get reminders. {offer}. Free {trial}-day trial: {link}\n(Reply STOP and I won't message again.)",
  emailSubject: "A booking link for {name} (free {trial}-day trial)",
  email:
    "Hi {name} team,\n\nI'm {sender}, the founder of {brand}. I noticed you take bookings {how}, so I wanted to share something we built for salons in Kenya.\n\n{brand} gives you one booking link for your Instagram, TikTok and WhatsApp bios. Clients choose a service, a stylist and a free time themselves. You can ask for an M-Pesa deposit, reminders go out by SMS or WhatsApp, and every client's history stays with the salon.\n\nIt's {price} a month with no commission, and {offer}. You can try everything free for {trial} days without a card: {link}\n\nIf it helps, I can set it up with you over a 10-minute call.\n\nThanks,\n{sender}\nFounder, {brand}\n\nIf you'd rather not hear from us again, just reply and say so.",
  followUp:
    "Hi {name}, it's {sender}, the founder of {brand}, again. Just checking whether you had a chance to look at the booking link idea. The free trial is still open and {offer}: {link}\nNo worries if not, reply STOP and I'll leave you be.",
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

/** Fill a template for one lead. */
export async function render(template: string, lead: Lead, sender: string) {
  const [{ general }, offer] = await Promise.all([getSettings(), foundingOffer()]);
  const vars: Record<string, string> = {
    name: lead.name, area: lead.area ?? lead.city ?? "", how: how(lead.bookingMethod), sender: sender.split(" ")[0], brand: general.siteName,
    price: `${general.currency} ${general.monthlyPrice.toLocaleString()}`, trial: String(general.trialDays), link: signupLink(lead),
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
