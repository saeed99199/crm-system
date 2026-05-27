import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateDocumentSchema } from "../types";

export const documentsRouter = new Hono();

// Get documents for a request
documentsRouter.get("/request/:requestId", async (c) => {
  const { requestId } = c.req.param();

  const documents = await prisma.document.findMany({
    where: { requestId },
    orderBy: { uploadedAt: "desc" },
  });

  return c.json({ data: documents });
});

// Upload document
documentsRouter.post("/", zValidator("json", CreateDocumentSchema), async (c) => {
  const data = c.req.valid("json");

  const document = await prisma.document.create({
    data: {
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || null,
      requestId: data.requestId,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "document_uploaded",
      description: `تم رفع مستند "${data.name}"`,
      entityType: "document",
      entityId: document.id,
      requestId: data.requestId,
    },
  });

  return c.json({ data: document }, 201);
});

// Delete document
documentsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const document = await prisma.document.findUnique({
    where: { id },
    select: { name: true, requestId: true },
  });

  if (!document) {
    return c.json({ error: { message: "المستند غير موجود" } }, 404);
  }

  await prisma.document.delete({
    where: { id },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "document_deleted",
      description: `تم حذف مستند "${document.name}"`,
      entityType: "document",
      entityId: id,
      requestId: document.requestId,
    },
  });

  return c.body(null, 204);
});
