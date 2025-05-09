import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function assignTokensToExistingUsers() {
  const usersWithoutToken = await prisma.user.findMany({
    where: { apiToken: null },
    select: { id: true },
  });

  console.log(`Found ${usersWithoutToken.length} users without apiToken.`);

  for (const user of usersWithoutToken) {
    const newToken = randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: { apiToken: newToken },
    });

    console.log(`Assigned token to user ${user.id}`);
  }

  console.log("All users have apiTokens now.");
  await prisma.$disconnect();
}

assignTokensToExistingUsers().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
