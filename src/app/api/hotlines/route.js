import { NextResponse } from "next/server";

export async function POST(request) {
  const { lat, lon } = await request.json();

  const geonamesResponse = await fetch(
    `https://api.geonames.org/countryCodeJSON?lat=${lat}&lng=${lon}&username=${process.env.GEONAMES_USERNAME}`
  );
  const geonamesData = await geonamesResponse.json();
  const countryCode = geonamesData.countryCode;

  const response = await fetch(
    `https://emergencynumberapi.com/api/country/${countryCode}`
  );

  return NextResponse.json(await response.json());
}
