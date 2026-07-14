import { getDb } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    const letters = await db
      .prepare(
        `SELECT l.*, e.name as config_name
         FROM letters l
         LEFT JOIN email_configs e ON l.email_config_id = e.id
         ORDER BY l.created_at DESC`
      )
      .all();

    return NextResponse.json({ letters });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
