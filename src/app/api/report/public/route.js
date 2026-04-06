import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function GET() {
  const prisma = await getPrisma();
  return NextResponse.json(await prisma.report.findMany({
    where: { hidden: false },
    include: { images: true },
  }));
}