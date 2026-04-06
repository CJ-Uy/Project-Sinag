import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function POST(request) {
  const data = await request.json();
  const prisma = await getPrisma();
  const hiddenReport = await prisma.report.update({
    where: { id: data.id },
    data: { hidden: true },
  });
  return NextResponse.json(hiddenReport);
}
