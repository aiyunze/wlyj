import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { getCached } from "../../../lib/kv";

export async function GET() {
  try {
    const announcement = await getCached<any>("front:active_announcement", 60, async () => {
      const db = await getDb();
      const row = (await db.prepare("SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").get()) as any;
      return row || null;
    });
    return NextResponse.json({ announcement });
  } catch (err: any) {
    return NextResponse.json({ announcement: null }, { status: 500 });
  }
}