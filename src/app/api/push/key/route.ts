import { NextResponse } from "next/server";
import { vapidKeys } from "@/lib/notify";
import { apiUser } from "@/lib/api-user";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await apiUser())) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  return NextResponse.json({ publicKey: (await vapidKeys()).publicKey });
}
