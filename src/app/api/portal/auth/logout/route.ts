import { NextResponse } from "next/server";
import { destroySession } from "@/lib/portal/auth-server";

export const runtime = "nodejs";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true, data: null, error: null });
}
