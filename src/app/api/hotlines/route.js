import { NextResponse } from "next/server";

export async function POST(request) {
  const { lat, lon } = await request.json();

  const nominatimResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { headers: { "User-Agent": "project-sinag/1.0" } }
  );
  const nominatimData = await nominatimResponse.json();
  const countryCode = nominatimData.address?.country_code?.toUpperCase();

  if (!countryCode) {
    return NextResponse.json({ error: "Could not determine country" }, { status: 400 });
  }

  const response = await fetch(
    `https://emergencynumberapi.com/api/country/${countryCode}`
  );

  return NextResponse.json(await response.json());
}
