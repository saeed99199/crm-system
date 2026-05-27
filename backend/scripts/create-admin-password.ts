import { PrismaClient } from "@prisma/client";
import { auth } from "../src/auth";

const prisma = new PrismaClient();

async function createAdminWithPassword() {
  const adminEmail = "admin@crm.com";
  const adminName = "مدير النظام";
  const adminPassword = "admin123";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    // Check if account with password exists
    const account = await prisma.account.findFirst({
      where: {
        userId: existing.id,
        providerId: "credential",
      },
    });

    if (account) {
      console.log("✅ المستخدم الإداري موجود بالفعل مع كلمة مرور:");
      console.log(`   البريد: ${existing.email}`);
      console.log(`   الاسم: ${existing.name}`);
      console.log(`   الصلاحية: ${existing.role}`);
      return;
    }

    // Create credential account for existing user
    const hashedPassword = await Bun.password.hash(adminPassword);
    await prisma.account.create({
      data: {
        id: `account_${Date.now()}`,
        accountId: existing.id,
        providerId: "credential",
        userId: existing.id,
        password: hashedPassword,
      },
    });

    console.log("✅ تم إضافة كلمة مرور للمستخدم الإداري:");
    console.log(`   البريد: ${existing.email}`);
    console.log(`   كلمة المرور: ${adminPassword}`);
    return;
  }

  // Create new admin user with password using Better Auth signup
  try {
    // Create user first
    const userId = `admin_${Date.now()}`;
    const hashedPassword = await Bun.password.hash(adminPassword);

    const admin = await prisma.user.create({
      data: {
        id: userId,
        name: adminName,
        email: adminEmail,
        role: "admin",
        emailVerified: true,
      },
    });

    // Create credential account
    await prisma.account.create({
      data: {
        id: `account_${Date.now()}`,
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      },
    });

    console.log("🎉 تم إنشاء المستخدم الإداري بنجاح:");
    console.log(`   البريد: ${admin.email}`);
    console.log(`   الاسم: ${admin.name}`);
    console.log(`   كلمة المرور: ${adminPassword}`);
    console.log(`   الصلاحية: ${admin.role}`);
  } catch (error) {
    console.error("خطأ:", error);
  }
}

createAdminWithPassword()
  .catch((e) => {
    console.error("❌ فشل إنشاء المستخدم الإداري:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
