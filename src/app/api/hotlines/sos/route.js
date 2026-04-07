import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { report, reportImage } from "@/app/utils/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

export async function POST(request) {
  const data = await request.json();
  const { lat, lon } = data;

  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.NEXT_PUBLIC_GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_API;

  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${apiKey}`
  );
  const cityData = await geocodeResponse.json();

  const db = await getDB();
  const sosId = crypto.randomUUID();

  await db.insert(report).values({
    id: sosId,
    lat: Number.parseFloat(lat),
    lon: Number.parseFloat(lon),
    description: "EMERGENCY SOS",
    location: cityData?.results[1]?.formatted_address || "Location not found",
  });

  await db.insert(reportImage).values({
    id: crypto.randomUUID(),
    url: "/sos.gif",
    reportId: sosId,
  });

  const [sos] = await db.select().from(report).where(eq(report.id, sosId));
  const images = await db
    .select()
    .from(reportImage)
    .where(eq(reportImage.reportId, sosId));

  return NextResponse.json({ ...sos, imageUrl: images.map((i) => i.url) });
}
