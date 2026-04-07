import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { report } from "@/app/utils/schema";
import { eq } from "drizzle-orm";

export async function POST(request) {
  const { id } = await request.json();
  const db = await getDB();
  const [updated] = await db
    .update(report)
    .set({ hidden: true })
    .where(eq(report.id, id))
    .returning();
  return NextResponse.json(updated);
}
