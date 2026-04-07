import { getCloudflareContext } from "@opennextjs/cloudflare";
import MapPage from "@/components/mapPage";

export default async function Home() {
  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_API ?? "";
  let mapId =
    process.env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID_RETRO ??
    process.env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID ??
    "";

  try {
    const { env } = await getCloudflareContext({ async: true });
    apiKey = env.NEXT_PUBLIC_GOOGLE_API ?? apiKey;
    mapId =
      env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID_RETRO ??
      env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID ??
      mapId;
  } catch {
    // running in local dev without Cloudflare context — .env fallback above is used
  }

  return <MapPage apiKey={apiKey} mapId={mapId} />;
}
