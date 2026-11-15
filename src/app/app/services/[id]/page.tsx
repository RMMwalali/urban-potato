import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MANAGERS, requireUser } from "@/lib/auth";
import { num } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { PageHeader } from "@/components/ui";
import { ServiceEditor, type EditorService } from "@/components/ServiceEditor";

export const metadata = { title: "Service" };

export default async function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(MANAGERS);
  const b = user.business;
  const cats = await db.service.findMany({ where: { businessId: b.id }, select: { category: true }, distinct: ["category"] });
  const media = { select: { id: true, alt: true, mime: true }, orderBy: { position: "asc" as const } };
  let service: EditorService = { name: "", category: cats[0]?.category ?? "Hair", description: "", durationMin: 60, price: "", onlineBooking: true, photos: [], styles: [] };
  if (id !== "new") {
    const s = await db.service.findFirst({
      where: { id, businessId: b.id },
      include: { media: { where: { styleId: null }, ...media }, styles: { orderBy: { position: "asc" }, include: { media } } },
    });
    if (!s) notFound();
    const pic = (m: { id: string; alt: string; mime: string }) => ({ id: m.id, url: mediaUrl(m, "thumb") });
    service = {
      id: s.id, name: s.name, category: s.category, description: s.description ?? "", durationMin: s.durationMin, price: num(s.price), onlineBooking: s.onlineBooking,
      photos: s.media.map(pic),
      styles: s.styles.map((st) => ({ id: st.id, name: st.name, price: st.price == null ? "" : num(st.price), durationMin: st.durationMin ?? "", photos: st.media.map(pic) })),
    };
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title={id === "new" ? "New service" : service.name} label="Services" />
      <ServiceEditor service={service} categories={cats.map((c) => c.category)} currency={b.currency} />
    </div>
  );
}
