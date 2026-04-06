import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function POST(request) {
  const data = await request.json();
  const prisma = await getPrisma();
  return NextResponse.json(await prisma.report.findFirst({
    where: { id: data.id },
    include: { images: true },
  }));
}
