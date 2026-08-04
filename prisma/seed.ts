import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENT_DEFS } from "../src/lib/gamification";

const prisma = new PrismaClient();

async function main() {
  for (const def of ACHIEVEMENT_DEFS) {
    await prisma.achievement.upsert({
      where: { key: def.key },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
        coinReward: def.coinReward,
        sortOrder: def.sortOrder,
      },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
        coinReward: def.coinReward,
        sortOrder: def.sortOrder,
      },
    });
  }
  console.log(`Seeded ${ACHIEVEMENT_DEFS.length} achievements.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
