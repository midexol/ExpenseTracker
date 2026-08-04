import { prisma } from "./prisma";
import { getSessionUserId } from "./session";

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
