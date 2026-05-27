import { seedAdminUser } from "./seed";

seedAdminUser()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });
