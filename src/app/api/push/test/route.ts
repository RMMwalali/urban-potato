import { NextResponse } from "next/server";
import { apiUser } from "@/lib/api-user";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Sends a test notification to the signed-in person only (in the app and to their devices).
export async function POST() {
  const u = await apiUser();
  if (!u) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  await notify({ businessId: u.businessId, kind: "test", title: "Notifications are on", body: `This is how ${u.name.split(" ")[0]}'s alerts will look and sound.`, url: "/app/notifications", forUserId: u.id, onlyUser: true });
  return NextResponse.json({ ok: true });
}
