import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { key } = await params;
  const { env } = await getCloudflareContext({ async: true });

  const object = await env.BUCKET.get(key);

  if (!object) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new NextResponse(object.body, { headers });
}
