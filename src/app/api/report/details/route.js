import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { report, reportImage } from "@/app/utils/schema";
import { eq } from "drizzle-orm";

export async function POST(request) {
  const { id } = await request.json();
  const db = await getDB();

  const [found] = await db.select().from(report).where(eq(report.id, id));
  if (!found) return NextResponse.json(null);

  const images = await db
    .select()
    .from(reportImage)
    .where(eq(reportImage.reportId, id));

  return NextResponse.json({ ...found, imageUrl: images.map((i) => i.url) });
}
