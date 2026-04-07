import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { report, reportImage } from "@/app/utils/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function uuid() {
  return crypto.randomUUID();
}

export async function POST(request) {
  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.NEXT_PUBLIC_GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_API;

  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const { lat, lon, timeOfReport, description } = data;

  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${apiKey}`
  );
  const cityData = await geocodeResponse.json();

  const db = await getDB();
  const reportId = uuid();

  await db.insert(report).values({
    id: reportId,
    lat: Number.parseFloat(lat),
    lon: Number.parseFloat(lon),
    description,
    timeOfReport,
    location: cityData?.results[1]?.formatted_address || "Location not found",
  });

  const files = formData.getAll("files");
  for (const file of files) {
    const originalExtension = file.name.split(".").pop();
    const key = `${reportId}.${originalExtension}`;
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    await db.insert(reportImage).values({
      id: uuid(),
      url: `/api/files/${key}`,
      reportId,
    });
  }

  return NextResponse.json({ State: "Success" });
}
