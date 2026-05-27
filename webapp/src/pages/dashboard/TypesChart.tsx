import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TypeCount {
  type: string;
  count: number;
  amount: number;
}

const typeLabels: Record<string, string> = {
  personal: "شخصي",
  mortgage: "عقاري",
  car: "سيارات",
  business: "تجاري",
  education: "تعليمي",
  other: "أخرى",
};

export function TypesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-types-chart"],
    queryFn: () => api.get<TypeCount[]>("/api/dashboard/charts/types"),
  });

  const chartData = data?.map((item) => ({
    name: typeLabels[item.type] || item.type,
    count: item.count,
    amount: item.amount,
  })) || [];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">الطلبات حسب نوع التمويل</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 16%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(215 20% 55%)"
                  fontSize={12}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 9%)",
                    border: "1px solid hsl(222 47% 16%)",
                    borderRadius: "8px",
                    direction: "rtl",
                  }}
                />
                <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
