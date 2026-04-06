import { getPrisma } from "@/app/utils/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  const { lat, lon } = data;

  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.NEXT_PUBLIC_GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_API;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${apiKey}`
  );
  const cityData = await response.json();

  const prisma = await getPrisma();
  const sos = await prisma.report.create({
    data: {
      lat: Number.parseFloat(data.lat),
      lon: Number.parseFloat(data.lon),
      description: "EMERGENCY SOS",
      location: cityData?.results[1]?.formatted_address || "Location not found",
    },
  });

  await prisma.reportImage.create({
    data: {
      url: `/api/files/SOS.gif`,
      reportId: sos.id,
    },
  });

  return NextResponse.json(
    await prisma.report.findFirst({
      where: { id: sos.id },
      include: { images: true },
    })
  );
}
