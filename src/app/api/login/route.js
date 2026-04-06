import { getPrisma } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { username, password } = await request.json();
  const prisma = await getPrisma();
  const user = await prisma.moderatorCredentials.findFirst({
    where: { username, password },
  });

  if (user) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false });
}
