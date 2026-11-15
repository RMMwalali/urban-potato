import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { audience, KINDS } from "@/lib/notify";
import { PageHeader } from "@/components/ui";
import { NotifySettings } from "@/components/notify/NotifySettings";
import { MarkAllRead, RefreshOnNew } from "@/components/notify/ListControls";
import { removeDevice, saveNotifyKinds } from "@/app/actions/notify";
import { label } from "@/components/notify/labels";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser(undefined, { allowLocked: true });
  const tz = user.business.timezone;
  const [items, devices] = await Promise.all([
    db.notification.findMany({ where: audience(user), orderBy: { createdAt: "desc" }, take: 60 }),
    db.pushSubscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const unread = items.filter((i) => !i.readBy.includes(user.id)).length;
  return (
    <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
      <RefreshOnNew />
      <section>
        <PageHeader title="Notifications" label={unread ? `${unread} unread` : "All caught up"} />
        <div className="mb-3 flex justify-end">{unread > 0 && <MarkAllRead />}</div>
        <ul className="border-t-2 border-ink">
          {items.length === 0 && <li className="py-6 text-[15px] text-muted">Nothing yet. New online bookings, payments, cancellations and problems will show up here.</li>}
          {items.map((n) => {
            const isNew = !n.readBy.includes(user.id);
            return (
              <li key={n.id} className="border-b border-ink/20">
                <Link href={n.url ?? "/app/notifications"} className={`grid grid-cols-[10px_1fr] gap-3 py-4 transition-colors hover:bg-panel ${isNew ? "" : "opacity-60"}`}>
                  <span className={`mt-2 h-2 w-2 rounded-full ${isNew ? "bg-pink" : "bg-transparent"}`} />
                  <span>
                    <span className="label-caps flex flex-wrap justify-between gap-2 text-muted"><span>{label(n.kind)}</span><span>{fmtDateTime(n.createdAt, tz)}</span></span>
                    <span className="mt-1 block text-[17px] leading-snug">{n.title}</span>
                    <span className="block text-[14px] text-muted">{n.body}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-10">
        <NotifySettings />
        <form action={saveNotifyKinds} className="border-t-2 border-ink pt-5">
          <p className="label-caps">What to notify me about</p>
          <div className="mt-4 space-y-3">
            {Object.entries(KINDS).map(([k, v]) => (
              <label key={k} className="flex items-center gap-3 text-[15px]"><input type="checkbox" name={`kind_${k}`} defaultChecked={!user.notifyMuted.includes(k)} /> {v.label}</label>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">{user.role === "STAFF" ? "As a stylist you're told about bookings, changes and cancellations for your own clients." : "Owners and managers get everything; stylists get their own bookings."}</p>
          <button className="btn-secondary btn-sm mt-4">Save</button>
        </form>
        {devices.length > 0 && (
          <section className="border-t-2 border-ink pt-5">
            <p className="label-caps">Devices getting your notifications</p>
            <ul className="mt-3">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 border-b border-ink/15 py-2 text-[14px]">
                  <span>{d.device ?? "Device"}<span className="block text-[12px] text-muted">since {fmtDateTime(d.createdAt, tz)}</span></span>
                  <form action={removeDevice.bind(null, d.id)}><button className="label-caps text-muted hover:text-ink">Remove</button></form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
