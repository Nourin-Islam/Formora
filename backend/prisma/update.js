import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Update the clerkId for the user with this email
  const email = "shaonback6@gmail.com";
  const clerkId = "user_2vPLf1SvgRWsrVYQrpCL7aXxFzI";

  const updatedUser = await prisma.user.updateMany({
    where: { email },
    data: { clerkId },
  });

  if (updatedUser.count > 0) {
    console.log(`✅ Updated clerkId for user with email ${email}`);
  } else {
    console.log(`⚠️ No user found with email ${email}`);
  }

  console.log("✅ Database has been seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
