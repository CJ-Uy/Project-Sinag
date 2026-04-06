import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request) {
  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.NEXT_PUBLIC_GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_API;

  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const { lat, lon, timeOfReport, description } = data;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${apiKey}`
  );
  const cityData = await response.json();

  const prisma = await getPrisma();

  const report = await prisma.report.create({
    data: {
      lat: Number.parseFloat(lat),
      lon: Number.parseFloat(lon),
      description,
      timeOfReport,
      location: cityData?.results[1]?.formatted_address || "Location not found",
    },
  });

  const files = formData.getAll("files");
  for (const file of files) {
    const originalExtension = file.name.split(".").pop();
    const key = `${report.id}.${originalExtension}`;
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    const publicUrl = `/api/files/${key}`;
    await prisma.reportImage.create({
      data: { url: publicUrl, reportId: report.id },
    });
  }

  return NextResponse.json({ State: "Success" });
}
