import { NextResponse } from "next/server";
import { getDB } from "@/app/utils/db";
import { moderatorCredentials } from "@/app/utils/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request) {
  const { username, password } = await request.json();
  const db = await getDB();
  const [user] = await db
    .select()
    .from(moderatorCredentials)
    .where(
      and(
        eq(moderatorCredentials.username, username),
        eq(moderatorCredentials.password, password)
      )
    );
  return NextResponse.json({ valid: !!user });
}
