import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { seedAdminUser } from "./seed";
import { customersRouter } from "./routes/customers";
import { requestsRouter } from "./routes/requests";
import { contractsRouter } from "./routes/contracts";
import { dashboardRouter } from "./routes/dashboard";
import { employeesRouter } from "./routes/employees";
import { documentsRouter } from "./routes/documents";
import { entitiesRouter } from "./routes/entities";
import { customerDocumentsRouter } from "./routes/customer-documents";
import { getPermissions, type Role } from "./permissions";

// Create admin user if not exists
seedAdminUser().catch(console.error);

// Type the Hono app with user/session variables
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
  /^https:\/\/mytype\.vip$/,
  /^https:\/\/www\.mytype\.vip$/,
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth middleware - populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Mount auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/api/health", (c) => c.json({ status: "ok" }));

// File upload endpoint (disabled in production - no storage configured)
app.post("/api/upload", async (c) => {
  return c.json({ error: "File upload not configured" }, 501);
});

// Get current user
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ data: user });
});

// Get current user permissions
app.get("/api/me/permissions", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);

  const role = (user as { role?: string }).role || "viewer";
  const hiddenPages = (user as { hiddenPages?: string }).hiddenPages || "";
  const permissions = getPermissions(role as Role);

  return c.json({ data: { role, permissions, hiddenPages } });
});

// API Routes
app.route("/api/customers", customersRouter);
app.route("/api/requests", requestsRouter);
app.route("/api/contracts", contractsRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/employees", employeesRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/entities", entitiesRouter);
app.route("/api/customer-documents", customerDocumentsRouter);

const port = Number(process.env.PORT) || 3000;

// Support both Bun and Node.js
if (typeof globalThis.Bun === "undefined") {
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`);
  });
}

export default {
  port,
  fetch: app.fetch,
};
