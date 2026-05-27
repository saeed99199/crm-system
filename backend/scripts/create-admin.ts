import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdmin() {
  const adminEmail = "admin@crm.com";
  const adminName = "مدير النظام";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log("✅ المستخدم الإداري موجود بالفعل:");
    console.log(`   البريد: ${existing.email}`);
    console.log(`   الاسم: ${existing.name}`);
    console.log(`   الصلاحية: ${existing.role}`);
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      id: `admin_${Date.now()}`,
      name: adminName,
      email: adminEmail,
      role: "admin",
      emailVerified: true,
    },
  });

  console.log("🎉 تم إنشاء المستخدم الإداري بنجاح:");
  console.log(`   البريد: ${admin.email}`);
  console.log(`   الاسم: ${admin.name}`);
  console.log(`   الصلاحية: ${admin.role}`);
}

createAdmin()
  .catch((e) => {
    console.error("❌ فشل إنشاء المستخدم الإداري:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
