import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

async function createUser(id: string, name: string, email: string, password: string, role: string) {
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return;

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id,
      email,
      name,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role,
    },
  });

  await prisma.account.create({
    data: {
      id: `${id}-account`,
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ User created: ${email}`);
}

export async function seedAdminUser() {
  await createUser("admin-seed-001", "مدير النظام", "admin@crm.com", "Admin@2024", "admin");
  await createUser("saeed-seed-002", "saeed", "saeed@crm.com", "123456", "admin");
}
