import type { Business } from "@prisma/client";

export function policyText(b: Business) {
  if (b.cancelPolicyText) return b.cancelPolicyText;
  const dep = b.depositPercent > 0 && b.mpesaNumber ? ` Deposits are non-refundable for no-shows or late cancellations.` : "";
  return `You can cancel or reschedule online up to ${b.cancelPolicyHours} hours before your appointment.${dep}`;
}

export function openDays(b: Business, tzNow: { plus: (o: { days: number }) => { weekday: number; toISODate: () => string | null } }, n = 21) {
  return Array.from({ length: n }, (_, i) => tzNow.plus({ days: i })).filter((d) => b.openDays.includes(d.weekday)).map((d) => d.toISODate()!);
}
