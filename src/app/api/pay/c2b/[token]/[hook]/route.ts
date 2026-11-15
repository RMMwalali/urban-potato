import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordC2B } from "@/lib/mpesa";

// Safaricom C2B callbacks for one salon: /api/pay/c2b/<secret token>/(validate|confirm)
export async function POST(req: Request, { params }: { params: Promise<{ token: string; hook: string }> }) {
  const { token, hook } = await params;
  const business = await db.business.findUnique({ where: { c2bToken: token }, select: { id: true } });
  if (!business) return NextResponse.json({ ResultCode: "C2B00012", ResultDesc: "Rejected" }, { status: 404 });
  if (hook === "validate") return NextResponse.json({ ResultCode: "0", ResultDesc: "Accepted" });
  if (hook !== "confirm") return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    await recordC2B(business.id, await req.json());
  } catch (e) {
    console.error("C2B confirmation error", e);
  }
  // Always acknowledge so Safaricom doesn't keep retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
