import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "viewer",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      // Custom hash function using bcrypt
      hash: async (password: string) => {
        return bcrypt.hash(password, 10);
      },
      // Custom verify function to handle bcrypt hashes
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        if (!hash) return false;

        // Handle bcrypt hashes ($2a$, $2b$, $2y$)
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
          try {
            // Normalize $2y$ (PHP) to $2b$ for Node.js compatibility
            const normalizedHash = hash.startsWith('$2y$')
              ? '$2b$' + hash.slice(4)
              : hash;
            return bcrypt.compare(password, normalizedHash);
          } catch {
            return false;
          }
        }

        // For scrypt or unknown formats, return false
        return false;
      },
    },
  },
  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false,
    },
  },
});
