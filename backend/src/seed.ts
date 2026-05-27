import { prisma } from "./prisma";
import { auth } from "./auth";

async function createUser(name: string, email: string, password: string, role: string) {
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log(`⏭ User already exists: ${email}`);
    return;
  }

  await auth.api.signUpEmail({
    body: { name, email, password },
  });

  await prisma.user.update({
    where: { email },
    data: { role },
  });

  console.log(`✅ User created: ${email}`);
}

export async function seedAdminUser() {
  await createUser("مدير النظام", "admin@crm.com", "Admin@2024", "admin");
  await createUser("saeed", "saeed@crm.com", "Admin@2024", "admin");
}
