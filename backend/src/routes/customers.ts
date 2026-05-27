import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateCustomerSchema, CustomerSchema } from "../types";
import { z } from "zod";

export const customersRouter = new Hono();

// Get all customers
customersRouter.get("/", async (c) => {
  const { type, search } = c.req.query();

  const where: any = {};

  if (type && type !== "all") {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
      { nationalId: { contains: search } },
      { commercialReg: { contains: search } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { requests: true },
      },
    },
  });

  return c.json({ data: customers });
});

// Get single customer
customersRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!customer) {
    return c.json({ error: { message: "العميل غير موجود" } }, 404);
  }

  return c.json({ data: customer });
});

// Create customer
customersRouter.post("/", zValidator("json", CreateCustomerSchema), async (c) => {
  const data = c.req.valid("json");

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      nationalId: data.nationalId || null,
      commercialReg: data.commercialReg || null,
      phone: data.phone,
      email: data.email || null,
      type: data.type,
      address: data.address || null,
      notes: data.notes || null,
    },
  });

  return c.json({ data: customer }, 201);
});

// Update customer
customersRouter.put("/:id", zValidator("json", CreateCustomerSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.nationalId !== undefined && { nationalId: data.nationalId || null }),
      ...(data.commercialReg !== undefined && { commercialReg: data.commercialReg || null }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.type && { type: data.type }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });

  return c.json({ data: customer });
});

// Delete customer
customersRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  await prisma.customer.delete({
    where: { id },
  });

  return c.body(null, 204);
});
