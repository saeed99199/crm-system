import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateContractSchema } from "../types";

export const contractsRouter = new Hono();

// Generate contract number
function generateContractNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `CON-${year}-${random}`;
}

// Get all contracts
contractsRouter.get("/", async (c) => {
  const { status, search } = c.req.query();

  const where: any = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { contractNumber: { contains: search } },
      { customer: { name: { contains: search } } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      request: {
        select: { id: true, requestNumber: true, financingType: true },
      },
    },
  });

  return c.json({ data: contracts });
});

// Get single contract
contractsRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      customer: true,
      request: true,
    },
  });

  if (!contract) {
    return c.json({ error: { message: "العقد غير موجود" } }, 404);
  }

  return c.json({ data: contract });
});

// Create contract from request
contractsRouter.post("/", zValidator("json", CreateContractSchema), async (c) => {
  const data = c.req.valid("json");

  // Get request to get customer info
  const request = await prisma.financingRequest.findUnique({
    where: { id: data.requestId },
    select: { customerId: true, requestNumber: true },
  });

  if (!request) {
    return c.json({ error: { message: "الطلب غير موجود" } }, 404);
  }

  // Check if contract already exists for this request
  const existingContract = await prisma.contract.findUnique({
    where: { requestId: data.requestId },
  });

  if (existingContract) {
    return c.json({ error: { message: "يوجد عقد مسبق لهذا الطلب" } }, 400);
  }

  const contractNumber = generateContractNumber();

  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      customerId: request.customerId,
      requestId: data.requestId,
      amount: data.amount,
      interestRate: data.interestRate || null,
      duration: data.duration,
      monthlyPayment: data.monthlyPayment || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: "draft",
    },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      request: {
        select: { id: true, requestNumber: true },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "contract_created",
      description: `تم إنشاء عقد جديد برقم ${contractNumber}`,
      entityType: "contract",
      entityId: contract.id,
      requestId: data.requestId,
    },
  });

  return c.json({ data: contract }, 201);
});

// Update contract
contractsRouter.put("/:id", zValidator("json", CreateContractSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      ...(data.amount && { amount: data.amount }),
      ...(data.interestRate !== undefined && { interestRate: data.interestRate || null }),
      ...(data.duration && { duration: data.duration }),
      ...(data.monthlyPayment !== undefined && { monthlyPayment: data.monthlyPayment || null }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });

  return c.json({ data: contract });
});

// Update contract status
contractsRouter.patch("/:id/status", async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();

  const updateData: any = { status };

  if (status === "signed") {
    updateData.signedAt = new Date();
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: updateData,
  });

  // Log activity
  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    pending_signature: "بانتظار التوقيع",
    signed: "موقع",
    active: "نشط",
    completed: "مكتمل",
  };

  await prisma.activityLog.create({
    data: {
      action: "contract_status_changed",
      description: `تم تغيير حالة العقد إلى "${statusLabels[status]}"`,
      entityType: "contract",
      entityId: id,
      requestId: contract.requestId,
    },
  });

  return c.json({ data: contract });
});

// Upload contract file
contractsRouter.patch("/:id/file", async (c) => {
  const { id } = c.req.param();
  const { fileUrl } = await c.req.json();

  const contract = await prisma.contract.update({
    where: { id },
    data: { fileUrl },
  });

  return c.json({ data: contract });
});

// Delete contract
contractsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  await prisma.contract.delete({
    where: { id },
  });

  return c.body(null, 204);
});
