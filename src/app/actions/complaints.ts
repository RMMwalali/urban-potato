"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { appUrl } from "@/lib/url";
import { COMPLAINT_CATEGORIES, complaintRef } from "@/lib/complaints";
import { complaintsInbox } from "@/lib/complaints-inbox";

export type ComplaintState = { error?: string; done?: { ref: string; replied: boolean; email: string } } | undefined;

const C = z.object({
  category: z.enum(COMPLAINT_CATEGORIES.map((c) => c.id) as [string, ...string[]], { message: "Choose what it's about" }),
  subject: z.string().trim().min(3, "Add a short subject").max(120),
  message: z.string().trim().min(15, "Tell us a little more (at least a sentence)").max(4000),
  phone: z.string().trim().max(30).optional(),
});

/** Any signed-in user (owner, manager or staff) can send one, even when the salon's plan has lapsed. */
export async function submitComplaint(_: ComplaintState, fd: FormData): Promise<ComplaintState> {
  const user = await requireUser(undefined, { allowLocked: true });
  const p = C.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  // a simple brake on accidental repeats and abuse: 5 an hour per person
  const recent = await db.complaint.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= 5) return { error: "You've sent several in the last hour. Please wait a little, or reply to one of our emails." };

  const b = user.business;
  // saved first, so nothing is lost if email fails
  const c = await db.complaint.create({
    data: { businessId: b.id, userId: user.id, name: user.name, email: user.email, phone: p.data.phone || user.phone || null, category: p.data.category, subject: p.data.subject, message: p.data.message },
  });
  const ref = complaintRef(c.number);
  const label = COMPLAINT_CATEGORIES.find((x) => x.id === c.category)?.label ?? c.category;
  const inbox = await complaintsInbox();
  const { sendMail } = await import("@/lib/mail");

  // 1. to the team, ready to answer: replying goes straight to the person who wrote
  const team = await sendMail({
    to: inbox,
    replyTo: user.email,
    subject: `[${ref}] ${label}: ${c.subject} (${b.name})`,
    text: [
      `New complaint ${ref}`,
      ``,
      `Salon:    ${b.name}${b.city ? `, ${b.city}` : ""}`,
      `From:     ${user.name} (${user.role.toLowerCase()})`,
      `Email:    ${user.email}`,
      `Phone:    ${c.phone ?? "-"}`,
      `Plan:     ${b.plan ?? "-"} · ${b.status.toLowerCase()}`,
      `About:    ${label}`,
      `Subject:  ${c.subject}`,
      ``,
      c.message,
      ``,
      `—`,
      `Reply to this email to answer ${user.name.split(" ")[0]} directly.`,
      `Track it: ${appUrl()}/admin/complaints/${c.id}`,
    ].join("\n"),
  });

  // 2. the automatic reply to the person who wrote
  const first = user.name.split(" ")[0];
  const reply = await sendMail({
    to: user.email,
    replyTo: inbox,
    subject: `We've received your complaint (${ref})`,
    text: [
      `Hi ${first},`,
      ``,
      `Thank you for telling us. We take complaints seriously, and yours has reached the Darling HQ team. Someone will read it and get back to you as soon as possible.`,
      ``,
      `Your reference: ${ref}`,
      `About: ${label}`,
      `Subject: ${c.subject}`,
      ``,
      `What you wrote:`,
      c.message,
      ``,
      `If there's anything to add, just reply to this email and keep the reference in the subject.`,
      ``,
      `The Darling HQ team`,
    ].join("\n"),
  });

  const errors = [!team.ok && `team: ${team.error}`, !reply.ok && `reply: ${reply.error}`].filter(Boolean).join(" · ");
  await db.complaint.update({ where: { id: c.id }, data: { emailedAt: team.ok ? new Date() : null, repliedAt: reply.ok ? new Date() : null, emailError: errors || null } });
  const { notifyAdmins } = await import("@/lib/admin-notify");
  await notifyAdmins(`New complaint ${ref} from ${b.name}: ${c.subject}`);
  revalidatePath("/admin/complaints");
  revalidatePath("/app/complaints");
  return { done: { ref, replied: reply.ok, email: user.email } };
}

/* ---------- platform admin ---------- */

export async function setComplaintStatus(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED") {
  await requireAdmin();
  await db.complaint.update({ where: { id }, data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null } });
  revalidatePath("/admin/complaints");
  revalidatePath(`/admin/complaints/${id}`);
}

/** Send the team email and the automatic reply again (e.g. after setting up email). */
export async function resendComplaint(id: string) {
  await requireAdmin();
  const c = await db.complaint.findUnique({ where: { id }, include: { business: true } });
  if (!c) return;
  const { sendMail } = await import("@/lib/mail");
  const ref = complaintRef(c.number), inbox = await complaintsInbox();
  const label = COMPLAINT_CATEGORIES.find((x) => x.id === c.category)?.label ?? c.category;
  const team = c.emailedAt ? { ok: true as const } : await sendMail({ to: inbox, replyTo: c.email, subject: `[${ref}] ${label}: ${c.subject} (${c.business.name})`, text: `${c.name} <${c.email}> · ${c.business.name}\n\n${c.message}\n\n${appUrl()}/admin/complaints/${c.id}` });
  const reply = c.repliedAt ? { ok: true as const } : await sendMail({ to: c.email, replyTo: inbox, subject: `We've received your complaint (${ref})`, text: `Hi ${c.name.split(" ")[0]},\n\nThank you for telling us. We take complaints seriously, and yours has reached the Darling HQ team. Someone will read it and get back to you as soon as possible.\n\nYour reference: ${ref}\nSubject: ${c.subject}\n\nIf there's anything to add, just reply to this email.\n\nThe Darling HQ team` });
  const errors = [!team.ok && `team: ${"error" in team ? team.error : ""}`, !reply.ok && `reply: ${"error" in reply ? reply.error : ""}`].filter(Boolean).join(" · ");
  await db.complaint.update({ where: { id }, data: { emailedAt: c.emailedAt ?? (team.ok ? new Date() : null), repliedAt: c.repliedAt ?? (reply.ok ? new Date() : null), emailError: errors || null } });
  revalidatePath(`/admin/complaints/${id}`);
  revalidatePath("/admin/complaints");
}

export async function saveComplaintsInbox(fd: FormData) {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) redirect("/admin/complaints?error=email");
  await db.platformSetting.upsert({ where: { key: "complaints" }, update: { value: { email } }, create: { key: "complaints", value: { email } } });
  redirect("/admin/complaints?saved=1");
}
