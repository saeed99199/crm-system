import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateFinancingRequestSchema, UpdateRequestStatusSchema } from "../types";
import { z } from "zod";

export const requestsRouter = new Hono();

// Generate request number
function generateRequestNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `REQ-${year}${month}-${random}`;
}

// Get all requests with filters
requestsRouter.get("/", async (c) => {
  const { status, type, entity, search, customerId, assignedTo } = c.req.query();

  const where: any = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (type && type !== "all") {
    where.financingType = type;
  }

  if (entity && entity !== "all") {
    where.financingEntity = entity;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (assignedTo) {
    where.assignedEmployeeId = assignedTo;
  }

  if (search) {
    where.OR = [
      { requestNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const requests = await prisma.financingRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, type: true },
      },
      assignedEmployee: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { documents: true },
      },
    },
  });

  return c.json({ data: requests });
});

// Get single request with full details
requestsRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const request = await prisma.financingRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedEmployee: {
        select: { id: true, name: true, email: true, role: true },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      contract: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!request) {
    return c.json({ error: { message: "الطلب غير موجود" } }, 404);
  }

  return c.json({ data: request });
});

// Create request
requestsRouter.post("/", zValidator("json", CreateFinancingRequestSchema), async (c) => {
  const data = c.req.valid("json");

  const requestNumber = generateRequestNumber();

  const request = await prisma.financingRequest.create({
    data: {
      requestNumber,
      customerId: data.customerId,
      financingType: data.financingType,
      requestedAmount: data.requestedAmount,
      financingEntity: data.financingEntity || null,
      assignedEmployeeId: data.assignedEmployeeId || null,
      internalNotes: data.internalNotes || null,
      status: "new",
    },
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "created",
      description: `تم إنشاء طلب تمويل جديد برقم ${requestNumber}`,
      entityType: "request",
      entityId: request.id,
      requestId: request.id,
    },
  });

  return c.json({ data: request }, 201);
});

// Update request status
requestsRouter.patch("/:id/status", zValidator("json", UpdateRequestStatusSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const updateData: any = {
    status: data.status,
  };

  if (data.approvedAmount !== undefined) {
    updateData.approvedAmount = data.approvedAmount;
  }

  if (data.rejectionReason) {
    updateData.rejectionReason = data.rejectionReason;
  }

  if (data.internalNotes) {
    updateData.internalNotes = data.internalNotes;
  }

  // Set dates based on status
  if (data.status === "approved") {
    updateData.approvalDate = new Date();
  }

  if (data.status === "completed") {
    updateData.completionDate = new Date();
  }

  const request = await prisma.financingRequest.update({
    where: { id },
    data: updateData,
  });

  // Log activity
  const statusLabels: Record<string, string> = {
    new: "جديد",
    under_review: "قيد المراجعة",
    documents_required: "مطلوب مستندات",
    approved: "موافق عليه",
    rejected: "مرفوض",
    completed: "مكتمل",
  };

  await prisma.activityLog.create({
    data: {
      action: "status_changed",
      description: `تم تغيير حالة الطلب إلى "${statusLabels[data.status]}"`,
      entityType: "request",
      entityId: id,
      requestId: id,
    },
  });

  return c.json({ data: request });
});

// Update request
requestsRouter.put("/:id", zValidator("json", CreateFinancingRequestSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const request = await prisma.financingRequest.update({
    where: { id },
    data: {
      ...(data.financingType && { financingType: data.financingType }),
      ...(data.requestedAmount && { requestedAmount: data.requestedAmount }),
      ...(data.financingEntity !== undefined && { financingEntity: data.financingEntity || null }),
      ...(data.assignedEmployeeId !== undefined && { assignedEmployeeId: data.assignedEmployeeId || null }),
      ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes || null }),
    },
  });

  return c.json({ data: request });
});

// Delete request
requestsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  await prisma.financingRequest.delete({
    where: { id },
  });

  return c.body(null, 204);
});
