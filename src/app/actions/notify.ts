"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { KINDS } from "@/lib/notify";

export async function saveNotifyKinds(fd: FormData) {
  const user = await requireUser(undefined, { allowLocked: true });
  const muted = Object.keys(KINDS).filter((k) => fd.get(`kind_${k}`) !== "on");
  await db.user.update({ where: { id: user.id }, data: { notifyMuted: muted } });
  revalidatePath("/app/notifications");
}

export async function removeDevice(id: string) {
  const user = await requireUser(undefined, { allowLocked: true });
  await db.pushSubscription.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/notifications");
}
