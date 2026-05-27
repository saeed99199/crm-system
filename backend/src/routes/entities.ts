import { Hono } from "hono";
import { prisma } from "../prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const entitiesRouter = new Hono();

const CreateEntitySchema = z.object({
  name: z.string().min(1, "اسم الجهة مطلوب"),
  type: z.enum(["bank", "finance_company", "government"]),
  logo: z.string().optional(),
  contactInfo: z.string().optional(),
});

// Get all financing entities
entitiesRouter.get("/", async (c) => {
  const { type, active } = c.req.query();

  const where: any = {};

  if (type && type !== "all") {
    where.type = type;
  }

  if (active === "true") {
    where.isActive = true;
  }

  const entities = await prisma.financingEntity.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return c.json({ data: entities });
});

// Create financing entity
entitiesRouter.post("/", zValidator("json", CreateEntitySchema), async (c) => {
  const data = c.req.valid("json");

  const entity = await prisma.financingEntity.create({
    data: {
      name: data.name,
      type: data.type,
      logo: data.logo || null,
      contactInfo: data.contactInfo || null,
    },
  });

  return c.json({ data: entity }, 201);
});

// Update financing entity
entitiesRouter.put("/:id", zValidator("json", CreateEntitySchema.partial()), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const entity = await prisma.financingEntity.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.logo !== undefined && { logo: data.logo || null }),
      ...(data.contactInfo !== undefined && { contactInfo: data.contactInfo || null }),
    },
  });

  return c.json({ data: entity });
});

// Toggle entity active status
entitiesRouter.patch("/:id/toggle", async (c) => {
  const { id } = c.req.param();

  const current = await prisma.financingEntity.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!current) {
    return c.json({ error: { message: "الجهة غير موجودة" } }, 404);
  }

  const entity = await prisma.financingEntity.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  return c.json({ data: entity });
});

// Delete financing entity
entitiesRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  await prisma.financingEntity.delete({
    where: { id },
  });

  return c.body(null, 204);
});
