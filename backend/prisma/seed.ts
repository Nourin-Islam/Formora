import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed topics
  const topics = [{ name: "Education" }, { name: "Quiz" }, { name: "Survey" }, { name: "Feedback" }, { name: "Other" }];

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { name: topic.name },
      update: {},
      create: topic,
    });
  }

  console.log("Database has been seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
