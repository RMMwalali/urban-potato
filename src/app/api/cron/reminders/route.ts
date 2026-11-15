import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/messaging";

// Call every 10-15 minutes from a scheduler (Vercel Cron, GitHub Actions, crontab):
//   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/reminders
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sent = await sendDueReminders();
  return NextResponse.json({ sent });
}
