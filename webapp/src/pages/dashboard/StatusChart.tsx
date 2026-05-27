import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface StatusCount {
  status: string;
  count: number;
}

const statusLabels: Record<string, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  documents_required: "مطلوب مستندات",
  approved: "موافق عليه",
  rejected: "مرفوض",
  completed: "مكتمل",
};

const statusColors: Record<string, string> = {
  new: "#3b82f6",
  under_review: "#f59e0b",
  documents_required: "#a855f7",
  approved: "#10b981",
  rejected: "#ef4444",
  completed: "#14b8a6",
};

export function StatusChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-status-chart"],
    queryFn: () => api.get<StatusCount[]>("/api/dashboard/charts/status"),
  });

  const chartData = data?.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    color: statusColors[item.status] || "#6b7280",
  })) || [];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">توزيع الطلبات حسب الحالة</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 9%)",
                    border: "1px solid hsl(222 47% 16%)",
                    borderRadius: "8px",
                    direction: "rtl",
                  }}
                  formatter={(value) => [value ?? 0, "عدد الطلبات"]}
                />
                <Legend
                  layout="vertical"
                  align="left"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
