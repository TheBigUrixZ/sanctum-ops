import { prisma } from "@/lib/prisma";

export async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}
