import { Hono } from "hono";
import { prisma } from "../prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";

export const employeesRouter = new Hono();

const UpdateRoleSchema = z.object({
  role: z.enum(["admin", "manager", "employee", "viewer"]),
});

const UpdateHiddenPagesSchema = z.object({
  hiddenPages: z.string(), // comma-separated page keys e.g. "dashboard,customers"
});

const CreateEmployeeSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["admin", "manager", "employee", "viewer"]).default("employee"),
});

const UpdatePasswordSchema = z.object({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

// Get all employees (users)
employeesRouter.get("/", async (c) => {
  const { role, search } = c.req.query();

  const where: any = {};

  if (role && role !== "all") {
    where.role = role;
  }

  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  }

  const employees = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hiddenPages: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { assignedRequests: true },
      },
    },
  });

  return c.json({ data: employees });
});

// Get single employee
employeesRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hiddenPages: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      assignedRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!employee) {
    return c.json({ error: { message: "الموظف غير موجود" } }, 404);
  }

  return c.json({ data: employee });
});

// Create employee
employeesRouter.post("/", zValidator("json", CreateEmployeeSchema), async (c) => {
  const data = c.req.valid("json");

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return c.json({ error: { message: "البريد الإلكتروني مستخدم بالفعل" } }, 400);
  }

  // Generate a unique ID for the user
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Hash the password using bcrypt (compatible with Better Auth)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const employee = await prisma.user.create({
    data: {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      emailVerified: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hiddenPages: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Create credential account with password
  await prisma.account.create({
    data: {
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hashedPassword,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "employee_created",
      description: `تم إضافة موظف جديد: ${employee.name}`,
      entityType: "user",
      entityId: employee.id,
    },
  });

  return c.json({ data: employee }, 201);
});

// Update employee
employeesRouter.put("/:id", zValidator("json", CreateEmployeeSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");

  // Check if email already exists for another user
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
    });

    if (existing) {
      return c.json({ error: { message: "البريد الإلكتروني مستخدم بالفعل" } }, 400);
    }
  }

  const employee = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.role && { role: data.role }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hiddenPages: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({ data: employee });
});

// Update employee role
employeesRouter.patch("/:id/role", zValidator("json", UpdateRoleSchema), async (c) => {
  const { id } = c.req.param();
  const { role } = c.req.valid("json");

  const employee = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Log activity
  const roleLabels: Record<string, string> = {
    admin: "مدير",
    manager: "مشرف",
    employee: "موظف",
    viewer: "مشاهد",
  };

  await prisma.activityLog.create({
    data: {
      action: "role_changed",
      description: `تم تغيير صلاحية ${employee.name} إلى "${roleLabels[role]}"`,
      entityType: "user",
      entityId: id,
      userId: id,
    },
  });

  return c.json({ data: employee });
});

// Update employee hidden pages
employeesRouter.patch("/:id/hidden-pages", zValidator("json", UpdateHiddenPagesSchema), async (c) => {
  const { id } = c.req.param();
  const { hiddenPages } = c.req.valid("json");

  const employee = await prisma.user.update({
    where: { id },
    data: { hiddenPages },
    select: {
      id: true,
      name: true,
      hiddenPages: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "pages_updated",
      description: `تم تحديث الصفحات المرئية للموظف ${employee.name}`,
      entityType: "user",
      entityId: id,
      userId: id,
    },
  });

  return c.json({ data: employee });
});

// Delete employee
employeesRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const employee = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!employee) {
    return c.json({ error: { message: "الموظف غير موجود" } }, 404);
  }

  // Delete related sessions and accounts first
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.account.deleteMany({ where: { userId: id } });

  // Update assigned requests to remove assignment
  await prisma.financingRequest.updateMany({
    where: { assignedEmployeeId: id },
    data: { assignedEmployeeId: null },
  });

  // Delete the user
  await prisma.user.delete({ where: { id } });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "employee_deleted",
      description: `تم حذف الموظف: ${employee.name}`,
      entityType: "user",
      entityId: id,
    },
  });

  return c.body(null, 204);
});

// Get employee activity log
employeesRouter.get("/:id/activity", async (c) => {
  const { id } = c.req.param();

  const activities = await prisma.activityLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ data: activities });
});

// Update employee password
employeesRouter.patch("/:id/password", zValidator("json", UpdatePasswordSchema), async (c) => {
  const { id } = c.req.param();
  const { password } = c.req.valid("json");

  const employee = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!employee) {
    return c.json({ error: { message: "الموظف غير موجود" } }, 404);
  }

  // Hash the new password using bcrypt (compatible with Better Auth)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update or create credential account
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: id,
      providerId: "credential",
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashedPassword,
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "password_changed",
      description: `تم تغيير كلمة مرور ${employee.name}`,
      entityType: "user",
      entityId: id,
    },
  });

  return c.json({ data: { success: true, message: "تم تغيير كلمة المرور بنجاح" } });
});
