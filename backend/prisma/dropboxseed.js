// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.dropboxToken.findFirst();
  if (!existing) {
    await prisma.dropboxToken.create({
      data: {
        accessToken: "asdrt",
        refreshToken: "sdrt6ert",
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      },
    });
    console.log("Dropbox token seeded.");
  } else {
    console.log("Dropbox token already exists. Skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
