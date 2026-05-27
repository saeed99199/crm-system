import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Users,
  ScrollText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentRequestsTable } from "./RecentRequestsTable";
import { StatusChart } from "./StatusChart";
import { TypesChart } from "./TypesChart";

interface DashboardStats {
  totalRequests: number;
  newRequests: number;
  underReview: number;
  approved: number;
  rejected: number;
  completed: number;
  totalFinancingValue: number;
  totalCustomers: number;
  totalContracts: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/api/dashboard/stats"),
  });

  const statCards = [
    {
      title: "إجمالي الطلبات",
      value: stats?.totalRequests || 0,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "طلبات جديدة",
      value: stats?.newRequests || 0,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "قيد المراجعة",
      value: stats?.underReview || 0,
      icon: AlertCircle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "موافق عليها",
      value: stats?.approved || 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "مرفوضة",
      value: stats?.rejected || 0,
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "مكتملة",
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
    },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">
            مرحباً بك في نظام إدارة الحلول الذكية للاستشارات المالية
          </p>
        </div>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">إجمالي قيمة التمويلات</p>
          <p className="text-2xl font-bold gradient-text tabular-nums-ar">
            {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats?.totalFinancingValue || 0)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card group cursor-pointer">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground tabular-nums-ar">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tabular-nums-ar">{stats?.totalCustomers || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <ScrollText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العقود</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tabular-nums-ar">{stats?.totalContracts || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نسبة الموافقة</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tabular-nums-ar">
                    {stats?.totalRequests
                      ? Math.round((stats.approved / stats.totalRequests) * 100)
                      : 0}
                    %
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart />
        <TypesChart />
      </div>

      {/* Recent Requests */}
      <RecentRequestsTable />
    </div>
  );
}
