import { prisma } from "../src/prisma";
import bcrypt from "bcryptjs";

async function resetAdmin() {
  const newPassword = "Admin@123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update admin user role
  await prisma.user.update({
    where: { email: "admin@crm.com" },
    data: { role: "admin" }
  });
  
  // Update password in Account table
  await prisma.account.updateMany({
    where: {
      user: { email: "admin@crm.com" },
      providerId: "credential"
    },
    data: { password: hashedPassword }
  });
  
  console.log("Admin user updated!");
  console.log("Email: admin@crm.com");
  console.log("Password: " + newPassword);
  console.log("Role: admin (full permissions)");
}

resetAdmin().then(() => process.exit(0));
