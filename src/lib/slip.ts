import "server-only";
import { db } from "./db";
import { fmtDate, fmtTime } from "./format";
import { mediaUrl } from "./media";

export type Slip = {
  salon: string; logo: string | null; address: string | null; phone: string | null;
  service: string; sub: string; date: string; time: string;
  currency: string; price: number; deposit: number; depositPaid: boolean; depositRef: string | null; balance: number;
  ref: string; client: string; status: string; href: string;
};

/** The booking slip, built only from what's saved: it's shown after the server confirms the booking. */
export async function bookingSlip(appointmentId: string): Promise<Slip | null> {
  const a = await db.appointment.findUnique({ where: { id: appointmentId }, include: { business: true, service: true, staff: true, client: true } });
  if (!a) return null;
  const b = a.business;
  const logo = b.logoId ? await db.media.findUnique({ where: { id: b.logoId }, select: { id: true, alt: true, mime: true } }) : null;
  const price = Number(a.price), deposit = Number(a.depositAmount);
  const minutes = Math.round((a.endAt.getTime() - a.startAt.getTime()) / 60000);
  return {
    salon: b.name, logo: logo ? mediaUrl(logo, "thumb") : null, address: [b.address, b.city].filter(Boolean).join(", ") || null, phone: b.phone,
    service: `${a.service.name}${a.styleName ? ` · ${a.styleName}` : ""}`,
    sub: [a.staff ? `with ${a.staff.name.split(" ")[0]}` : null, `${minutes} min`].filter(Boolean).join(" · "),
    date: fmtDate(a.startAt, b.timezone), time: `${fmtTime(a.startAt, b.timezone)}–${fmtTime(a.endAt, b.timezone)}`,
    currency: b.currency, price, deposit, depositPaid: deposit > 0 && !!a.depositRef, depositRef: a.depositRef, balance: Math.max(0, price - (a.depositRef ? deposit : 0)),
    ref: a.manageToken.slice(-8).toUpperCase(), client: a.client.name,
    status: a.status, href: `/b/${a.manageToken}`,
  };
}
