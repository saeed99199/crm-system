import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixPasswords() {
  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${users.length} users to update`);

  for (const user of users) {
    // Check if they have a credential account
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
    });

    // Default password based on email
    const defaultPassword = user.email === "admin@crm.com" ? "admin123" : "123123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
      console.log(`Updated password for ${user.email} (password: ${defaultPassword})`);
    } else {
      const accountId = `account_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.account.create({
        data: {
          id: accountId,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
        },
      });
      console.log(`Created account for ${user.email} (password: ${defaultPassword})`);
    }
  }

  console.log("\nDone! All passwords have been reset.");
}

fixPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
