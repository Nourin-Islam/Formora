// src/test.ts
import { prisma } from "./lib/prisma.js";

async function testPrisma() {
  // Test database connection and queries
  const topicsCount = await prisma.topic.count();
  console.log(`Database connection successful. Found ${topicsCount} topics.`);

  // List all topics
  const topics = await prisma.topic.findMany();
  console.log("Topics:", topics);

  // Close connection
  await prisma.$disconnect();
}

testPrisma().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
