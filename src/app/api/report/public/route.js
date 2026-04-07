import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { report, reportImage } from "@/app/utils/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = await getDB();
  const reports = await db
    .select()
    .from(report)
    .where(eq(report.hidden, false));

  const images = await db.select().from(reportImage);
  const imagesByReport = images.reduce((acc, img) => {
    if (!acc[img.reportId]) acc[img.reportId] = [];
    acc[img.reportId].push(img.url);
    return acc;
  }, {});

  return NextResponse.json(
    reports.map((r) => ({ ...r, imageUrl: imagesByReport[r.id] ?? [] }))
  );
}
