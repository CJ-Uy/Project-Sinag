import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

let prisma: PrismaClient | null = null;

export async function getPrisma() {
  if (prisma) return prisma;

  const { env } = await getCloudflareContext({ async: true });
  
  if (!env.DB) {
    throw new Error("DB binding not found in environment.");
  }

  const adapter = new PrismaD1(env.DB as any);
  prisma = new PrismaClient({ adapter });
  return prisma;
}
