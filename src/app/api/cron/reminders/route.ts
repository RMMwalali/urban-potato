import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/messaging";

// Call every 10-15 minutes from a scheduler (Vercel Cron, GitHub Actions, crontab):
//   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/reminders
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sent = await sendDueReminders();
  return NextResponse.json({ sent });
}
