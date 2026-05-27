import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAdmin() {
  // Delete existing admin account and user to recreate properly
  const existing = await prisma.user.findUnique({
    where: { email: "admin@crm.com" },
  });

  if (existing) {
    // Delete accounts first
    await prisma.account.deleteMany({
      where: { userId: existing.id },
    });
    // Delete sessions
    await prisma.session.deleteMany({
      where: { userId: existing.id },
    });
    // Delete user
    await prisma.user.delete({
      where: { id: existing.id },
    });
    console.log("تم حذف المستخدم القديم");
  }

  console.log("جاهز لإنشاء مستخدم جديد عبر API");
}

fixAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
