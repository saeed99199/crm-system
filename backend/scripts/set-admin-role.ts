import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setAdminRole() {
  const user = await prisma.user.update({
    where: { email: "admin@crm.com" },
    data: { role: "admin", emailVerified: true },
  });
  console.log("✅ تم تحديث صلاحيات المستخدم الإداري:");
  console.log(`   البريد: ${user.email}`);
  console.log(`   الصلاحية: ${user.role}`);
}

setAdminRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
