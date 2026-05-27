import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

export const customerDocumentsRouter = new Hono();

const CreateCustomerDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["national_id", "commercial_reg", "salary_cert", "bank_statement", "other"]),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  customerId: z.string(),
});

// Get documents for a customer
customerDocumentsRouter.get("/customer/:customerId", async (c) => {
  const { customerId } = c.req.param();

  const documents = await prisma.customerDocument.findMany({
    where: { customerId },
    orderBy: { uploadedAt: "desc" },
  });

  return c.json({ data: documents });
});

// Create customer document
customerDocumentsRouter.post("/", zValidator("json", CreateCustomerDocumentSchema), async (c) => {
  const data = c.req.valid("json");

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { name: true },
  });

  if (!customer) {
    return c.json({ error: { message: "العميل غير موجود" } }, 404);
  }

  const document = await prisma.customerDocument.create({
    data: {
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || null,
      customerId: data.customerId,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "customer_document_uploaded",
      description: `تم رفع مستند "${data.name}" للعميل ${customer.name}`,
      entityType: "customer_document",
      entityId: document.id,
    },
  });

  return c.json({ data: document }, 201);
});

// Delete customer document
customerDocumentsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const document = await prisma.customerDocument.findUnique({
    where: { id },
    select: { name: true, customerId: true },
  });

  if (!document) {
    return c.json({ error: { message: "المستند غير موجود" } }, 404);
  }

  await prisma.customerDocument.delete({
    where: { id },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "customer_document_deleted",
      description: `تم حذف مستند "${document.name}"`,
      entityType: "customer_document",
      entityId: id,
    },
  });

  return c.body(null, 204);
});
