import { Hono } from "hono";
import { prisma } from "../prisma";

export const dashboardRouter = new Hono();

// Get dashboard statistics
dashboardRouter.get("/stats", async (c) => {
  const [
    totalRequests,
    newRequests,
    underReview,
    approved,
    rejected,
    completed,
    totalCustomers,
    totalContracts,
    financingSum,
  ] = await Promise.all([
    prisma.financingRequest.count(),
    prisma.financingRequest.count({ where: { status: "new" } }),
    prisma.financingRequest.count({ where: { status: "under_review" } }),
    prisma.financingRequest.count({ where: { status: "approved" } }),
    prisma.financingRequest.count({ where: { status: "rejected" } }),
    prisma.financingRequest.count({ where: { status: "completed" } }),
    prisma.customer.count(),
    prisma.contract.count(),
    prisma.financingRequest.aggregate({
      _sum: { approvedAmount: true },
    }),
  ]);

  const stats = {
    totalRequests,
    newRequests,
    underReview,
    approved,
    rejected,
    completed,
    totalFinancingValue: financingSum._sum.approvedAmount || 0,
    totalCustomers,
    totalContracts,
  };

  return c.json({ data: stats });
});

// Get requests by status for chart
dashboardRouter.get("/charts/status", async (c) => {
  const statusCounts = await prisma.financingRequest.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const data = statusCounts.map((item) => ({
    status: item.status,
    count: item._count.id,
  }));

  return c.json({ data });
});

// Get requests by financing type
dashboardRouter.get("/charts/types", async (c) => {
  const typeCounts = await prisma.financingRequest.groupBy({
    by: ["financingType"],
    _count: { id: true },
    _sum: { requestedAmount: true },
  });

  const data = typeCounts.map((item) => ({
    type: item.financingType,
    count: item._count.id,
    amount: item._sum.requestedAmount || 0,
  }));

  return c.json({ data });
});

// Get monthly requests trend
dashboardRouter.get("/charts/trend", async (c) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const requests = await prisma.financingRequest.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
      status: true,
      requestedAmount: true,
    },
  });

  // Group by month
  const monthlyData: Record<string, { requests: number; amount: number }> = {};

  requests.forEach((req) => {
    const monthKey = req.createdAt.toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { requests: 0, amount: 0 };
    }
    monthlyData[monthKey].requests++;
    monthlyData[monthKey].amount += req.requestedAmount;
  });

  const data = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      requests: values.requests,
      amount: values.amount,
    }));

  return c.json({ data });
});

// Get recent activity
dashboardRouter.get("/activity", async (c) => {
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: {
        select: { id: true, name: true },
      },
      request: {
        select: { id: true, requestNumber: true },
      },
    },
  });

  return c.json({ data: activities });
});

// Get recent requests
dashboardRouter.get("/recent-requests", async (c) => {
  const requests = await prisma.financingRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return c.json({ data: requests });
});
